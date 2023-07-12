import { Injectable } from '@nestjs/common';

@Injectable()
export class RoiService {
  private expensesPercentage = 0.5;
  private mortgagePercentage = 0.0767;

  calculateCashFlow(annualCashFlow: number, mortgage: boolean): number {
    const expenses =
      annualCashFlow *
      (mortgage ? this.mortgagePercentage : 0 + this.expensesPercentage);
    return annualCashFlow - expenses;
  }

  cashOnCashReturn(annualCashFlow: number, totalCashInvested: number) {
    const annualNetCashFlow = this.calculateCashFlow(annualCashFlow, true);
    return (annualNetCashFlow / totalCashInvested) * 100;
  }

  calculateCapRate(annualCashFlow: number, purchasePrice: number): number {
    const annualNetCashFlow = this.calculateCashFlow(annualCashFlow, true);
    return (annualNetCashFlow / purchasePrice) * 100;
  }
}
