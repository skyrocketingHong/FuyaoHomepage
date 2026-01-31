/**
 * 年龄计算工具
 *
 * 提供统一的年龄计算逻辑，避免在多个组件中重复计算。
 */

/** 个人出生日期常量 */
export const BIRTH_DATE = import.meta.env.VITE_USER_BIRTH_DATE;

/**
 * 计算从出生日期到当前的年龄
 *
 * @param birthDate - 出生日期字符串 (格式: 'YYYY-MM-DD')
 * @returns 年龄（取整）
 *
 * @example
 * calculateAge('1999-02-11') // 26 (取决于当前日期)
 */
export function calculateAge(birthDate: string = BIRTH_DATE): number {
    return Math.floor(
        (new Date().getTime() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
    );
}
