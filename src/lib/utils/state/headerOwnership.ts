/**
 * 判断调用方是否仍持有 Header 插槽的当前注册权。
 *
 * 空 ID 从不代表所有权，旧组件持有的过期 ID 也不能清理新组件内容。
 */
export function ownsHeaderSlot(registrationId: string, currentId: string): boolean {
	return registrationId.length > 0 && registrationId === currentId;
}
