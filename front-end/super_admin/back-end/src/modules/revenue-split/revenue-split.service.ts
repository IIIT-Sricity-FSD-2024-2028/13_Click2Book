import { Injectable } from '@nestjs/common';
import { RevenueSplitRepository } from './revenue-split.repository';
import { UpdateRevenueSplitConfigDto } from './dto/revenue-split-config.dto';
import { RevenueSplitConfig } from './interfaces/revenue-split-config.interface';
import { toPaise, fromPaise } from '../ledger/utils/money.util';
import { successResponse } from '../../common/utils/response.util';
import { PlatformService } from '../platform/platform.service';

const REPRESENTATIVE_FARE_PAISE = toPaise(500);

@Injectable()
export class RevenueSplitService {
  constructor(
    private readonly repo: RevenueSplitRepository,
    private readonly platform: PlatformService,
  ) {}

  getConfig() {
    return successResponse('Revenue split config', this.getActiveConfig());
  }

  /**
   * The convenience fee customers pay at checkout lives in Platform Settings
   * (fees.convenienceFee, rupees); the ledger reads it from here in paise, so
   * the amount charged and the amount recorded can never disagree.
   */
  getActiveConfig(): RevenueSplitConfig {
    return {
      ...this.repo.getActive(),
      convenienceFeeFlat: Math.round(
        this.platform.get().fees.convenienceFee * 100,
      ),
    };
  }

  updateConfig(input: UpdateRevenueSplitConfigDto) {
    // Fields the client did not send arrive as undefined; drop them so they keep their stored value.
    const dto = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    ) as UpdateRevenueSplitConfigDto;
    if (dto.convenienceFeeFlat !== undefined) {
      this.platform.updateSettings(
        { fees: { convenienceFee: dto.convenienceFeeFlat / 100 } },
        'revenue-config',
      );
    }
    const current = this.getActiveConfig();
    const merged: RevenueSplitConfig = {
      ...current,
      ...dto,
      supportCostWeights: dto.supportCostWeights
        ? { ...current.supportCostWeights, ...dto.supportCostWeights }
        : current.supportCostWeights,
    };

    const warning = this.checkPoolWarning(merged);

    this.repo.update({
      commissionPct: merged.commissionPct,
      convenienceFeeFlat: merged.convenienceFeeFlat,
      gatewayFeePct: merged.gatewayFeePct,
      supportCostWeights: merged.supportCostWeights,
    });

    const response = successResponse(
      'Revenue split config updated',
      this.getActiveConfig(),
    );
    return warning ? { ...response, warning } : response;
  }

  private checkPoolWarning(config: RevenueSplitConfig): string | null {
    const commission = Math.round(
      (REPRESENTATIVE_FARE_PAISE * config.commissionPct) / 100,
    );
    const pool = commission + config.convenienceFeeFlat;
    const gatewayFee = Math.round(
      (REPRESENTATIVE_FARE_PAISE * config.gatewayFeePct) / 100,
    );

    const weights = Object.values(config.supportCostWeights).filter(
      (w) => w > 0,
    );
    const avgSupportDraw = weights.length
      ? weights.reduce((a, b) => a + b, 0) / weights.length
      : 0;

    const projectedNet = pool - gatewayFee - avgSupportDraw;
    if (projectedNet < 0) {
      return (
        `At a representative fare of Rs.500, gateway fee (Rs.${fromPaise(gatewayFee).toFixed(2)}) ` +
        `plus average support cost (Rs.${fromPaise(avgSupportDraw).toFixed(2)}) would exceed the ` +
        `platform pool (Rs.${fromPaise(pool).toFixed(2)}) by Rs.${fromPaise(Math.abs(projectedNet)).toFixed(2)}. ` +
        `Consider raising commissionPct/convenienceFeeFlat or lowering supportCostWeights.`
      );
    }
    return null;
  }
}
