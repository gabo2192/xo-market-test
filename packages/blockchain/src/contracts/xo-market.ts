import { type Address, type PublicClient } from "viem";
import XO_MARKET_ABI_JSON from "../abis/xo-market.json";
import {
  getXOChainClient,
  XO_MARKET_CONTRACT_ADDRESS,
} from "../clients/xo-chain.js";
import { IndexerService } from "../services/indexer.js";
import type {
  ExtendedMarket,
  Market,
  MarketFetchResult,
  RawExtendedMarket,
  RawMarket,
} from "../types/market.js";

const XO_MARKET_ABI = XO_MARKET_ABI_JSON.abi;

export class XOMarketContract {
  private client: PublicClient;
  private contractAddress: Address;
  private indexerService: IndexerService;

  constructor(
    client?: PublicClient,
    contractAddress?: Address,
    indexerService?: IndexerService
  ) {
    this.client = client || getXOChainClient();
    this.contractAddress = contractAddress || XO_MARKET_CONTRACT_ADDRESS;
    this.indexerService = indexerService || new IndexerService();
  }

  /**
   * Get a single market by ID from the blockchain
   */
  async getMarket(marketId: number): Promise<Market | null> {
    try {
      const result = (await this.client.readContract({
        address: this.contractAddress,
        abi: XO_MARKET_ABI,
        functionName: "getMarket",
        args: [BigInt(marketId)],
      })) as RawMarket;

      return this.formatMarket(result);
    } catch (error) {
      console.error(`Error fetching market ${marketId}:`, error);
      return null;
    }
  }

  async getMarkets(marketIds: number[]): Promise<Market[]> {
    try {
      const calls = marketIds.map((marketId) => ({
        address: this.contractAddress,
        abi: XO_MARKET_ABI,
        functionName: "getMarket",
        args: [BigInt(marketId)],
      }));

      const results = await this.client.multicall({
        contracts: calls as any,
      });

      const markets: Market[] = [];

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result?.status === "success") {
          const rawMarket = result.result as RawMarket;
          markets.push(this.formatMarket(rawMarket));
        } else {
          console.warn(
            `Failed to fetch market ${marketIds[i]}:`,
            result?.error
          );
        }
      }

