#!/usr/bin/env python3
"""Serve fixed public JSON endpoints with persistent stale-while-revalidate caching."""

import hashlib
import json
import os
import tempfile
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


ALLOWED_ROUTES = frozenset(
    (
        "/api/github/repos",
        "/api/stats/cloudflare",
        "/api/stats/wakatime/activity",
        "/api/stats/wakatime/languages",
    )
)
MAX_RESPONSE_BYTES = 2 * 1024 * 1024


class UpstreamUnavailable(Exception):
    """An upstream did not produce a usable public payload."""


def validate_payload(route, data):
    """Reject error objects and invalid response shapes before replacing good data."""
    if route == "/api/github/repos":
        valid = isinstance(data, list) and all(
            isinstance(row, dict)
            and isinstance(row.get("name"), str)
            and isinstance(row.get("html_url"), str)
            and row["html_url"].startswith("https://github.com/")
            for row in data
        )
    elif route == "/api/stats/cloudflare":
        valid = (
            isinstance(data, dict)
            and isinstance(data.get("days"), list)
            and isinstance(data.get("totals"), dict)
            and all(
                isinstance(row, dict) and isinstance(row.get("date"), str)
                for row in data["days"]
            )
            and all(
                isinstance(data["totals"].get(key), (int, float))
                for key in ("pageViews", "requests", "uniques")
            )
        )
    else:
        valid = isinstance(data, dict) and isinstance(data.get("data"), list)
        if valid and route.endswith("/activity"):
            valid = all(
                isinstance(row, dict)
                and isinstance(row.get("range"), dict)
                and isinstance(row["range"].get("date"), str)
                and isinstance(row.get("grand_total"), dict)
                and isinstance(row["grand_total"].get("total_seconds"), (int, float))
                for row in data["data"]
            )
        elif valid:
            valid = all(
                isinstance(row, dict)
                and isinstance(row.get("name"), str)
                and isinstance(row.get("percent"), (int, float))
                for row in data["data"]
            )
    if not valid:
        raise UpstreamUnavailable("Invalid public response")


def fetch_json(route, upstream):
    headers = {
        "User-Agent": "FuyaoHomepage-PublicData/1.0",
        "Accept": (
            "application/vnd.github+json"
            if route == "/api/github/repos"
            else "application/json"
        ),
    }
    request = Request(upstream, headers=headers)
    # ASVS 13.2.6: one bounded upstream request per route, shared by all callers.
    with urlopen(request, timeout=6) as response:
        content_type = response.headers.get_content_type()
        if content_type != "application/json" and not content_type.endswith("+json"):
            raise UpstreamUnavailable("Unexpected public response type")
        raw = response.read(MAX_RESPONSE_BYTES + 1)
        if len(raw) > MAX_RESPONSE_BYTES:
            raise UpstreamUnavailable("Public response too large")
    return json.loads(raw)


