import { formatCurrency, calculateTax, calculateDiscount, calculateShipping, applyBulkDiscount, calculateInstallmentPayment } from '../pricing';

describe('formatCurrency', () => {
  it('should format USD currency correctly', () => {
    expect(formatCurrency(100, 'USD')).toBe('$100.00');
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('should use USD as default currency', () => {
    expect(formatCurrency(100)).toBe('$100.00');
  });

  it('should format EUR currency correctly', () => {
    expect(formatCurrency(100, 'EUR')).toContain('100');
  });

  it('should format GBP currency correctly', () => {
    expect(formatCurrency(100, 'GBP')).toContain('100');
  });

  it('should handle zero amount', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('should handle negative amounts', () => {
    expect(formatCurrency(-50, 'USD')).toBe('-$50.00');
  });

  it('should handle decimal amounts', () => {
    expect(formatCurrency(99.99, 'USD')).toBe('$99.99');
  });

  it('should handle large amounts', () => {
    expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000.00');
  });
});

describe('calculateTax', () => {
  it('should calculate tax correctly', () => {
    expect(calculateTax(100, 0.1)).toBe(10);
    expect(calculateTax(100, 0.15)).toBe(15);
  });

  it('should round to 2 decimal places', () => {
    expect(calculateTax(100, 0.123)).toBe(12.3);
  });

  it('should handle zero tax rate', () => {
    expect(calculateTax(100, 0)).toBe(0);
  });

  it('should handle zero amount', () => {
    expect(calculateTax(0, 0.1)).toBe(0);
  });

  it('should handle high tax rates', () => {
    expect(calculateTax(100, 0.5)).toBe(50);
  });

  it('should handle decimal amounts', () => {
    expect(calculateTax(99.99, 0.08)).toBe(8);
  });
});

describe('calculateDiscount', () => {
  it('should return discount for valid code SAVE10', () => {
    const discount = calculateDiscount('SAVE10', 100);
    expect(discount).toEqual({
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
    });
  });

  it('should return discount for SAVE20 when minimum met', () => {
    const discount = calculateDiscount('SAVE20', 100);
    expect(discount).toEqual({
      code: 'SAVE20',
      type: 'percentage',
      value: 20,
      minPurchase: 100,
    });
  });

  it('should return discount for FLAT50 when minimum met', () => {
    const discount = calculateDiscount('FLAT50', 200);
    expect(discount).toEqual({
      code: 'FLAT50',
      type: 'fixed',
      value: 50,
      minPurchase: 200,
    });
  });

  it('should return discount for VIP30 when minimum met', () => {
    const discount = calculateDiscount('VIP30', 500);
    expect(discount).toEqual({
      code: 'VIP30',
      type: 'percentage',
      value: 30,
      minPurchase: 500,
      maxDiscount: 150,
    });
  });

  it('should be case insensitive', () => {
    const discount = calculateDiscount('save10', 100);
    expect(discount).not.toBeNull();
    expect(discount?.code).toBe('SAVE10');
  });

  it('should return null for invalid code', () => {
    expect(calculateDiscount('INVALID', 100)).toBeNull();
  });

  it('should return null if minimum purchase not met', () => {
    expect(calculateDiscount('SAVE20', 50)).toBeNull();
  });

  it('should return null for FLAT50 below minimum', () => {
    expect(calculateDiscount('FLAT50', 199)).toBeNull();
  });

  it('should return null for VIP30 below minimum', () => {
    expect(calculateDiscount('VIP30', 499)).toBeNull();
  });

  it('should handle exact minimum purchase amount', () => {
    const discount = calculateDiscount('SAVE20', 100);
    expect(discount).not.toBeNull();
  });

  it('should handle empty code', () => {
    expect(calculateDiscount('', 100)).toBeNull();
  });
});

describe('calculateShipping', () => {
  it('should calculate basic shipping cost', () => {
    const cost = calculateShipping(10, 100, false);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBe(11);
  });

  it('should double cost for express shipping', () => {
    const regular = calculateShipping(10, 100, false);
    const express = calculateShipping(10, 100, true);
    expect(express).toBe(regular * 2);
  });

  it('should calculate cost with zero weight', () => {
    const cost = calculateShipping(0, 100, false);
    expect(cost).toBe(6);
  });

  it('should calculate cost with zero distance', () => {
    const cost = calculateShipping(10, 0, false);
    expect(cost).toBe(10);
  });

  it('should handle heavy weight', () => {
    const cost = calculateShipping(100, 100, false);
    expect(cost).toBeGreaterThan(50);
  });

  it('should handle long distance', () => {
    const cost = calculateShipping(10, 1000, false);
    expect(cost).toBeGreaterThan(15);
  });

  it('should round to 2 decimal places', () => {
    const cost = calculateShipping(3, 7, false);
    expect(cost).toBe(Math.round(cost * 100) / 100);
  });
});

describe('applyBulkDiscount', () => {
  it('should apply 15% discount for 100+ items', () => {
    expect(applyBulkDiscount(100, 10)).toBe(8.5);
  });

  it('should apply 10% discount for 50+ items', () => {
    expect(applyBulkDiscount(50, 10)).toBe(9);
  });

  it('should apply 5% discount for 20+ items', () => {
    expect(applyBulkDiscount(20, 10)).toBe(9.5);
  });

  it('should apply no discount for less than 20 items', () => {
    expect(applyBulkDiscount(10, 10)).toBe(10);
    expect(applyBulkDiscount(19, 10)).toBe(10);
  });

  it('should handle exact threshold values', () => {
    expect(applyBulkDiscount(20, 10)).toBe(9.5);
    expect(applyBulkDiscount(50, 10)).toBe(9);
    expect(applyBulkDiscount(100, 10)).toBe(8.5);
  });

  it('should handle decimal prices', () => {
    expect(applyBulkDiscount(100, 10.50)).toBeCloseTo(8.925, 2);
  });

  it('should handle zero quantity', () => {
    expect(applyBulkDiscount(0, 10)).toBe(10);
  });

  it('should handle large quantities', () => {
    expect(applyBulkDiscount(1000, 10)).toBe(8.5);
  });
});

describe('calculateInstallmentPayment', () => {
  it('should calculate monthly payment correctly', () => {
    const payment = calculateInstallmentPayment(1000, 12, 12);
    expect(payment).toBeGreaterThan(80);
    expect(payment).toBeLessThan(90);
  });

  it('should handle zero interest rate', () => {
    const payment = calculateInstallmentPayment(1000, 0, 10);
    expect(payment).toBe(100);
  });

  it('should handle single month', () => {
    const payment = calculateInstallmentPayment(1000, 12, 1);
    expect(payment).toBeGreaterThan(1000);
  });

  it('should handle high interest rate', () => {
    const payment = calculateInstallmentPayment(1000, 24, 12);
    expect(payment).toBeGreaterThan(90);
  });

  it('should round to 2 decimal places', () => {
    const payment = calculateInstallmentPayment(999.99, 11.5, 24);
    expect(payment).toBe(Math.round(payment * 100) / 100);
  });

  it('should handle large principal', () => {
    const payment = calculateInstallmentPayment(100000, 5, 360);
    expect(payment).toBeGreaterThan(500);
  });

  it('should handle short term loan', () => {
    const payment = calculateInstallmentPayment(5000, 6, 6);
    expect(payment).toBeGreaterThan(800);
  });
});
