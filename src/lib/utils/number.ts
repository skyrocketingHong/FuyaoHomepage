/**
 * 数字格式化工具函数
 *
 * 提供数字到中文大写和英文单词的转换功能。
 */

/**
 * 将数字转换为中文大写
 *
 * @param n - 要转换的数字
 * @returns 中文大写表示（如：壹仟贰佰叁拾肆）
 *
 * @example
 * numberToChinese(1234) // "壹仟贰佰叁拾肆"
 * numberToChinese(0) // "零"
 */
export function numberToChinese(n: number): string {
    if (n === 0) return '零';
    if (!/^\d+$/.test(n.toString())) return '数据非法';

    const unitChars = '仟佰拾亿仟佰拾万仟佰拾';
    let str = '';
    const nStr = n.toString();

    for (let i = 0; i < nStr.length; i++) {
        const digit = parseInt(nStr.charAt(i));
        const pos = nStr.length - 1 - i; // Position from right (0-based)

        let u = '';
        if (pos > 0) {
            if (pos <= unitChars.length) {
                u = unitChars.charAt(unitChars.length - pos);
            }
        }

        str += '零壹贰叁肆伍陆柒捌玖'.charAt(digit) + u;
    }

    return str
        .replace(/零(仟|佰|拾)/g, '零')
        .replace(/(零)+/g, '零')
        .replace(/零(万|亿)/g, '$1')
        .replace(/(亿)万|壹(拾)/g, '$1$2')
        .replace(/^壹拾/, '拾')
        .replace(/零$/, '');
}

/**
 * 将数字转换为英文单词表示
 *
 * 支持 0 到 999,999 的数字。
 *
 * @param n - 要转换的数字
 * @returns 英文单词表示（如：One Thousand Two Hundred Thirty-Four）
 *
 * @example
 * numberToEnglish(1234) // "One Thousand Two Hundred Thirty-Four"
 * numberToEnglish(0) // "Zero"
 */
export function numberToEnglish(n: number): string {
    if (n === 0) return 'Zero';

    const ones = [
        '',
        'One',
        'Two',
        'Three',
        'Four',
        'Five',
        'Six',
        'Seven',
        'Eight',
        'Nine',
        'Ten',
        'Eleven',
        'Twelve',
        'Thirteen',
        'Fourteen',
        'Fifteen',
        'Sixteen',
        'Seventeen',
        'Eighteen',
        'Nineteen'
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    // 递归处理不同位数
    function convert(num: number): string {
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? '-' + ones[num % 10] : '');
        if (num < 1000)
            return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '');
        if (num < 1000000)
            return (
                convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '')
            );
        return n.toString(); // Fallback for larger numbers
    }

    return convert(n);
}
