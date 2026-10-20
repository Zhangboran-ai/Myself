import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { contactInputSchema } from '@myself/shared';
import { parseOrThrow } from '../../common/http';
import { ContactService } from './contact.service';
import { CacheControl } from '../../common/cache-control';

@Controller('contact')
@CacheControl('no-store')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(201)
  async submit(@Body() body: unknown, @Req() req: FastifyRequest) {
    const input = parseOrThrow(contactInputSchema, body);
    return { data: await this.contactService.submit(input, req.ip) };
  }
}
