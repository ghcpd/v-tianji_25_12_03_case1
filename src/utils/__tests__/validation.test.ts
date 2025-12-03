import { validateEmail, validatePhone, validatePassword, validateUrl, validateCreditCard, sanitizeInput, validatePostalCode } from '../validation';

describe('validateEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    expect(validateEmail('user+tag@example.com')).toBe(true);
    expect(validateEmail('user_123@sub.domain.com')).toBe(true);
  });

  it('should return false for invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('invalid@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('test@.com')).toBe(false);
  });

  it('should return false for empty strings', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('should return false for emails with spaces', () => {
    expect(validateEmail('test @example.com')).toBe(false);
    expect(validateEmail('test@ example.com')).toBe(false);
  });

  it('should return false for emails without domain', () => {
    expect(validateEmail('test@')).toBe(false);
  });
});

describe('validatePhone', () => {
  it('should return true for valid phone numbers', () => {
    expect(validatePhone('+1234567890')).toBe(true);
    expect(validatePhone('123-456-7890')).toBe(true);
    expect(validatePhone('(123) 456-7890')).toBe(true);
    expect(validatePhone('1234567890')).toBe(true);
    expect(validatePhone('+1 (123) 456-7890')).toBe(true);
  });

  it('should return false for invalid phone numbers', () => {
    expect(validatePhone('123')).toBe(false);
    expect(validatePhone('abc')).toBe(false);
    expect(validatePhone('12345')).toBe(false);
  });

  it('should return false for empty strings', () => {
    expect(validatePhone('')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(validatePhone('1234567890')).toBe(true); // 10 digits
    expect(validatePhone('12345678901234567890')).toBe(true); // long number
  });
});

describe('validatePassword', () => {
  it('should return true for valid passwords', () => {
    expect(validatePassword('Password123')).toBe(true);
    expect(validatePassword('SecurePass1')).toBe(true);
    expect(validatePassword('MyP@ssw0rd')).toBe(true);
  });

  it('should return false for passwords without uppercase', () => {
    expect(validatePassword('password123')).toBe(false);
  });

  it('should return false for passwords without lowercase', () => {
    expect(validatePassword('PASSWORD123')).toBe(false);
  });

  it('should return false for passwords without numbers', () => {
    expect(validatePassword('PasswordOnly')).toBe(false);
  });

  it('should return false for short passwords', () => {
    expect(validatePassword('Pass1')).toBe(false);
    expect(validatePassword('Pass123')).toBe(false);
  });

  it('should return false for empty passwords', () => {
    expect(validatePassword('')).toBe(false);
  });

  it('should accept passwords with special characters if they have required elements', () => {
    expect(validatePassword('P@ssw0rd')).toBe(true);
  });

  it('should accept minimum length of 8', () => {
    expect(validatePassword('Pass1234')).toBe(true);
    expect(validatePassword('Pass123')).toBe(false);
  });
});

describe('validateUrl', () => {
  it('should return true for valid URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('http://example.com')).toBe(true);
    expect(validateUrl('https://sub.example.com/path')).toBe(true);
    expect(validateUrl('https://example.com:8080')).toBe(true);
    expect(validateUrl('https://example.com/path?query=value')).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    expect(validateUrl('not a url')).toBe(false);
    expect(validateUrl('example.com')).toBe(false);
    expect(validateUrl('')).toBe(false);
  });

  it('should handle various protocols', () => {
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('http://example.com')).toBe(true);
  });
});

describe('validateCreditCard', () => {
  it('should return true for valid credit card numbers', () => {
    expect(validateCreditCard('4532015112830366')).toBe(true);
    expect(validateCreditCard('4532 0151 1283 0366')).toBe(true);
  });

  it('should return false for invalid credit card numbers', () => {
    expect(validateCreditCard('1234567890123456')).toBe(false);
    expect(validateCreditCard('4532015112830367')).toBe(false);
  });

  it('should handle cards with spaces', () => {
    expect(validateCreditCard('4532 0151 1283 0366')).toBe(true);
  });

  it('should reject cards with invalid length', () => {
    expect(validateCreditCard('12345')).toBe(false);
    expect(validateCreditCard('123456789012345678901')).toBe(false);
  });

  it('should reject non-numeric characters', () => {
    expect(validateCreditCard('4532-0151-1283-0366a')).toBe(false);
  });

  it('should validate using Luhn algorithm', () => {
    // Valid card: sum % 10 === 0
    const valid = validateCreditCard('4532015112830366');
    expect(valid).toBe(true);
  });
});

describe('sanitizeInput', () => {
  it('should remove angle brackets', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    expect(sanitizeInput('Hello <world>')).toBe('Hello world');
  });

  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
    expect(sanitizeInput('\t\ntext\n\t')).toBe('text');
  });

  it('should handle normal input', () => {
    expect(sanitizeInput('Normal text')).toBe('Normal text');
  });

  it('should handle empty strings', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('should remove multiple angle brackets', () => {
    expect(sanitizeInput('<<multiple>>')).toBe('multiple');
  });
});

describe('validatePostalCode', () => {
  it('should validate US postal codes', () => {
    expect(validatePostalCode('12345', 'US')).toBe(true);
    expect(validatePostalCode('12345-6789', 'US')).toBe(true);
  });

  it('should reject invalid US postal codes', () => {
    expect(validatePostalCode('1234', 'US')).toBe(false);
    expect(validatePostalCode('123456', 'US')).toBe(false);
  });

  it('should validate UK postal codes', () => {
    expect(validatePostalCode('SW1A 1AA', 'UK')).toBe(true);
    expect(validatePostalCode('M1 1AE', 'UK')).toBe(true);
    expect(validatePostalCode('B33 8TH', 'UK')).toBe(true);
  });

  it('should validate Canadian postal codes', () => {
    expect(validatePostalCode('K1A 0B1', 'CA')).toBe(true);
    expect(validatePostalCode('M5V 3A8', 'CA')).toBe(true);
  });

  it('should return false for unknown countries', () => {
    expect(validatePostalCode('12345', 'UNKNOWN')).toBe(false);
  });

  it('should be case insensitive for UK codes', () => {
    expect(validatePostalCode('sw1a 1aa', 'UK')).toBe(true);
  });

  it('should handle edge cases for US codes', () => {
    expect(validatePostalCode('00000', 'US')).toBe(true);
    expect(validatePostalCode('99999', 'US')).toBe(true);
  });
});
