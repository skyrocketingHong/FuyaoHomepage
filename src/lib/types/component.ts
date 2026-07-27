import type { Component } from 'svelte';

/** 可携带任意属性的运行期动态 Svelte 组件。 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 动态插槽在运行期校验并透传不同组件的属性。
export type DynamicComponent = Component<any>;