class PublicDataCache:
    """Cache each configured route independently and coalesce concurrent refreshes."""

    def __init__(
        self,
        routes,
        directory,
        ttl=300,
        stale_max=86400,
        cooldown=30,
        fetcher=fetch_json,
        clock=time.time,
    ):
        # ASVS 13.2.4: clients can select only these fixed, server-configured routes.
        if not routes or not set(routes).issubset(ALLOWED_ROUTES):
            raise ValueError("Invalid public route configuration")
        for route, upstream in routes.items():
            parsed = urlsplit(upstream)
            if (
                parsed.scheme != "https"
                or not parsed.hostname
                or parsed.username
                or parsed.password
                or parsed.fragment
            ):
                raise ValueError("Public upstream must be an HTTPS URL")
            if route == "/api/github/repos" and parsed.hostname != "api.github.com":
                raise ValueError("GitHub upstream must use api.github.com")
            if route.startswith("/api/stats/wakatime/") and parsed.hostname != "wakatime.com":
                raise ValueError("WakaTime upstream must use wakatime.com")
        if not 1 <= ttl <= stale_max <= 7 * 86400 or not 1 <= cooldown <= 300:
            raise ValueError("Invalid public cache duration")
        self.routes = dict(routes)
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)
        self.ttl = ttl
        self.stale_max = stale_max
        self.cooldown = cooldown
        self.fetcher = fetcher
        self.clock = clock
        self.entries = {}
        self.retry_after = {}
        self.locks = {route: threading.Lock() for route in routes}
        self.guard = threading.Lock()
        self._load_disk()

    def _cache_file(self, route):
        return self.directory / (hashlib.sha256(route.encode()).hexdigest() + ".json")

    def _load_disk(self):
        for route in self.routes:
            try:
                filename = self._cache_file(route)
                if filename.stat().st_size > MAX_RESPONSE_BYTES + 1024:
                    continue
                entry = json.loads(filename.read_bytes())
                timestamp = float(entry["updatedAt"])
                if not 0 <= self.clock() - timestamp <= self.stale_max:
                    continue
                validate_payload(route, entry["data"])
                payload = json.dumps(entry["data"], ensure_ascii=False, allow_nan=False).encode()
                self.entries[route] = (timestamp, payload)
            except (OSError, ValueError, TypeError, KeyError, UpstreamUnavailable):
                continue

    def _save_disk(self, route, timestamp, data):
        temporary = None
        try:
            # ASVS 13.3.1: persist only public payloads, never upstream URLs or secrets.
            with tempfile.NamedTemporaryFile(
                mode="w", encoding="utf-8", dir=self.directory, delete=False
            ) as output:
                temporary = Path(output.name)
                json.dump({"updatedAt": timestamp, "data": data}, output, ensure_ascii=False, allow_nan=False)
                output.flush()
                os.fsync(output.fileno())
            os.replace(temporary, self._cache_file(route))
        except OSError:
            print("public-data cache persistence failed", route, flush=True)
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)

    def _refresh_locked(self, route):
        with self.guard:
            if self.clock() < self.retry_after.get(route, 0):
                raise UpstreamUnavailable("Public upstream is cooling down")
        try:
            data = self.fetcher(route, self.routes[route])
            validate_payload(route, data)
            payload = json.dumps(data, ensure_ascii=False, allow_nan=False).encode()
            if len(payload) > MAX_RESPONSE_BYTES:
                raise UpstreamUnavailable("Public response too large")
            timestamp = self.clock()
            self._save_disk(route, timestamp, data)
            with self.guard:
                self.entries[route] = (timestamp, payload)
                self.retry_after.pop(route, None)
            return timestamp, payload
        except Exception:
            with self.guard:
                self.retry_after[route] = self.clock() + self.cooldown
            # Upstream exceptions can contain private URLs; never log their text.
            print("public-data refresh failed", route, flush=True)
            raise UpstreamUnavailable("Public upstream unavailable") from None

    def _refresh_background(self, route):
        try:
            self._refresh_locked(route)
        except UpstreamUnavailable:
            pass
        finally:
            self.locks[route].release()

    def get(self, route):
        if route not in self.routes:
            raise KeyError(route)
        with self.guard:
            entry = self.entries.get(route)
            cooling_down = self.clock() < self.retry_after.get(route, 0)
        if entry and 0 <= self.clock() - entry[0] <= self.stale_max:
            if self.clock() - entry[0] <= self.ttl:
                return entry[1], "fresh", entry[0]
            if not cooling_down and self.locks[route].acquire(blocking=False):
                threading.Thread(
                    target=self._refresh_background, args=(route,), daemon=True
                ).start()
            return entry[1], "stale", entry[0]

        with self.locks[route]:
            # A preceding cold request may have populated the cache while we waited.
            with self.guard:
                entry = self.entries.get(route)
            if entry and 0 <= self.clock() - entry[0] <= self.ttl:
                return entry[1], "fresh", entry[0]
            timestamp, payload = self._refresh_locked(route)
            return payload, "miss", timestamp


def make_handler(cache):
    class PublicDataHandler(BaseHTTPRequestHandler):
        def log_message(self, _format, *_args):
            # Avoid logging client query strings and private upstream addresses.
            return

        def _reply(self, status, payload, headers=None):
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("X-Content-Type-Options", "nosniff")
            for key, value in (headers or {"Cache-Control": "no-store"}).items():
                self.send_header(key, value)
            self.end_headers()
            self.wfile.write(payload)

        def do_GET(self):
            # Do not forward client queries or allow a client-provided upstream URL.
            if self.path not in cache.routes:
                self._reply(404, b'{"error":"Not found"}')
                return
            try:
                payload, state, timestamp = cache.get(self.path)
                updated_at = datetime.fromtimestamp(timestamp, timezone.utc).isoformat()
                self._reply(
                    200,
                    payload,
                    {
                        "Cache-Control": "public, max-age=60, stale-while-revalidate=300, stale-if-error=86400",
                        "X-Data-Cache": state,
                        "X-Data-Updated-At": updated_at,
                    },
                )
            except UpstreamUnavailable:
                self._reply(503, b'{"error":"Public data temporarily unavailable"}', {"Cache-Control": "no-store", "Retry-After": str(cache.cooldown)})

        def _method_not_allowed(self):
            self._reply(405, b'{"error":"Method not allowed"}', {"Allow": "GET", "Cache-Control": "no-store"})

        do_POST = do_PUT = do_DELETE = do_PATCH = do_OPTIONS = do_HEAD = _method_not_allowed

    return PublicDataHandler


def main():
    config_path = os.environ["FUYAO_PUBLIC_DATA_CONFIG"]
    config = json.loads(Path(config_path).read_bytes())
    cache = PublicDataCache(
        config["routes"],
        os.environ["FUYAO_PUBLIC_DATA_CACHE"],
        ttl=config.get("ttlSeconds", 300),
        stale_max=config.get("staleMaxSeconds", 86400),
        cooldown=config.get("cooldownSeconds", 30),
    )
    port = int(os.environ.get("FUYAO_PUBLIC_DATA_PORT", "3191"))
    server = ThreadingHTTPServer(("127.0.0.1", port), make_handler(cache))
    print("public-data listening on loopback", port, flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
