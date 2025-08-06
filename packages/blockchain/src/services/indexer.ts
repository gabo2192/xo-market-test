import {
    GraphQLClient,
    defaultGraphQLClient,
} from "../clients/graphql-client.js";
import {
    GET_MARKETS_BY_CREATOR,
    GET_MARKET_CREATED_EVENTS,
    GET_MARKET_CREATED_EVENT_BY_ID,
    GET_MARKET_PAUSED_EVENTS,
    GET_MARKET_PRICE_CHANGES,
    GET_MARKET_RESOLVED_EVENTS,
    GET_MARKET_UNPAUSED_EVENTS,
    GET_MARKET_VOLUME,
    GET_RECENT_ACTIVITY,
    GET_TRADING_ACTIVITY,
    MarketCreatedEvent,
    MarketPriceChangedEvent,
    MarketResolvedEvent,
    OutcomeTokensBoughtEvent,
    OutcomeTokensSoldEvent,
} from "../graphql/queries.js";

export interface MarketVolumeData {
  totalBuyVolume: bigint;
  totalSellVolume: bigint;
  totalVolume: bigint;
  tradeCount: number;
}

export interface MarketActivitySummary {
  marketCreated: Array<{
    id: string;
    marketId: string;
    creator: string;
    metaDataURI: string;
  }>;
  marketResolved: Array<{
    id: string;
    marketId: string;
    resolver: string;
    winningTokenId: string;
  }>;
  tokensBought: Array<{
    id: string;
    marketId: string;
    buyer: string;
    amount: string;
    cost: string;
  }>;
}

export interface MarketPausedEvent {
  id: string;
  marketId: string;
  pausedBy: string;
}

export interface MarketUnpausedEvent {
  id: string;
  marketId: string;
  unpausedBy: string;
}

export class IndexerService {
  constructor(private graphqlClient: GraphQLClient = defaultGraphQLClient) {}

  /**
   * Get all MarketCreated events
   */
  async getMarketCreatedEvents(
    limit = 100,
    offset = 0
  ): Promise<MarketCreatedEvent[]> {
    const response = await this.graphqlClient.query<{
      XOMarketContract_MarketCreated: MarketCreatedEvent[];
    }>(GET_MARKET_CREATED_EVENTS, {
      limit,
      offset,
      orderBy: [{ marketId: "asc" }],
    });

    return response.XOMarketContract_MarketCreated;
  }

  /**
   * Get MarketCreated event for a specific market
   */
  async getMarketCreatedEvent(
    marketId: number
  ): Promise<MarketCreatedEvent | null> {
    const response = await this.graphqlClient.query<{
      XOMarketContract_MarketCreated: MarketCreatedEvent[];
    }>(GET_MARKET_CREATED_EVENT_BY_ID, {
      marketId: marketId.toString(),
    });

    return response.XOMarketContract_MarketCreated[0] || null;
  }

  /**
   * Get all available market IDs
   */
  async getAvailableMarketIds(): Promise<number[]> {
    const events = await this.getMarketCreatedEvents();
    return events
      .map((event) => parseInt(event.marketId))
      .sort((a, b) => a - b);
  }

  /**
   * Get resolved markets
   */
  async getResolvedMarkets(limit = 50): Promise<MarketResolvedEvent[]> {
    const response = await this.graphqlClient.query<{
      XOMarketContract_MarketResolved: MarketResolvedEvent[];
    }>(GET_MARKET_RESOLVED_EVENTS, { limit });

    return response.XOMarketContract_MarketResolved;
  }

  /**
   * Get price changes for a market
   */
  async getMarketPriceChanges(
    marketId: number,
    limit = 10
  ): Promise<MarketPriceChangedEvent[]> {
    const response = await this.graphqlClient.query<{
      XOMarketContract_MarketPriceChanged: MarketPriceChangedEvent[];
    }>(GET_MARKET_PRICE_CHANGES, {
      marketId: marketId.toString(),
      limit,
    });

    return response.XOMarketContract_MarketPriceChanged;
  }

  /**
   * Get trading activity for a market
   */
  async getTradingActivity(
    marketId: number,
    limit = 20
  ): Promise<{
    bought: OutcomeTokensBoughtEvent[];
    sold: OutcomeTokensSoldEvent[];
  }> {
    const response = await this.graphqlClient.query<{
      bought: OutcomeTokensBoughtEvent[];
      sold: OutcomeTokensSoldEvent[];
    }>(GET_TRADING_ACTIVITY, {
      marketId: marketId.toString(),
      limit,
    });

    return response;
  }

