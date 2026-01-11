import { formatCurrency, calculateTax, calculateDiscount, calculateShipping, applyBulkDiscount, calculateInstallmentPayment } from '../pricing';

describe('formatCurrency', () => {
  it('should format USD currency correctly', () => {
    expect(formatCurrency(100, 'USD')).toBe('$100.00');
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('should use USD as default currency', () => {
    expect(formatCurrency(100)).toBe('$100.00');
  });

  it('should handle zero amount', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('should handle large amounts', () => {
    expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000.00');
  });

  it('should format decimals correctly', () => {
    expect(formatCurrency(99.99, 'USD')).toBe('$99.99');
    expect(formatCurrency(10.5, 'USD')).toBe('$10.50');
  });

  it('should format EUR currency correctly', () => {
    const result = formatCurrency(100, 'EUR');
    expect(result).toContain('100');
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

  it('should handle high tax rates', () => {
    expect(calculateTax(100, 0.5)).toBe(50);
  });

  it('should handle small amounts', () => {
    expect(calculateTax(1, 0.1)).toBe(0.1);
  });

  it('should handle fractional results', () => {
    expect(calculateTax(33.33, 0.15)).toBe(5);
  });
});

describe('calculateDiscount', () => {
  it('should return discount for valid percentage code', () => {
    const discount = calculateDiscount('SAVE10', 100);
    expect(discount).toEqual({
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
    });
  });

  it('should return discount for valid fixed code', () => {
    const discount = calculateDiscount('FLAT50', 250);
    expect(discount).toEqual({
      code: 'FLAT50',
      type: 'fixed',
      value: 50,
      minPurchase: 200,
    });
  });

  it('should return null for invalid code', () => {
    expect(calculateDiscount('INVALID', 100)).toBeNull();
  });

  it('should return null if minimum purchase not met', () => {
    expect(calculateDiscount('SAVE20', 50)).toBeNull();
  });

  it('should be case insensitive', () => {
    const uppercase = calculateDiscount('SAVE10', 100);
    const lowercase = calculateDiscount('save10', 100);
    const mixedcase = calculateDiscount('SaVe10', 100);
    expect(uppercase).not.toBeNull();
    expect(lowercase).not.toBeNull();
    expect(mixedcase).not.toBeNull();
  });

  it('should handle VIP discount with maxDiscount', () => {
    const discount = calculateDiscount('VIP30', 500);
    expect(discount?.maxDiscount).toBe(150);
  });

  it('should return null for VIP code below minPurchase', () => {
    expect(calculateDiscount('VIP30', 400)).toBeNull();
  });

  it('should apply FLAT50 with minPurchase requirement', () => {
    expect(calculateDiscount('FLAT50', 200)).not.toBeNull();
    expect(calculateDiscount('FLAT50', 199)).toBeNull();
  });
});

describe('calculateShipping', () => {
  it('should calculate basic shipping cost', () => {
    const cost = calculateShipping(10, 100, false);
    // baseRate(5) + weight(10 * 0.5) + distance(100 * 0.01) = 5 + 5 + 1 = 11
    expect(cost).toBe(11);
  });

  it('should double cost for express shipping', () => {
    const regular = calculateShipping(10, 100, false);
    const express = calculateShipping(10, 100, true);
    expect(express).toBe(regular * 2);
  });

  it('should handle zero weight and distance', () => {
    const cost = calculateShipping(0, 0, false);
    expect(cost).toBe(5); // Just the base rate
  });

  it('should handle heavy weight', () => {
    const cost = calculateShipping(100, 100, false);
    // baseRate(5) + weight(100 * 0.5) + distance(100 * 0.01) = 5 + 50 + 1 = 56
    expect(cost).toBe(56);
  });

  it('should handle large distance', () => {
    const cost = calculateShipping(10, 1000, false);
    // baseRate(5) + weight(10 * 0.5) + distance(1000 * 0.01) = 5 + 5 + 10 = 20
    expect(cost).toBe(20);
  });

  it('should round to 2 decimal places', () => {
    const cost = calculateShipping(3.33, 77.77, false);
    expect(cost).toEqual(expect.any(Number));
    expect((cost * 100) % 1).toBeLessThan(0.01);
  });

  it('should handle express with heavy weight', () => {
    const regular = calculateShipping(100, 1000, false);
    const express = calculateShipping(100, 1000, true);
    expect(express).toBe(regular * 2);
  });
});

describe('applyBulkDiscount', () => {
  it('should apply 15% discount for 100+ items', () => {
    expect(applyBulkDiscount(100, 10)).toBe(8.5);
    expect(applyBulkDiscount(150, 20)).toBe(17);
  });

  it('should apply 10% discount for 50+ items', () => {
    expect(applyBulkDiscount(50, 10)).toBe(9);
    expect(applyBulkDiscount(75, 10)).toBe(9);
  });

  it('should apply 5% discount for 20+ items', () => {
    expect(applyBulkDiscount(20, 10)).toBe(9.5);
    expect(applyBulkDiscount(30, 10)).toBe(9.5);
  });

  it('should apply no discount for less than 20 items', () => {
    expect(applyBulkDiscount(10, 10)).toBe(10);
    expect(applyBulkDiscount(19, 10)).toBe(10);
  });

  it('should handle boundary quantities', () => {
    expect(applyBulkDiscount(19, 100)).toBe(100);
    expect(applyBulkDiscount(20, 100)).toBe(95);
    expect(applyBulkDiscount(49, 100)).toBe(95);
    expect(applyBulkDiscount(50, 100)).toBe(90);
    expect(applyBulkDiscount(99, 100)).toBe(90);
    expect(applyBulkDiscount(100, 100)).toBe(85);
  });

  it('should handle float prices', () => {
    expect(applyBulkDiscount(100, 10.99)).toBe(9.3415);
  });
});

describe('calculateInstallmentPayment', () => {
  it('should calculate monthly payment with interest', () => {
    const payment = calculateInstallmentPayment(1000, 12, 12);
    expect(payment).toBeGreaterThan(1000 / 12);
    expect(payment).toBeCloseTo(86.77, 1);
  });

  it('should return principal divided by months when rate is 0', () => {
    const payment = calculateInstallmentPayment(1000, 0, 12);
    expect(payment).toBe(1000 / 12);
  });

  it('should handle single month payment', () => {
    const payment = calculateInstallmentPayment(100, 12, 1);
    expect(payment).toBeGreaterThan(100);
  });

  it('should round to 2 decimal places', () => {
    const payment = calculateInstallmentPayment(1000, 12, 12);
    const rounded = Math.round(payment * 100) / 100;
    expect(payment).toBe(rounded);
  });

  it('should handle high interest rates', () => {
    const payment = calculateInstallmentPayment(1000, 24, 12);
    expect(payment).toBeGreaterThan(calculateInstallmentPayment(1000, 12, 12));
  });

  it('should handle large principal amounts', () => {
    const payment = calculateInstallmentPayment(100000, 12, 60);
    expect(payment).toBeGreaterThan(100000 / 60);
  });

  it('should handle long payment periods', () => {
    const payment = calculateInstallmentPayment(1000, 12, 360);
    expect(payment).toBeLessThan(1000 / 360);
  });
});
