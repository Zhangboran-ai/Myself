'use client';

import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/** 浏览量上报：同一会话同一篇文章只上报一次。 */
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed:${slug}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, '1');
    } catch {
      // 隐私模式下 sessionStorage 可能不可用，忽略即可
    }

    void fetch(`${API_URL}/posts/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => undefined);
  }, [slug]);

  return null;
}
