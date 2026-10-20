import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import type { ContactInput, ContactMessageItem, ContactMessageStatus } from '@myself/shared';
import { PrismaService } from '../../common/prisma.service';
import { hashIp, pageMeta } from '../../common/http';
import { MailService } from './mail.service';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 3;

export interface ContactListQuery {
  page: number;
  pageSize: number;
  status?: ContactMessageStatus;
  q?: string;
}

@Injectable()
export class ContactService {
  private readonly submissions = new Map<string, { count: number; firstAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async submit(input: ContactInput, ip: string | undefined): Promise<{ ok: true }> {
    // 蜜罐命中：假装成功，避免给爬虫反馈
    if (input.website) return { ok: true };

    const key = ip ?? 'unknown';
    const entry = this.submissions.get(key);
    const now = Date.now();

    if (!entry || now - entry.firstAt > WINDOW_MS) {
      this.submissions.set(key, { count: 1, firstAt: now });
    } else if (entry.count >= MAX_PER_WINDOW) {
      throw new HttpException('留言过于频繁，请稍后再试', HttpStatus.TOO_MANY_REQUESTS);
    } else {
      entry.count += 1;
    }

    await this.prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        subject: input.subject ?? '',
        content: input.content,
        ipHash: hashIp(ip),
      },
    });

    // 邮件是附加通知，不阻塞也不影响留言是否成功。
    void this.mail.notify(input);

    return { ok: true };
  }

  async list(query: ContactListQuery): Promise<{
    items: ContactMessageItem[];
    meta: ReturnType<typeof pageMeta>;
  }> {
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q } },
              { email: { contains: query.q } },
              { subject: { contains: query.q } },
              { content: { contains: query.q } },
            ],
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.contactMessage.count({ where }),
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: String(row.id),
        name: row.name,
        email: row.email,
        subject: row.subject,
        content: row.content,
        status: row.status as ContactMessageStatus,
        createdAt: row.createdAt.toISOString(),
      })),
      meta: pageMeta(total, query.page, query.pageSize),
    };
  }

  async updateStatus(id: bigint, status: ContactMessageStatus): Promise<ContactMessageItem> {
    const existing = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('留言不存在');

    const row = await this.prisma.contactMessage.update({ where: { id }, data: { status } });
    return {
      id: String(row.id),
      name: row.name,
      email: row.email,
      subject: row.subject,
      content: row.content,
      status: row.status as ContactMessageStatus,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
