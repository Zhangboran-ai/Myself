import { HttpException, HttpStatus } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContactInput } from '@myself/shared';
import type { PrismaService } from '../../common/prisma.service';
import { ContactService } from './contact.service';
import type { MailService } from './mail.service';

const input: ContactInput = {
  name: '访客',
  email: 'guest@example.com',
  subject: '你好',
  content: '这是一条足够长的留言内容。',
  website: '',
};

function createService() {
  const create = vi.fn().mockResolvedValue({ id: 1n });
  const prisma = { contactMessage: { create } } as unknown as PrismaService;
  const mail = { notify: vi.fn().mockResolvedValue(undefined) } as unknown as MailService;
  return { service: new ContactService(prisma, mail), create };
}

describe('ContactService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('正常留言写入数据库并只保存 IP 哈希', async () => {
    const { service, create } = createService();
    const result = await service.submit(input, '203.0.113.9');

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0]?.[0]?.data as Record<string, unknown>;
    expect(data.ipHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(data)).not.toContain('203.0.113.9');
  });

  it('蜜罐命中时假装成功但不落库', async () => {
    const { service, create } = createService();
    const result = await service.submit({ ...input, website: 'http://spam' }, '1.2.3.4');

    expect(result).toEqual({ ok: true });
    expect(create).not.toHaveBeenCalled();
  });

  it('同一 IP 一小时内第 4 次提交被限流', async () => {
    const { service, create } = createService();

    await service.submit(input, '10.0.0.1');
    await service.submit(input, '10.0.0.1');
    await service.submit(input, '10.0.0.1');

    await expect(service.submit(input, '10.0.0.1')).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('不同 IP 独立计数', async () => {
    const { service } = createService();
    await service.submit(input, '10.0.0.2');
    await service.submit(input, '10.0.0.2');
    await service.submit(input, '10.0.0.2');
    await expect(service.submit(input, '10.0.0.3')).resolves.toEqual({ ok: true });
  });

  it('限流异常是 HttpException 而不是普通错误', async () => {
    const { service } = createService();
    for (let index = 0; index < 3; index += 1) {
      await service.submit(input, '10.0.0.4');
    }
    await expect(service.submit(input, '10.0.0.4')).rejects.toBeInstanceOf(HttpException);
  });
});
