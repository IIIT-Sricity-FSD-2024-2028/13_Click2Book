import { RevenueSplitConfig } from '../modules/revenue-split/interfaces/revenue-split-config.interface';

export const defaultRevenueSplitConfig: RevenueSplitConfig = {
  id: 'RSC001',
  commissionPct: 10,
  convenienceFeeFlat: 2500,
  gatewayFeePct: 1.5,
  supportCostWeights: {
    cancellation: 800,
    complaint: 3500,
    sos: 0,
    lost_and_found: 1500,
    dispute: 3000,
  },
  updatedAt: new Date(0).toISOString(),
};
