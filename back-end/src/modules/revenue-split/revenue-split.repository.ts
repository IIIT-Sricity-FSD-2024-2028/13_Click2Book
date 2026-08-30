import { Injectable } from '@nestjs/common';
import { RevenueSplitConfig } from './interfaces/revenue-split-config.interface';
import { defaultRevenueSplitConfig } from '../../seed/revenue-split-config.seed';

@Injectable()
export class RevenueSplitRepository {
  private config: RevenueSplitConfig = { ...defaultRevenueSplitConfig };

  getActive(): RevenueSplitConfig {
    return this.config;
  }

  update(data: Partial<Omit<RevenueSplitConfig, 'id'>>): RevenueSplitConfig {
    this.config = {
      ...this.config,
      ...data,
      supportCostWeights: data.supportCostWeights
        ? { ...this.config.supportCostWeights, ...data.supportCostWeights }
        : this.config.supportCostWeights,
      updatedAt: new Date().toISOString(),
    };
    return this.config;
  }
}
