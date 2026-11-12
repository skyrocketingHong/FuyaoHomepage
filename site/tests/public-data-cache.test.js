/** Run the stdlib cache service's behavior tests through the existing Node test entry point. */
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('公开数据缓存合并请求、保留过期成功数据、跨重启恢复并拒绝未知路径', () => {
	execFileSync(
		'python3',
		[fileURLToPath(new URL('./public_data_cache_test.py', import.meta.url))],
		{
			encoding: 'utf8',
			timeout: 10_000,
			env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }
		}
	);
});
