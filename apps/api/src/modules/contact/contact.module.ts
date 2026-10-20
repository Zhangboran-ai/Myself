import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContactController } from './contact.controller';
import { AdminContactController } from './admin-contact.controller';
import { ContactService } from './contact.service';
import { MailService } from './mail.service';

@Module({
  imports: [AuthModule],
  controllers: [ContactController, AdminContactController],
  providers: [ContactService, MailService],
})
export class ContactModule {}
