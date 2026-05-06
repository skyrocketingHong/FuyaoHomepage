/**
 * Cloudflare Analytics Worker
 *
 * 代理 Cloudflare GraphQL Analytics API，避免在前端暴露 API Token。
 * 查询近 7 天的页面浏览量、独立访客数和总请求数。
 *
 * 环境 Secrets（通过 wrangler secret put 配置）:
 *   - CF_API_TOKEN: Cloudflare API Token（需 Analytics:Read 权限）
 *   - CF_ZONE_ID: Cloudflare Zone ID
 *
 * 环境变量（在 wrangler.toml 中配置）:
 *   - ALLOWED_ORIGIN: 允许跨域访问的域名
 */

/**
 * 构建 GraphQL 查询（近 7 天按天分组的 HTTP 请求统计）
 *
 * @param {string} zoneId - Cloudflare Zone ID
 * @returns {{ query: string, variables: object }} GraphQL 请求体
 */
function buildQuery(zoneId) {
	const now = new Date();
	const sevenDaysAgo = new Date(now);
	sevenDaysAgo.setDate(now.getDate() - 7);

	// 格式化为 YYYY-MM-DD
	const dateEnd = now.toISOString().split('T')[0];
	const dateStart = sevenDaysAgo.toISOString().split('T')[0];

	return {
		query: `query GetAnalytics($zoneTag: string!, $dateStart: Date!, $dateEnd: Date!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(
            limit: 7
            filter: { date_geq: $dateStart, date_leq: $dateEnd }
            orderBy: [date_ASC]
          ) {
            dimensions { date }
            sum { requests, pageViews }
            uniq { uniques }
          }
        }
      }
    }`,
		variables: {
			zoneTag: zoneId,
			dateStart,
			dateEnd
		}
	};
}

/**
 * 构建 CORS 响应头
 *
 * @param {string} allowedOrigin - 允许的来源域名
 * @returns {object} CORS 响应头
 */
function corsHeaders(allowedOrigin) {
	return {
		'Access-Control-Allow-Origin': allowedOrigin,
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Max-Age': '86400'
	};
}

export default {
	/**
	 * Worker 请求处理入口
	 *
	 * @param {Request} request - 传入的 HTTP 请求
	 * @param {object} env - 环境变量和 Secrets
	 * @returns {Response} 响应
	 */
	async fetch(request, env) {
		const origin = env.ALLOWED_ORIGIN || '*';
		const headers = corsHeaders(origin);

		// 处理 CORS 预检请求
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers });
		}

		// 仅允许 GET 请求
		if (request.method !== 'GET') {
			return new Response(JSON.stringify({ error: '仅支持 GET 请求' }), {
				status: 405,
				headers: { ...headers, 'Content-Type': 'application/json' }
			});
		}

		try {
			const body = buildQuery(env.CF_ZONE_ID);

			// 调用 Cloudflare GraphQL API
			const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${env.CF_API_TOKEN}`
				},
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				const errText = await response.text();
				return new Response(JSON.stringify({ error: 'Cloudflare API 请求失败', detail: errText }), {
					status: response.status,
					headers: { ...headers, 'Content-Type': 'application/json' }
				});
			}

			const data = await response.json();
			const zones = data?.data?.viewer?.zones;

			if (!zones || zones.length === 0) {
				return new Response(JSON.stringify({ error: '未找到 Zone 数据，请检查 Zone ID' }), {
					status: 404,
					headers: { ...headers, 'Content-Type': 'application/json' }
				});
			}

			// 提取并精简数据
			const groups = zones[0].httpRequests1dGroups || [];
			const result = {
				days: groups.map((g) => ({
					date: g.dimensions.date,
					pageViews: g.sum.pageViews,
					requests: g.sum.requests,
					uniques: g.uniq.uniques
				})),
				totals: groups.reduce(
					(acc, g) => ({
						pageViews: acc.pageViews + g.sum.pageViews,
						requests: acc.requests + g.sum.requests,
						uniques: acc.uniques + g.uniq.uniques
					}),
					{ pageViews: 0, requests: 0, uniques: 0 }
				)
			};

			return new Response(JSON.stringify(result), {
				headers: {
					...headers,
					'Content-Type': 'application/json',
					// 缓存 5 分钟
					'Cache-Control': 'public, max-age=300'
				}
			});
		} catch (e) {
			return new Response(JSON.stringify({ error: '内部错误', detail: e.message }), {
				status: 500,
				headers: { ...headers, 'Content-Type': 'application/json' }
			});
		}
	}
};
