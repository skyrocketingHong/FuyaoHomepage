/** GitHub 公开仓库响应校验与去重，避免失败占位和重复列表键。 */
export interface GithubRepo {
	id: string;
	name: string;
	description: string;
	stars: number;
	forks: number;
	language: string;
	url: string;
}

function repositoryUrl(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	try {
		const url = new URL(value);
		if (
			url.protocol !== 'https:' ||
			url.hostname !== 'github.com' ||
			url.port ||
			url.username ||
			url.password ||
			!/^\/[\w.-]+\/[\w.-]+\/?$/.test(url.pathname)
		)
			return null;
		return `https://github.com${url.pathname.replace(/\/$/, '')}`;
	} catch {
		return null;
	}
}

function isCount(value: unknown): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** 只展示有效公开仓库；按 ID 和规范 URL 同时去重。 */
export function normalizeGithubRepos(payload: unknown): GithubRepo[] {
	if (!Array.isArray(payload)) throw new Error('Invalid GitHub repository response');
	const repositories: GithubRepo[] = [];
	const ids = new Set<string>();
	const urls = new Set<string>();
	for (const value of payload) {
		if (!value || typeof value !== 'object') continue;
		const repo = value as Record<string, unknown>;
		const url = repositoryUrl(repo.html_url);
		if (
			!url ||
			repo.private === true ||
			typeof repo.name !== 'string' ||
			!repo.name.trim() ||
			!isCount(repo.stargazers_count) ||
			!isCount(repo.forks_count)
		)
			continue;
		const id = isCount(repo.id) ? `repo:${repo.id}` : url.toLowerCase();
		const urlKey = url.toLowerCase();
		if (ids.has(id) || urls.has(urlKey)) continue;
		ids.add(id);
		urls.add(urlKey);
		repositories.push({
			id,
			name: repo.name.trim(),
			description: typeof repo.description === 'string' ? repo.description : '',
			stars: repo.stargazers_count,
			forks: repo.forks_count,
			language: typeof repo.language === 'string' ? repo.language : '',
			url
		});
		if (repositories.length === 6) break;
	}
	if (payload.length > 0 && repositories.length === 0) {
		throw new Error('Invalid GitHub repository response');
	}
	return repositories;
}
