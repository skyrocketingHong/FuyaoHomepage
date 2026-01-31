/**
 * 将文本转换为 URL 友好的 slug
 *
 * 保留中文字符，将空格转换为连字符，处理特殊符号。
 *
 * @param text - 输入文本
 * @returns 格式化后的 slug
 */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // 将空格替换为 -
        .replace(/&/g, '-and-') // 将 & 替换为 'and'
        // .replace(/[^\w\-]+/g, '') // 移除所有非单词字符 -> 我们想要保留中文字符！
        // 所以不是移除非单词字符，而是仅清理标准标点符号
        .replace(/[^\w\-\u4e00-\u9fa5]+/g, '') // 保留中文字符
        .replace(/--+/g, '-') // 将多个 - 替换为单个 -
        .replace(/^-+/, '') // 移除文本开头的 -
        .replace(/-+$/, ''); // 移除文本末尾的 -
}
