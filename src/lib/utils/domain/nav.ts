/**
 * 判断路由是否处于激活状态
 *
 * @param currentPath 当前路径
 * @param itemPath 导航项路径
 * @returns boolean
 */
export function isActiveRoute(currentPath: string, itemPath: string) {
    if (itemPath === '/') {
        return currentPath === '/';
    }
    return currentPath.startsWith(itemPath);
}
