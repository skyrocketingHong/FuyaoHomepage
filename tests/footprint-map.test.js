/** 足迹重合点、同中心缩放及减少动态效果的行为回归。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { groupMarkersByPosition } from '../src/lib/components/footprint/map/core/markers.ts';

const controllerUrl = new URL(
	'../src/lib/components/footprint/map/core/viewController.svelte.ts',
	import.meta.url
);
const viewUrl = new URL('../src/lib/components/footprint/map/core/view.ts', import.meta.url);
const controllerSource = fs
	.readFileSync(controllerUrl, 'utf8')
	.replace("from './view'", `from '${viewUrl.href}'`);
const controllerJs = ts.transpileModule(controllerSource, {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
const { MapViewController } = await import(
	`data:text/javascript;base64,${Buffer.from(controllerJs).toString('base64')}`
);

/** @typedef {import('../src/lib/components/footprint/map/types').AMapInstance} MapInstance */
/** @typedef {import('../src/lib/components/footprint/map/types').MarkerConfig} MarkerConfig */

function createMap() {
	/** @type {Parameters<MapInstance['setZoomAndCenter']>[]} */
	const calls = [];
	/** @type {Record<string, boolean>[]} */
	const statuses = [];
	/** @type {MapInstance['setZoomAndCenter']} */
	const setZoomAndCenter = (...args) => {
		calls.push(args);
	};
	/** @type {MapInstance['setStatus']} */
	const setStatus = (status) => {
		statuses.push(status);
	};
	return {
		calls,
		statuses,
		getCenter: () => ({ getLng: () => 120, getLat: () => 30 }),
		getZoom: () => 10,
		setZoomAndCenter,
		setStatus
	};
}

test('同一坐标的多条足迹均保留，其他坐标独立分组', () => {
	/** @type {MarkerConfig} */
	const first = { id: 'first', position: [120, 30] };
	/** @type {MarkerConfig} */
	const second = { id: 'second', position: [120, 30] };
	/** @type {MarkerConfig} */
	const third = { id: 'third', position: [121, 31] };
	const groups = groupMarkersByPosition([first, second, third]);
	assert.equal(groups.size, 2);
	assert.deepEqual([...groups.values()], [[first, second], [third]]);
});

test('中心未移动但缩放级别变化时仍调用高德相机方法', () => {
	const controller = new MapViewController();
	const map = createMap();
	controller.mapInstance = map;
	controller.updateMapView([120, 30], 14);
	assert.deepEqual(map.calls, [[14, [120, 30], false, 300]]);
});

test('连续选择地点直接重设原生相机目标，没有延迟队列', () => {
	const controller = new MapViewController();
	const map = createMap();
	controller.mapInstance = map;
	controller.updateMapView([100, 20], 12);
	controller.updateMapView([121, 31], 14);
	assert.deepEqual(map.calls, [
		[12, [100, 20], false, 450],
		[14, [121, 31], false, 300]
	]);
});

test('开启减少动态效果先停止当前相机过渡，之后直接定位并关闭惯性', () => {
	const controller = new MapViewController();
	const map = createMap();
	controller.mapInstance = map;
	controller.setReducedMotion(true);
	controller.updateMapView([121, 31], 14);
	assert.deepEqual(map.calls, [
		[10, [120, 30], false, 0],
		[14, [121, 31], true, 300]
	]);
	assert.deepEqual(map.statuses, [{ animateEnable: false, jogEnable: false }]);
});
