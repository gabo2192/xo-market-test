import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MarketsService } from '../markets.service';

@Processor('create-markets')
export class CreatedMarketsProcessor {
  private readonly logger = new Logger(CreatedMarketsProcessor.name);

  constructor(private marketsService: MarketsService) {}

  @Process('sync-from-indexer')
  async handleSyncFromIndexer(job: Job) {
    this.logger.log(`🚀 Processing create-markets job: ${job.id}`);

    try {
      const result = await this.marketsService.syncMarketsFromIndexer();

      this.logger.log(`✅ Job ${job.id} completed successfully:`, result);

      return result;
    } catch (error) {
      this.logger.error(`❌ Job ${job.id} failed:`, error);
      throw error;
    }
  }
}