  /**
   * Calculate market volume from trading events
   */
  async getMarketVolume(marketId: number): Promise<MarketVolumeData> {
    const response = await this.graphqlClient.query<{
      bought: Array<{ cost: string }>;
      sold: Array<{ received: string }>;
    }>(GET_MARKET_VOLUME, {
      marketId: marketId.toString(),
    });

    const totalBuyVolume = response.bought.reduce(
      (sum, trade) => sum + BigInt(trade.cost),
      BigInt(0)
    );

    const totalSellVolume = response.sold.reduce(
      (sum, trade) => sum + BigInt(trade.received),
      BigInt(0)
    );

    return {
      totalBuyVolume,
      totalSellVolume,
      totalVolume: totalBuyVolume + totalSellVolume,
      tradeCount: response.bought.length + response.sold.length,
    };
  }

  /**
   * Get markets created by a specific address
   */
  async getMarketsByCreator(
    creator: string,
    limit = 50
  ): Promise<MarketCreatedEvent[]> {
    const response = await this.graphqlClient.query<{
      XOMarketContract_MarketCreated: MarketCreatedEvent[];
    }>(GET_MARKETS_BY_CREATOR, {
      creator: creator.toLowerCase(),
      limit,
    });

    return response.XOMarketContract_MarketCreated;
  }

  /**
   * Get recent platform activity
   */
  async getRecentActivity(limit = 10): Promise<MarketActivitySummary> {
    const response = await this.graphqlClient.query<MarketActivitySummary>(
      GET_RECENT_ACTIVITY,
      { limit }
    );

    return response;
  }

  /**
   * Get market metadata from creation event
   */
  async getMarketMetadata(marketId: number): Promise<{
    creator: string;
    startsAt: bigint;
    expiresAt: bigint;
    collateralToken: string;
    outcomeCount: number;
    initialCollateral: bigint;
    creatorFeeBps: number;
    metaDataURI: string;
    alpha: bigint;
  } | null> {
    const event = await this.getMarketCreatedEvent(marketId);

    if (!event) {
      return null;
    }

    return {
      creator: event.creator,
      startsAt: BigInt(event.startsAt),
      expiresAt: BigInt(event.expiresAt),
      collateralToken: event.collateralToken,
      outcomeCount: parseInt(event.outcomeCount),
      initialCollateral: BigInt(event.initialCollateral),
      creatorFeeBps: parseInt(event.creatorFeeBps),
      metaDataURI: event.metaDataURI,
      alpha: BigInt(event.alpha),
    };
  }

  /**
   * Check if a market is resolved from indexed events
   */
  async isMarketResolved(marketId: number): Promise<boolean> {
    const resolved = await this.getResolvedMarkets();
    return resolved.some((event) => parseInt(event.marketId) === marketId);
  }

  /**
   * Get comprehensive market data combining chain data with indexed events
   */
  async getMarketWithVolume(marketId: number): Promise<{
    metadata: Awaited<ReturnType<IndexerService["getMarketMetadata"]>>;
    volume: MarketVolumeData;
    isResolved: boolean;
    latestPrices?: string[];
  }> {
    const [metadata, volume, isResolved, priceChanges] = await Promise.all([
      this.getMarketMetadata(marketId),
      this.getMarketVolume(marketId),
      this.isMarketResolved(marketId),
      this.getMarketPriceChanges(marketId, 1),
    ]);

    return {
      metadata,
      volume,
      isResolved,
      latestPrices: priceChanges[0]?.outcomePrices,
    };
  }

  async getMarketPausedEvents(): Promise<MarketPausedEvent[]> {
    const response = await this.graphqlClient.query<{
      XOMarketContract_MarketPaused: MarketPausedEvent[];
    }>(GET_MARKET_PAUSED_EVENTS);

    return response.XOMarketContract_MarketPaused;
  }

  async getMarketUnpausedEvents(): Promise<MarketUnpausedEvent[]> {
    const response = await this.graphqlClient.query<{
      XOMarketContract_MarketUnpaused: MarketUnpausedEvent[];
    }>(GET_MARKET_UNPAUSED_EVENTS);

    return response.XOMarketContract_MarketUnpaused;
  }
}
