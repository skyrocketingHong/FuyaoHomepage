/**
 * 日期处理工具
 * 
 * 基于 dayjs 提供日期格式化、相对时间计算及“最近”检查等功能。
 */
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import type { LocaleKey } from '$lib/i18n';

dayjs.extend(relativeTime);

/**
 * 根据指定语言环境格式化日期字符串或对象
 * @param date - 要格式化的日期
 * @param locale - 语言环境键 (zh-CN 或 en-US)
 * @param format - 可选的自定义格式字符串。如果未提供，则使用默认的本地化格式。
 */
export function formatDate(date: string | Date, locale: LocaleKey = 'zh-CN', format?: string): string {
    const d = dayjs(date);
    if (!d.isValid()) return '';

    // 将我们的语言环境键映射到 dayjs 语言环境键
    // dayjs 使用小写的 'zh-cn' 和 'en' (或 'en-us'，但 'en' 通常是默认值)
    const dayjsLocale = locale.toLowerCase() === 'zh-cn' ? 'zh-cn' : 'en';

    if (format) {
        return d.locale(dayjsLocale).format(format);
    }

    // 基于语言环境的默认格式
    if (dayjsLocale === 'zh-cn') {
        return d.locale('zh-cn').format('YYYY年M月D日');
    } else {
        return d.locale('en').format('MMMM D, YYYY');
    }
}

/**
 * 检查日期是否在过去 N 天内
 * @param date - 要检查的日期
 * @param days - 被视为"最近"的天数，默认为 7
 */
export function isRecent(date: string | Date, days = 7): boolean {
    const d = dayjs(date);
    if (!d.isValid()) return false;

    const now = dayjs();
    const diff = now.diff(d, 'day');
    return diff >= 0 && diff < days;
}

/**
 * 获取相对时间字符串 (例如 "2 days ago" 或 "2天前")
 */
export function fromNow(date: string | Date, locale: LocaleKey = 'zh-CN'): string {
    const d = dayjs(date);
    if (!d.isValid()) return '';

    const dayjsLocale = locale.toLowerCase() === 'zh-cn' ? 'zh-cn' : 'en';
    return d.locale(dayjsLocale).fromNow();
}

export { dayjs };
