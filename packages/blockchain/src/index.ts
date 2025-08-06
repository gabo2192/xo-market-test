import XO_MARKET_ABI_RAW from "./abis/xo-market.json";
// Clients
export {
    createCustomXOChainClient, getXOChainClient, XO_MARKET_CONTRACT_ADDRESS,
    XO_MARKET_NFT_ADDRESS, xoTestnet
} from "./clients/xo-chain";

export { IndexerService } from "./services/indexer";

// Contracts
export { XOMarketContract } from "./contracts/xo-market";

// Types
export type {
    ExtendedMarket, Market, MarketFetchResult, RawExtendedMarket, RawMarket
} from "./types/market";

// ABI

export const XO_MARKET_ABI = XO_MARKET_ABI_RAW.abi;
