'use client';

import { useEffect } from 'react';

/**
 * 给服务端渲染出的代码块补上「复制」按钮。
 * 用 DOM 增强而不是改 Markdown 输出，保证关闭 JS 时正文仍完整可读。
 */
export function CodeEnhancer() {
  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>('.prose pre'));
    const cleanups: (() => void)[] = [];

    for (const block of blocks) {
      if (block.dataset.enhanced === 'true') continue;
      block.dataset.enhanced = 'true';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy';
      button.textContent = '复制';
      button.setAttribute('aria-label', '复制代码');

      const resetTimer = { id: 0 };
      const onClick = async () => {
        const code = block.querySelector('code')?.textContent ?? block.textContent ?? '';
        try {
          await navigator.clipboard.writeText(code);
          button.textContent = '已复制';
        } catch {
          button.textContent = '复制失败';
        }
        window.clearTimeout(resetTimer.id);
        resetTimer.id = window.setTimeout(() => {
          button.textContent = '复制';
        }, 1600);
      };

      button.addEventListener('click', onClick);
      block.appendChild(button);
      cleanups.push(() => {
        window.clearTimeout(resetTimer.id);
        button.removeEventListener('click', onClick);
        button.remove();
      });
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
