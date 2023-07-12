import { Injectable } from '@nestjs/common';
import { MortgageData } from './schema/roi.types';

@Injectable()
export class RoiService {
  private expensesPercentage = 0.5;
  private mortgagePercentage = 0.0767;

  calculateCashFlow(annualCashFlow: number, mortgage?: MortgageData): number {
    const maintenanceExpenses = annualCashFlow * this.expensesPercentage;
    const mortgageExpenses = this.isValidMortgageData(mortgage)
      ? this.calculateMortgagePayments(mortgage)
      : 0;

    return annualCashFlow - maintenanceExpenses - mortgageExpenses;
  }

  calculateCashOnCashReturn(annualCashFlow: number, mortgage: MortgageData) {
    const annualNetCashFlow = this.calculateCashFlow(annualCashFlow, mortgage);
    return (annualNetCashFlow / mortgage.downPayment) * 100;
  }

  calculateCapRate(annualCashFlow: number, purchasePrice: number): number {
    const annualNetCashFlow = this.calculateCashFlow(annualCashFlow);
    return (annualNetCashFlow / purchasePrice) * 100;
  }

  calculateYearlyMortgage(
    purchasePrice: number,
    downPayment: number,
    years: number,
  ) {
    const creditAmount = purchasePrice - downPayment;
    const creditPercent = years * this.mortgagePercentage;
    const totalCreditAmount = creditAmount * creditPercent;
    return totalCreditAmount / years;
  }

  calculateMortgagePayments({
    propertyCost,
    downPayment,
    interestRate,
    years,
  }: MortgageData) {
    // Calculate the loan amount
    const loanAmount = propertyCost - downPayment;

    // Convert the annual interest rate to monthly interest rate
    const monthlyInterestRate = interestRate / 100 / 12;

    // Convert the total number of years to the total number of months
    const months = years * 12;

    // Calculate the monthly mortgage payment
    const numerator =
      monthlyInterestRate * Math.pow(1 + monthlyInterestRate, months);
    const denominator = Math.pow(1 + monthlyInterestRate, months) - 1;
    const monthlyPayment = loanAmount * (numerator / denominator);

    // Round the monthly payment to two decimal places
    const roundedPayment = Math.round(monthlyPayment * 100) / 100;

    return roundedPayment;
  }

  isValidMortgageData(data: MortgageData) {
    return (
      !!data &&
      !!data.downPayment &&
      !!data.interestRate &&
      !!data.propertyCost &&
      !!data.years
    );
  }
}
