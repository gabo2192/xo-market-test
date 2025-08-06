import { DatabaseModule } from '@/db/database.module';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketsController } from './markets.controller';
import { MarketsService } from './markets.service';
import { CreatedMarketsProcessor } from './processors/created-markets.processor';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'create-markets',
    }),
    BullModule.registerQueue({
      name: 'update-markets',
    }),
    DatabaseModule,
  ],
  controllers: [MarketsController],
  providers: [MarketsService, CreatedMarketsProcessor],
})
export class MarketsModule {}
