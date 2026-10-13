export interface RevenueSplitConfig {
  id: string;
  commissionPct: number;
  convenienceFeeFlat: number; // paise
  gatewayFeePct: number;
  supportCostWeights: Record<string, number>; // paise, keyed by ticket category
  updatedAt: string;
}
