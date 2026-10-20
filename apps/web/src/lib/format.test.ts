import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatMonth, formatRange, readingTimeLabel } from './format';

describe('日期格式化', () => {
  it('按 Asia/Shanghai 输出 YYYY-MM-DD', () => {
    expect(formatDate('2026-10-20T06:00:00.000Z')).toBe('2026-10-20');
    // UTC 的 2026-01-01T00:00 在上海是当天 08:00，不应被减一天
    expect(formatDate('2026-01-01T00:00:00.000Z')).toBe('2026-01-01');
  });

  it('空值显示未发布', () => {
    expect(formatDate(null)).toBe('未发布');
  });

  it('月份与区间显示', () => {
    expect(formatMonth('2023-04-01')).toBe('2023.04');
    expect(formatRange('2023-04-01', '2025-06-30')).toBe('2023.04 — 2025.06');
    expect(formatRange('2023-04-01', null)).toBe('2023.04 — 至今');
  });

  it('阅读时长至少 1 分钟', () => {
    expect(readingTimeLabel(0)).toBe('1 分钟阅读');
    expect(readingTimeLabel(6)).toBe('6 分钟阅读');
  });

  it('精确到分钟的格式化使用上海时区', () => {
    expect(formatDateTime('2026-10-20T06:05:00.000Z')).toBe('2026/10/20 14:05');
  });
});
