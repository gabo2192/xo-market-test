import { createPublicClient, defineChain, http, type PublicClient } from "viem";

// Define XO Chain testnet
export const xoTestnet = defineChain({
  id: 1000101,
  name: "XO Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "XO",
    symbol: "XO",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc-1.xo.market"],
    },
  },
  blockExplorers: {
    default: {
      name: "XO Explorer",
      url: "http://explorer-testnet.xo.market",
    },
  },
  testnet: true,
});

export const XO_MARKET_CONTRACT_ADDRESS =
  "0x3cf19D0C88a14477DCaA0A45f4AF149a4C917523" as const;
export const XO_MARKET_NFT_ADDRESS =
  "0x550318A123d222e841776a281F51B09e8909E144" as const;

// Create a singleton client instance
let client: PublicClient | null = null;

export function getXOChainClient(): PublicClient {
  if (!client) {
    client = createPublicClient({
      chain: xoTestnet,
      transport: http(),
    });
  }
  return client;
}

export function createCustomXOChainClient(rpcUrl?: string): PublicClient {
  const customChain = rpcUrl
    ? {
        ...xoTestnet,
        rpcUrls: {
          default: {
            http: [rpcUrl],
          },
        },
      }
    : xoTestnet;

  return createPublicClient({
    chain: customChain,
    transport: http(),
  });
}
