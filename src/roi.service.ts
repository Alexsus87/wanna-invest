import { Injectable } from '@nestjs/common';

@Injectable()
export class RoiService {
  calculateCashFlow(grossRent: number, expenses: number): number {
    return grossRent - expenses;
  }
  cashOnCashReturn(annualCashFlow: number, totalCashInvested: number) {
    return (annualCashFlow / totalCashInvested) * 100;
  }
  calculateCapRate(netOperatingIncome: number, purchasePrice: number): number {
    return (netOperatingIncome / purchasePrice) * 100;
  }
}
