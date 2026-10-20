const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Shanghai',
});

/** 固定输出 YYYY-MM-DD，避免服务端与客户端因本地时区产生差异。 */
export function formatDate(iso: string | null): string {
  if (!iso) return '未发布';
  const parts = dateFormatter.formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** 经历时间只显示到月份：2023.04 */
export function formatMonth(value: string): string {
  const [year = '', month = ''] = value.split('-');
  return `${year}.${month}`;
}

export function formatRange(start: string, end: string | null): string {
  return `${formatMonth(start)} — ${end ? formatMonth(end) : '至今'}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Shanghai',
});

/** 后台修订记录等需要精确到分钟的场景。 */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function readingTimeLabel(minutes: number): string {
  return `${Math.max(1, minutes)} 分钟阅读`;
}
