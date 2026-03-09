// 日期工具函数

// 格式化日期为 YYYY-MM-DD
export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 格式化日期为中文显示 (YYYY年MM月DD日)
export function formatDateCN(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// 格式化简短日期 (MM/DD)
export function formatDateShort(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 计算距今天数
export function daysFromNow(date) {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// 获取今天的 YYYY-MM-DD 格式
export function getToday() {
    return formatDate(new Date());
}

// 判断是否是过去的日期
export function isPastDate(date) {
    const d = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return d < now;
}

// 获取 N 个月前的日期
export function getMonthsAgo(months) {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return formatDate(d);
}

// 计算两个日期之间的天数
export function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs(Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
}
