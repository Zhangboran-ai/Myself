'use client';

import { useState } from 'react';
import type { Profile } from '@myself/shared';
import { Check, Copy, Loader2, Send } from 'lucide-react';
import { SocialIcon } from '@/components/ui/SocialIcon';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export function ContactSection({ profile }: { profile: Profile }) {
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<FormState>('idle');
  const [message, setMessage] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage(`复制失败，请手动复制：${profile.email}`);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState('submitting');
    setMessage('');

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          email: String(data.get('email') ?? ''),
          subject: String(data.get('subject') ?? ''),
          content: String(data.get('content') ?? ''),
          website: String(data.get('website') ?? ''),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail ?? '发送失败，请稍后再试');
      }

      setState('success');
      setMessage('留言已送达，我会尽快回复。');
      form.reset();
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : '发送失败，请稍后再试');
    }
  };

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
      <div>
        <p className="max-w-md text-[15px] leading-[1.9] text-[var(--text-secondary)]">
          如果你有项目、合作或只是想聊聊界面与工程，欢迎写信。通常在 48 小时内回复。
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleCopy} className="btn btn-ghost">
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            {copied ? '已复制' : profile.email}
          </button>
          <a href={`mailto:${profile.email}`} className="btn btn-ghost">
            发送邮件
          </a>
        </div>

        <ul className="mt-8 space-y-1">
          {profile.socials.map((social) => (
            <li key={social.href}>
              <a
                href={social.href}
                target={social.href.startsWith('http') ? '_blank' : undefined}
                rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex min-h-11 items-center gap-3 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
              >
                <SocialIcon name={social.icon} size={16} />
                {social.label}
                <span className="text-[var(--text-muted)]">
                  {social.href.replace(/^mailto:/, '')}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 sm:p-7" aria-label="联系表单">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="mb-1.5 block text-xs text-[var(--text-muted)]">
              称呼
            </label>
            <input
              id="contact-name"
              name="name"
              required
              maxLength={50}
              autoComplete="name"
              className="field"
              placeholder="怎么称呼你"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="mb-1.5 block text-xs text-[var(--text-muted)]">
              邮箱
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              maxLength={120}
              autoComplete="email"
              className="field"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="contact-subject" className="mb-1.5 block text-xs text-[var(--text-muted)]">
            主题（可选）
          </label>
          <input
            id="contact-subject"
            name="subject"
            maxLength={120}
            className="field"
            placeholder="想聊什么"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="contact-content" className="mb-1.5 block text-xs text-[var(--text-muted)]">
            内容
          </label>
          <textarea
            id="contact-content"
            name="content"
            required
            minLength={10}
            maxLength={2000}
            className="field"
            placeholder="简单介绍一下你的想法…"
          />
        </div>

        {/* 蜜罐字段：对用户隐藏，机器人会填写 */}
        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="contact-website">网站</label>
          <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-primary" disabled={state === 'submitting'}>
            {state === 'submitting' ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={15} aria-hidden="true" />
            )}
            {state === 'submitting' ? '发送中…' : '发送留言'}
          </button>
          {message ? (
            <p
              role="status"
              aria-live="polite"
              className={
                state === 'success'
                  ? 'text-sm text-[var(--success)]'
                  : 'text-sm text-[var(--danger)]'
              }
            >
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
