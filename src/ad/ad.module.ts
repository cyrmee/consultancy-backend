import { Module } from '@nestjs/common';
import { AdController } from './ad.controller';
import { AdService } from './ad.service';

@Module({
  exports: [AdService],
  controllers: [AdController],
  providers: [AdService],
})
export class AdModule {}
