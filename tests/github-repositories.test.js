/** GitHub 公开仓库响应、唯一标识及失败状态的行为回归。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeGithubRepos } from '../src/lib/utils/domain/github.ts';

/** @param {number} id @param {string} name */
const repo = (id, name) => ({
	id,
	name,
	html_url: `https://github.com/test/${name}`,
	stargazers_count: 3,
	forks_count: 1,
	language: 'TypeScript'
});

test('按 ID 和 URL 同时去重，生成稳定的仓库列表键', () => {
	const repositories = normalizeGithubRepos([
		repo(1, 'One'),
		repo(1, 'Renamed'),
		{ ...repo(2, 'One'), html_url: 'https://github.com/TEST/one/?tab=readme' },
		repo(3, 'Two')
	]);
	assert.deepEqual(
		repositories.map((value) => value.id),
		['repo:1', 'repo:3']
	);
	assert.deepEqual(
		repositories.map((value) => value.stars),
		[3, 3]
	);
});

test('拒绝错误响应、非 GitHub 链接和缺失统计，不生成虚构项目', () => {
	assert.throws(() => normalizeGithubRepos({ message: 'rate limited' }), /Invalid GitHub/);
	for (const invalid of [
		{ ...repo(1, 'One'), html_url: 'https://github.com.evil.test/test/One' },
		{ ...repo(1, 'One'), html_url: 'javascript:alert(1)' },
		{ ...repo(1, 'One'), html_url: 'https://username:password@github.com/test/One' },
		{ ...repo(1, 'One'), stargazers_count: -1 },
		{ ...repo(1, 'One'), stargazers_count: undefined },
		{ ...repo(1, 'One'), private: true }
	]) {
		assert.throws(() => normalizeGithubRepos([invalid]), /Invalid GitHub/);
	}
	assert.deepEqual(normalizeGithubRepos([]), []);
});

test('公开列表最多展示六个有效仓库，支持没有语言及 ID 的合法响应', () => {
	const repositories = normalizeGithubRepos(
		Array.from({ length: 9 }, (_, index) => ({
			...repo(index + 1, `Repo${index}`),
			language: null
		}))
	);
	assert.equal(repositories.length, 6);
	assert.equal(repositories[0].language, '');
	const withoutId = normalizeGithubRepos([{ ...repo(1, 'One'), id: undefined }]);
	assert.equal(withoutId[0].id, 'https://github.com/test/one');
});
