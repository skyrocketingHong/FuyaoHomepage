"""Behavior tests for public cache persistence, request coalescing, and failure recovery."""

import concurrent.futures
import importlib.util
import json
import tempfile
import threading
import time
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import urlopen


SPEC = importlib.util.spec_from_file_location(
    "public_data", Path(__file__).resolve().parents[1] / "scripts/serve-public-data.py"
)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
ROUTE = "/api/github/repos"
UPSTREAM = "https://api.github.com/users/example/repos?per_page=6"
PAYLOAD = [{"name": "Example", "html_url": "https://github.com/example/Example"}]


class PublicDataCacheTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.now = 1000

    def create(self, fetcher):
        return MODULE.PublicDataCache(
            {ROUTE: UPSTREAM}, self.directory.name, ttl=10,
            stale_max=100, cooldown=5, fetcher=fetcher, clock=lambda: self.now
        )

    def test_concurrent_cold_requests_share_one_upstream_request(self):
        count = 0
        def fetch(_route, _url):
            nonlocal count
            count += 1
            time.sleep(0.04)
            return PAYLOAD
        cache = self.create(fetch)
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            results = list(pool.map(lambda _: cache.get(ROUTE), range(6)))
        self.assertEqual(count, 1)
        self.assertTrue(all(json.loads(result[0]) == PAYLOAD for result in results))
        self.assertEqual(sum(result[1] == "miss" for result in results), 1)

    def test_stale_is_immediate_and_failed_refresh_keeps_good_data(self):
        complete = threading.Event()
        count = 0
        def fetch(_route, _url):
            nonlocal count
            count += 1
            if count > 1:
                complete.set()
                raise TimeoutError("https://private.example/?token=should-not-leak")
            return PAYLOAD
        cache = self.create(fetch)
        cache.get(ROUTE)
        self.now += 20
        payload, state, timestamp = cache.get(ROUTE)
        self.assertEqual(state, "stale")
        self.assertEqual(timestamp, 1000)
        self.assertEqual(json.loads(payload), PAYLOAD)
        self.assertTrue(complete.wait(1))
        with cache.locks[ROUTE]:
            pass
        self.assertEqual(cache.get(ROUTE)[1], "stale")
        self.assertEqual(count, 2)
        persisted = json.loads(cache._cache_file(ROUTE).read_bytes())
        self.assertEqual(persisted["data"], PAYLOAD)
        self.assertNotIn("private.example", cache._cache_file(ROUTE).read_text())

    def test_invalid_json_shape_does_not_replace_good_cache(self):
        cache = self.create(lambda *_: PAYLOAD)
        cache.get(ROUTE)
        before = cache._cache_file(ROUTE).read_bytes()
        invalid_sources = [
            lambda *_: {"message": "rate limited"},
            lambda *_: json.loads("invalid JSON"),
        ]
        for source in invalid_sources:
            self.now += 20
            cache.fetcher = source
            self.assertEqual(cache.get(ROUTE)[1], "stale")
            with cache.locks[ROUTE]:
                pass
            self.assertEqual(cache._cache_file(ROUTE).read_bytes(), before)
            self.assertEqual(json.loads(cache.get(ROUTE)[0]), PAYLOAD)

    def test_disk_cache_survives_restart_without_upstream_request(self):
        self.create(lambda *_: PAYLOAD).get(ROUTE)
        restarted = self.create(lambda *_: self.fail("Fresh disk cache should not fetch"))
        self.assertEqual(restarted.get(ROUTE)[1], "fresh")
        self.assertEqual(json.loads(restarted.get(ROUTE)[0]), PAYLOAD)

    def test_cold_failure_is_cooled_down_and_expired_data_not_returned(self):
        cache = self.create(lambda *_: PAYLOAD)
        cache.get(ROUTE)
        self.now += 200
        count = 0
        def failed(*_):
            nonlocal count
            count += 1
            raise TimeoutError()
        cache.fetcher = failed
        for _ in range(2):
            with self.assertRaises(MODULE.UpstreamUnavailable):
                cache.get(ROUTE)
        self.assertEqual(count, 1)

    def test_unknown_paths_and_client_upstream_queries_are_rejected(self):
        cache = self.create(lambda *_: self.fail("Unknown paths must not fetch"))
        server = MODULE.ThreadingHTTPServer(("127.0.0.1", 0), MODULE.make_handler(cache))
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            for path in ["/unknown", ROUTE + "?upstream=https://example.com"]:
                with self.assertRaises(HTTPError) as result:
                    urlopen("http://127.0.0.1:" + str(server.server_port) + path)
                self.assertEqual(result.exception.code, 404)
                result.exception.close()
        finally:
            server.shutdown()
            server.server_close()
            worker.join()


if __name__ == "__main__":
    unittest.main()
