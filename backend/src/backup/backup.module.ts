import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupScheduler } from './backup.scheduler';
import { BackupController } from './backup.controller';

@Module({
  providers: [BackupService, BackupScheduler],
  controllers: [BackupController],
  exports: [BackupService],
})
export class BackupModule {}
