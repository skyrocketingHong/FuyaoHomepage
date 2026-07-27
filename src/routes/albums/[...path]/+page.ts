/**
 * 相册页面数据加载
 *
 * 仅加载网格数据（索引 + 年份照片）。
 * 灯箱由客户端通过 history.pushState 管理，不触发 load 函数。
 *
 * 路由格式：
 * - /albums        → 网格（最新年份）
 * - /albums/2025   → 网格（指定年份）
 */
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { AlbumIndex, AlbumYearData, Photo, YearGroup, MonthGroup } from '$lib/types/album';

export const prerender = false;

function groupPhotosByMonth(year: number, photos: Photo[]): YearGroup {
	const monthMap = new Map<number, Photo[]>();

	for (const photo of photos) {
		const month = new Date(photo.date).getUTCMonth() + 1;
		if (!monthMap.has(month)) monthMap.set(month, []);
		monthMap.get(month)!.push(photo);
	}

	const sortedMonths = Array.from(monthMap.keys()).sort((a, b) => b - a);
	const months: MonthGroup[] = sortedMonths.map((month) => ({
		year,
		month,
		label: `${year}-${String(month).padStart(2, '0')}`,
		photos: monthMap.get(month)!
	}));

	return {
		year,
		label: String(year),
		months,
		totalPhotos: photos.length
	};
}

export const load: PageLoad = async ({ fetch, params }) => {
	const segments = (params.path || '').split('/').filter(Boolean);
	const isRoot = segments.length === 0;
	const isYearOnly = segments.length === 1 && /^\d{4}$/.test(segments[0]);
	const isYearMonth =
		segments.length === 2 && /^\d{4}$/.test(segments[0]) && /^(0[1-9]|1[0-2])$/.test(segments[1]);
	const isDeepLink =
		segments.length === 4 &&
		/^\d{4}$/.test(segments[0]) &&
		/^(0[1-9]|1[0-2])$/.test(segments[1]) &&
		/^(0[1-9]|[12]\d|3[01])$/.test(segments[2]) &&
		/^[A-Za-z0-9_-]+$/.test(segments[3]);

	if (!isRoot && !isYearOnly && !isYearMonth && !isDeepLink) {
		error(404, 'Album path not found');
	}

	// 加载轻量索引
	const indexRes = await fetch('/albums/index.json');
	if (!indexRes.ok) error(503, 'Album index unavailable');

	const albumIndex: AlbumIndex = await indexRes.json();

	if (albumIndex.totalPhotos === 0 || albumIndex.years.length === 0) {
		return { albumIndex, yearGroups: [], currentYear: 0, activeMonthId: '', deepLinkPhotoId: '' };
	}

	const requestedYear = isRoot ? albumIndex.years[0] : Number(segments[0]);
	if (!albumIndex.years.includes(requestedYear)) error(404, 'Album year not found');
	const currentYear = requestedYear;

	const activeMonthId = isYearMonth ? `${segments[0]}-${segments[1]}` : '';

	// 加载年份照片数据
	const yearRes = await fetch(`/albums/${currentYear}.json`);
	if (!yearRes.ok) error(503, 'Album year data unavailable');

	const yearData: AlbumYearData = await yearRes.json();
	const yearGroups = [groupPhotosByMonth(currentYear, yearData.photos)];

	if (isYearMonth && !yearGroups[0].months.some((month) => month.month === Number(segments[1]))) {
		error(404, 'Album month not found');
	}

	let deepLinkPhotoId = '';
	if (isDeepLink) {
		const photo = yearData.photos.find((candidate) => candidate.filename === segments[3]);
		if (!photo) error(404, 'Album photo not found');
		const date = new Date(photo.date);
		const expectedDate = [
			String(date.getUTCFullYear()),
			String(date.getUTCMonth() + 1).padStart(2, '0'),
			String(date.getUTCDate()).padStart(2, '0')
		];
		if (expectedDate.join('/') !== segments.slice(0, 3).join('/')) {
			error(404, 'Album photo date mismatch');
		}
		deepLinkPhotoId = photo.filename;
	}

	return { albumIndex, yearGroups, currentYear, activeMonthId, deepLinkPhotoId };
};
