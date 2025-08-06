// GraphQL query types based on Envio schema
export interface MarketCreatedEvent {
  id: string;
  marketId: string; // BigInt as string
  creator: string;
  startsAt: string; // BigInt as string
  expiresAt: string; // BigInt as string
  collateralToken: string;
  outcomeCount: string; // BigInt as string
  outcomeStartingTokenId: string; // BigInt as string
  initialCollateral: string; // BigInt as string
  creatorFeeBps: string; // BigInt as string
  metaDataURI: string;
  alpha: string; // BigInt as string
}

export interface MarketResolvedEvent {
  id: string;
  marketId: string;
  resolver: string;
  winningTokenId: string;
  redeemableAmount: string;
}

export interface MarketPriceChangedEvent {
  id: string;
  marketId: string;
  outcomePrices: string[]; // BigInt array as strings
}

export interface OutcomeTokensBoughtEvent {
  id: string;
  marketId: string;
  buyer: string;
  outcomeIndex: string;
  outcomeTokenId: string;
  amount: string;
  cost: string;
}

export interface OutcomeTokensSoldEvent {
  id: string;
  marketId: string;
  seller: string;
  outcomeIndex: string;
  outcomeTokenId: string;
  amount: string;
  received: string;
}

// GraphQL Queries
export const GET_MARKET_CREATED_EVENTS = `
    query GetMarketCreatedEvents($limit: Int, $offset: Int, $orderBy: [XOMarketContract_MarketCreated_order_by!]) {
      XOMarketContract_MarketCreated(
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        id
        marketId
        creator
        startsAt
        expiresAt
        collateralToken
        outcomeCount
        outcomeStartingTokenId
        initialCollateral
        creatorFeeBps
        metaDataURI
        alpha
      }
    }
  `;

export const GET_MARKET_CREATED_EVENT_BY_ID = `
    query GetMarketCreatedEventById($marketId: BigInt!) {
      XOMarketContract_MarketCreated(
        where: { marketId: { _eq: $marketId } }
      ) {
        id
        marketId
        creator
        startsAt
        expiresAt
        collateralToken
        outcomeCount
        outcomeStartingTokenId
        initialCollateral
        creatorFeeBps
        metaDataURI
        alpha
      }
    }
  `;

export const GET_MARKET_RESOLVED_EVENTS = `
    query GetMarketResolvedEvents($limit: Int, $offset: Int) {
      XOMarketContract_MarketResolved(
        limit: $limit
        offset: $offset
        order_by: { marketId: desc }
      ) {
        id
        marketId
        resolver
        winningTokenId
        redeemableAmount
      }
    }
  `;

export const GET_MARKET_PRICE_CHANGES = `
    query GetMarketPriceChanges($marketId: BigInt, $limit: Int) {
      XOMarketContract_MarketPriceChanged(
        where: { marketId: { _eq: $marketId } }
        limit: $limit
        order_by: { id: desc }
      ) {
        id
        marketId
        outcomePrices
      }
    }
  `;

export const GET_TRADING_ACTIVITY = `
    query GetTradingActivity($marketId: numeric, $limit: Int) {
      bought: XOMarketContract_OutcomeTokensBought(
        where: { marketId: { _eq: $marketId } }
        limit: $limit
        order_by: { id: desc }
      ) {
        id
        marketId
        buyer
        outcomeIndex
        outcomeTokenId
        amount
        cost
      }
      sold: XOMarketContract_OutcomeTokensSold(
        where: { marketId: { _eq: $marketId } }
        limit: $limit
        order_by: { id: desc }
      ) {
        id
        marketId
        seller
        outcomeIndex
        outcomeTokenId
        amount
        received
      }
    }
  `;

export const GET_MARKET_VOLUME = `
    query GetMarketVolume($marketId: BigInt!) {
      bought: XOMarketContract_OutcomeTokensBought(
        where: { marketId: { _eq: $marketId } }
      ) {
        cost
      }
      sold: XOMarketContract_OutcomeTokensSold(
        where: { marketId: { _eq: $marketId } }
      ) {
        received
      }
    }
  `;

export const GET_MARKETS_BY_CREATOR = `
    query GetMarketsByCreator($creator: String!, $limit: Int) {
      XOMarketContract_MarketCreated(
        where: { creator: { _eq: $creator } }
        limit: $limit
        order_by: { marketId: desc }
      ) {
        id
        marketId
        creator
        startsAt
        expiresAt
        collateralToken
        outcomeCount
        initialCollateral
        metaDataURI
      }
    }
  `;

export const GET_RECENT_ACTIVITY = `
    query GetRecentActivity($limit: Int) {
      marketCreated: XOMarketContract_MarketCreated(
        limit: $limit
        order_by: { id: desc }
      ) {
        id
        marketId
        creator
        metaDataURI
      }
      marketResolved: XOMarketContract_MarketResolved(
        limit: $limit
        order_by: { id: desc }
      ) {
        id
        marketId
        resolver
        winningTokenId
      }
      tokensBought: XOMarketContract_OutcomeTokensBought(
        limit: $limit
        order_by: { id: desc }
      ) {
        id
        marketId
        buyer
        amount
        cost
      }
    }
  `;

export const GET_MARKET_PAUSED_EVENTS = `
    query GetMarketPausedEvents {
        XOMarketContract_MarketPaused {
            db_write_timestamp
            id
            marketId
            pausedBy
        }
    }
  `;

export const GET_MARKET_UNPAUSED_EVENTS = `
    query GetMarketUnpausedEvents {
        XOMarketContract_MarketUnpaused {
            db_write_timestamp
            id
            marketId
            unpausedBy
        }
    }
  `;
