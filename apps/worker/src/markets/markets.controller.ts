import { Controller, Logger, Post } from '@nestjs/common';
import { MarketsService } from './markets.service';

@Controller('markets')
export class MarketsController {
  private readonly logger = new Logger(MarketsController.name);
  constructor(private readonly marketsService: MarketsService) {}

  @Post('sync')
  async triggerSync() {
    this.logger.log('Triggering market sync...');
    await this.marketsService.addCreateMarketsJob();
    return {
      message: 'Market sync job added to queue',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('cron-ai-evaluation')
  async triggerCronAiEvaluation() {
    this.logger.log('Triggering cron AI evaluation...');
    await this.marketsService.cronAiEvaluation();
    return {
      message: 'Cron market sync job added to queue',
      timestamp: new Date().toISOString(),
    };
  }
}