      return markets;
    } catch (error) {
      console.error(`Error fetching markets ${marketIds}:`, error);
      return [];
    }
  }

  /**
   * Get extended market data by ID (includes volume/collateral info)
   */
  async getExtendedMarket(marketId: number): Promise<ExtendedMarket | null> {
    try {
      const result = (await this.client.readContract({
        address: this.contractAddress,
        abi: XO_MARKET_ABI,
        functionName: "getExtendedMarket",
        args: [BigInt(marketId)],
      })) as RawExtendedMarket;

      return this.formatExtendedMarket(result);
    } catch (error) {
      console.error(`Error fetching extended market ${marketId}:`, error);
      return null;
    }
  }

  /**
   * Discover all market IDs from indexed events (much faster than chain queries)
   */
  async discoverMarketIds(): Promise<number[]> {
    try {
      return await this.indexerService.getAvailableMarketIds();
    } catch (error) {
      console.error("Error discovering market IDs from indexer:", error);
      // Fallback to checking first 20 market IDs manually
      return Array.from({ length: 20 }, (_, i) => i);
    }
  }

  /**
   * Fetch all available markets using indexed events for discovery and chain for data
   */
  async getAllMarkets(): Promise<MarketFetchResult> {
    try {
      // Discover market IDs from indexed events (fast)
      const marketIds = await this.discoverMarketIds();
      const markets: Market[] = [];

      // Fetch markets in parallel batches to avoid RPC overload
      const BATCH_SIZE = 5;
      const promises: Promise<Market | null>[] = [];

      for (let i = 0; i < marketIds.length; i++) {
        const marketId = marketIds[i];
        if (!marketId) {
          continue;
        }
        promises.push(this.getMarket(marketId));

        // Process in batches
        if (promises.length === BATCH_SIZE || i === marketIds.length - 1) {
          const batchResults = await Promise.allSettled(promises);

          for (const result of batchResults) {
            if (result.status === "fulfilled" && result.value !== null) {
              markets.push(result.value);
            }
          }

          // Clear promises for next batch
          promises.length = 0;

          // Small delay to avoid overwhelming the RPC
          if (i < marketIds.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }

      return {
        markets,
        totalCount: markets.length,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error("Error fetching all markets:", error);
      throw new Error("Failed to fetch markets");
    }
  }

  /**
   * Fetch all extended markets with volume data using discovered market IDs
   */
  async getAllExtendedMarkets(): Promise<ExtendedMarket[]> {
    try {
      // Discover market IDs from indexed events
      const marketIds = await this.discoverMarketIds();
      const markets: ExtendedMarket[] = [];

      const BATCH_SIZE = 5;
      const promises: Promise<ExtendedMarket | null>[] = [];

      for (let i = 0; i < marketIds.length; i++) {
        const marketId = marketIds[i];
        if (!marketId) {
          continue;
        }
        promises.push(this.getExtendedMarket(marketId));

        // Process in batches
        if (promises.length === BATCH_SIZE || i === marketIds.length - 1) {
          const batchResults = await Promise.allSettled(promises);

          for (const result of batchResults) {
            if (result.status === "fulfilled" && result.value !== null) {
              markets.push(result.value);
            }
          }

          // Clear promises for next batch
          promises.length = 0;

          // Small delay to avoid overwhelming the RPC
          if (i < marketIds.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }

      return markets;
    } catch (error) {
      console.error("Error fetching all extended markets:", error);
      throw new Error("Failed to fetch extended markets");
    }
  }

  /**
   * Fetch markets with volume data from indexed events (more efficient)
   */
  async getAllMarketsWithVolume(): Promise<
    Array<Market & { volume: bigint; tradeCount: number }>
  > {
    try {
      const marketIds = await this.discoverMarketIds();
      const results: Array<Market & { volume: bigint; tradeCount: number }> =
        [];

      const BATCH_SIZE = 3; // Smaller batch size since we're doing more work per market

      for (let i = 0; i < marketIds.length; i += BATCH_SIZE) {
        const batch = marketIds.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (marketId) => {
          try {
            const [market, volumeData] = await Promise.all([
              this.getMarket(marketId),
              this.indexerService.getMarketVolume(marketId),
            ]);

            if (market) {
              return {
                ...market,
                volume: volumeData.totalVolume,
                tradeCount: volumeData.tradeCount,
              };
            }
            return null;
          } catch (error) {
            console.warn(
              `Failed to fetch market ${marketId} with volume:`,
              error
            );
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(
          (result): result is NonNullable<typeof result> => result !== null
        );
        results.push(...validResults);

        // Small delay between batches
        if (i + BATCH_SIZE < marketIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      return results;
    } catch (error) {
      console.error("Error fetching markets with volume:", error);
      throw new Error("Failed to fetch markets with volume");
    }
  }

  /**
   * Get market collateral amount from blockchain
   */
  async getMarketCollateral(marketId: number): Promise<bigint> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: XO_MARKET_ABI,
        functionName: "getMarketCollateral",
        args: [BigInt(marketId)],
      });
      return result as bigint;
    } catch (error) {
      console.error(`Error fetching market collateral for ${marketId}:`, error);
      return BigInt(0);
    }
  }

  /**
   * Get prices for all outcomes of a market
   */
  async getMarketPrices(marketId: number): Promise<bigint[]> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: XO_MARKET_ABI,
        functionName: "getPrices",
        args: [BigInt(marketId)],
      });
      return Array.from(result as readonly bigint[]);
    } catch (error) {
      console.error(`Error fetching prices for market ${marketId}:`, error);
      return [];
    }
  }

  /**
   * Check if a market is resolved
   */
  async isMarketResolved(marketId: number): Promise<boolean> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: XO_MARKET_ABI,
        functionName: "isMarketResolved",
        args: [BigInt(marketId)],
      });
      return result as boolean;
    } catch (error) {
      console.error(`Error checking if market ${marketId} is resolved:`, error);
      return false;
    }
  }

  /**
   * Get outcome token amount for a specific outcome
   */
  async getOutcomeTokenAmount(
    marketId: number,
    outcome: number
  ): Promise<bigint> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: XO_MARKET_ABI,
        functionName: "getMarketOutcomeTokenAmount",
        args: [BigInt(marketId), outcome],
      });
      return result as bigint;
    } catch (error) {
      console.error(
        `Error fetching outcome token amount for market ${marketId}, outcome ${outcome}:`,
        error
      );
      return BigInt(0);
    }
  }

  /**
   * Get market volume from indexed trading events
   */
  async getMarketVolume(marketId: number): Promise<bigint> {
    try {
      const volumeData = await this.indexerService.getMarketVolume(marketId);
      return volumeData.totalVolume;
    } catch (error) {
      console.error(`Error fetching market volume for ${marketId}:`, error);
      // Fallback to chain query
      return await this.getMarketCollateral(marketId);
    }
  }

  /**
   * Check if market is resolved using indexed events (faster than chain query)
   */
  async isMarketResolvedFromIndex(marketId: number): Promise<boolean> {
    try {
      return await this.indexerService.isMarketResolved(marketId);
    } catch (error) {
      console.error(
        `Error checking if market ${marketId} is resolved from index:`,
        error
      );
      // Fallback to chain query
      return await this.isMarketResolved(marketId);
    }
  }

  /**
   * Get market metadata from indexed creation events
   */
  async getMarketMetadata(marketId: number) {
    try {
      return await this.indexerService.getMarketMetadata(marketId);
    } catch (error) {
      console.error(`Error fetching market metadata for ${marketId}:`, error);
      return null;
    }
  }

  /**
   * Get recent market activity from indexed events (much faster than chain queries)
   */
  async getRecentMarketActivity(limit = 10) {
    try {
      return await this.indexerService.getRecentActivity(limit);
    } catch (error) {
      console.error("Error fetching recent market activity:", error);
      return {
        marketCreated: [],
        marketResolved: [],
        tokensBought: [],
      };
    }
  }

  /**
   * Get markets created by a specific address from indexed events
   */
  async getMarketsByCreator(creatorAddress: string): Promise<number[]> {
    try {
      const events =
        await this.indexerService.getMarketsByCreator(creatorAddress);
      return events
        .map((event) => parseInt(event.marketId))
        .sort((a, b) => a - b);
    } catch (error) {
      console.error("Error fetching markets by creator:", error);
      return [];
    }
  }

  /**
   * Get trading activity for a specific market from indexed events
   */
  async getMarketTradingActivity(marketId: number, limit = 20) {
    try {
      return await this.indexerService.getTradingActivity(marketId, limit);
    } catch (error) {
      console.error(
        `Error fetching trading activity for market ${marketId}:`,
        error
      );
      return { bought: [], sold: [] };
    }
  }

  /**
   * Format raw market data from contract
   */
  private formatMarket(raw: RawMarket): Market {
    return {
      id: raw.id.toString(),
      title: raw.title,
      resolutionCriteria: raw.resolutionCriteria,
      endDate: raw.endDate,
      collateralToken: raw.collateralToken,
      outcomes: Array.from(raw.outcomes),
      resolved: raw.resolved,
      resolver: raw.resolver,
      creator: raw.creator,
      createdAt: raw.createdAt,
    };
  }

  /**
   * Format raw extended market data from contract
   */
  private formatExtendedMarket(raw: RawExtendedMarket): ExtendedMarket {
    return {
      ...this.formatMarket(raw),
      totalCollateral: raw.totalCollateral,
      outcomeTokenAmounts: Array.from(raw.outcomeTokenAmounts),
      outcomeTokenIndices: Array.from(raw.outcomeTokenIndices),
      volume: raw.totalCollateral, // Use total collateral as proxy for volume
    };
  }
}
