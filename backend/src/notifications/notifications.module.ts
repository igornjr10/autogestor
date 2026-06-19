import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { AlertasScheduler } from './alertas.scheduler';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, AlertasScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
