export interface Market {
  id: string;
  title: string;
  resolutionCriteria: string;
  endDate: bigint;
  volume?: bigint;
  collateralToken: string;
  outcomes: string[];
  resolved: boolean;
  resolver: string;
  creator: string;
  createdAt: bigint;
}

export interface ExtendedMarket extends Market {
  totalCollateral: bigint;
  outcomeTokenAmounts: bigint[];
  outcomeTokenIndices: bigint[];
}

export interface MarketFetchResult {
  markets: Market[];
  totalCount: number;
  lastUpdated: Date;
}

// Raw contract return types (matching Solidity structs)
export interface RawMarket {
  id: bigint;
  title: string;
  resolutionCriteria: string;
  endDate: bigint;
  collateralToken: string;
  outcomes: readonly string[];
  resolved: boolean;
  resolver: string;
  creator: string;
  createdAt: bigint;
}

export interface RawExtendedMarket extends RawMarket {
  totalCollateral: bigint;
  outcomeTokenAmounts: readonly bigint[];
  outcomeTokenIndices: readonly bigint[];
}
