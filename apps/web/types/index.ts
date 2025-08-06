export type Market = {
  id: number;
  marketId: number;
  creator: string;
  startsAt: string;
  expiresAt: string;
  collateralToken: string;
  outcomeCount: number;
  initialCollateral: string;
  creatorFeeBps: number;
  metaDataURI: string;
  alpha: string;
  title: string;
  resolutionCriteria: string;
  endDate: string | null;
  outcomes: string[] | null;
  totalVolume: string;
  tradeCount: number;
  resolved: boolean;
  resolvedAt: string | null;
  aiResolvability: string;
  aiClarity: string;
  aiManipulabilityRisk: string;
  aiExplanation: string;
  aiEvaluatedAt: string;
  needsAiEvaluation: boolean;
  createdAt: string;
  updatedAt: string;
}