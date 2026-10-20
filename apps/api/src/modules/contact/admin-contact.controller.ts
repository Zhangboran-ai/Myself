import { Body, Controller, Get, HttpCode, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { contactMessageQuerySchema, contactMessageUpdateSchema } from '@myself/shared';
import { parseOrThrow } from '../../common/http';
import { CacheControl } from '../../common/cache-control';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ContactService } from './contact.service';

@Controller('admin/contact-messages')
@UseGuards(JwtAuthGuard, CsrfGuard)
@CacheControl('no-store')
export class AdminContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  async list(@Query() query: unknown) {
    const input = parseOrThrow(contactMessageQuerySchema, query);
    return { data: await this.contactService.list(input) };
  }

  @Patch(':id')
  @HttpCode(200)
  async updateStatus(@Param('id') id: string, @Body() body: unknown) {
    const input = parseOrThrow(contactMessageUpdateSchema, body);
    return { data: await this.contactService.updateStatus(BigInt(id), input.status) };
  }
}
