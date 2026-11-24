import { RevenueSplitConfig } from '../modules/revenue-split/interfaces/revenue-split-config.interface';

export const defaultRevenueSplitConfig: RevenueSplitConfig = {
  id: 'RSC001',
  commissionPct: 10,
  convenienceFeeFlat: 2500,
  gatewayFeePct: 1.5,
  supportCostWeights: {
    cancellation: 0,
    complaint: 0,
    sos: 0,
    lost_and_found: 0,
    dispute: 0,
  },
  updatedAt: new Date(0).toISOString(),
};
