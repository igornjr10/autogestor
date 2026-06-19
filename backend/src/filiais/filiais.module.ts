import { Module } from '@nestjs/common';
import { FiliaisService } from './filiais.service';
import { FiliaisController } from './filiais.controller';

@Module({
  controllers: [FiliaisController],
  providers: [FiliaisService],
})
export class FiliaisModule {}
