import { Injectable } from '@nestjs/common';
import { createDrizzleClient, MarketsRepository } from '@workspace/database';

@Injectable()
export class MarketsService {
  private readonly marketsRepository: MarketsRepository;

  constructor() {
    const db = createDrizzleClient(process.env.DATABASE_URL!);

    this.marketsRepository = new MarketsRepository(db);
  }
  async getAvailableMarkets() {
    const markets = await this.marketsRepository.getAvailableMarkets();
    return markets;
  }
}
