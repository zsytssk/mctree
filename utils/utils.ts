export function callFunc(func: FuncVoid) {
    if (!isFunc(func)) {
        return;
    }
    func();
}

export function isFunc(func: FuncVoid): boolean {
    return func && typeof func === 'function';
}
export function generateRandomString() {
    return Math.random()
        .toString(36)
        .slice(2);
}
/**
 * 将秒数转化为00::00::00形式
 * num显示的位数, 秒,分,时, 2: 分秒
 */
export function formatTime(time, num) {
    const hours = Math.floor(time / 3600);
    const minuts = Math.floor((time % 3600) / 60);
    const seconds = time % 60;

    const time_arr = [hours, minuts, seconds];
    let time_str = '';
    /** 字符串是否开始, 排除前面为零的 但是不排除中间为零的 */
    let str_begin = false;
    for (let i = 0; i < time_arr.length; i++) {
        const item = time_arr[i];

        if (!str_begin && num) {
            if (time_arr.length - i <= num) {
                str_begin = true;
            }
        }
        if (!item && !str_begin) {
            continue;
        }
        if (!str_begin) {
            str_begin = true;
        }
        const item_str = item > 9 ? item + '' : '0' + item;
        time_str += item_str + ':';
    }
    return time_str.slice(0, -1);
}
export function calcStrLen(str) {
    return str.replace(/[^\x00-\xff]/g, '01').length;
}
export function ellipsisStr(text, max_len, append_str?) {
    /** 非NaN数字转化为字符串 */
    append_str = append_str || '..';
    if (typeof text === 'number' && text === text) {
        text = text + '';
    }
    /** 空字符串或者其他非法参数不做处理 */
    if (!text || typeof text !== 'string') {
        return '';
    }
    const text_len = calcStrLen(text);
    if (text_len <= max_len) {
        return text;
    }

    let result_str = '';
    let result_len = 0;
    /** 一个个的添加字符串如果字符串是中文+两位, 英文加一位 直到 长度超过max_len */
    for (const item of text) {
        if (/[^\x00-\xff]/.test(item)) {
            result_len += 2;
        } else {
            result_len += 1;
        }
        if (result_len > max_len - append_str.length) {
            // 因为最终的字符串要加上...显示字符串最大为max_len-3
            break;
        }
        result_str += item;
    }
    return result_str + append_str;
}
