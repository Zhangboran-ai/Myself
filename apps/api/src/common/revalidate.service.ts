import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

const MAX_ATTEMPTS = 5;
const RETRY_INTERVAL_MS = 30_000;
const JOB_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 内容写入后通知 Next.js 按 tag 失效缓存。
 *
 * 通知失败时写入 revalidate_jobs 并由后台定时重试（指数退避，最多 5 次），
 * 保证「发布后前台可见」最终一致，而不是把失败静默丢掉。
 */
@Injectable()
export class RevalidateService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RevalidateService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.runPendingJobs(), RETRY_INTERVAL_MS);
    // 定时器不应阻止进程退出。
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** 写入路径使用：不阻塞响应，失败转入重试队列。 */
  notify(tags: string[]): void {
    if (!this.config.get<string>('REVALIDATE_SECRET')) return;
    for (const tag of tags) {
      void this.invalidate(tag).then((ok) => {
        if (!ok) return this.enqueue(tag);
      });
    }
  }

  /** 后台手动触发使用：立即尝试并返回结果，失败同样进入重试队列。 */
  async trigger(tags: string[]): Promise<{ ok: true; tags: string[] }> {
    await Promise.all(
      tags.map(async (tag) => {
        const ok = await this.invalidate(tag);
        if (!ok) await this.enqueue(tag);
      }),
    );
    return { ok: true, tags };
  }

  private async invalidate(tag: string): Promise<boolean> {
    const secret = this.config.get<string>('REVALIDATE_SECRET');
    if (!secret) return true;

    const baseUrl = this.config.get<string>('INTERNAL_WEB_URL') ?? 'http://127.0.0.1:3000';
    try {
      const response = await fetch(
        `${baseUrl}/api/revalidate?tag=${encodeURIComponent(tag)}`,
        {
          method: 'POST',
          headers: { 'x-revalidate-secret': secret },
          signal: AbortSignal.timeout(5_000),
        },
      );
      if (!response.ok) {
        this.logger.warn(`缓存失效失败 tag=${tag} status=${response.status}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.warn(`缓存失效请求异常 tag=${tag}: ${String(error)}`);
      return false;
    }
  }

  private async enqueue(tag: string): Promise<void> {
    try {
      await this.prisma.revalidateJob.create({
        data: { targetTag: tag, payload: { tag }, status: 'PENDING' },
      });
    } catch (error) {
      this.logger.error(`缓存失效任务写入失败 tag=${tag}: ${String(error)}`);
    }
  }

  private async runPendingJobs(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const jobs = await this.prisma.revalidateJob.findMany({
        where: { status: 'PENDING', nextRunAt: { lte: new Date() } },
        orderBy: { nextRunAt: 'asc' },
        take: 20,
      });

      for (const job of jobs) {
        const ok = await this.invalidate(job.targetTag);
        const attempts = job.attempts + 1;

        if (ok) {
          await this.prisma.revalidateJob.update({
            where: { id: job.id },
            data: { status: 'DONE', attempts },
          });
        } else if (attempts >= MAX_ATTEMPTS) {
          await this.prisma.revalidateJob.update({
            where: { id: job.id },
            data: { status: 'FAILED', attempts },
          });
          this.logger.error(`缓存失效任务超过重试上限 tag=${job.targetTag}`);
        } else {
          await this.prisma.revalidateJob.update({
            where: { id: job.id },
            data: {
              attempts,
              // 30s、60s、120s… 指数退避。
              nextRunAt: new Date(Date.now() + 2 ** attempts * RETRY_INTERVAL_MS),
            },
          });
        }
      }

      await this.prisma.revalidateJob.deleteMany({
        where: {
          status: { in: ['DONE', 'FAILED'] },
          createdAt: { lt: new Date(Date.now() - JOB_RETENTION_MS) },
        },
      });
    } catch (error) {
      this.logger.error(`缓存失效重试循环异常: ${String(error)}`);
    } finally {
      this.running = false;
    }
  }
}
