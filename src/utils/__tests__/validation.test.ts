import { validateEmail, validatePhone, validatePassword, validateUrl, validateCreditCard, sanitizeInput, validatePostalCode } from '../validation';

describe('validateEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    expect(validateEmail('user+tag@example.com')).toBe(true);
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

  it('should return false for email without domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('should return false for email with spaces', () => {
    expect(validateEmail('user @example.com')).toBe(false);
  });

  it('should accept email with numbers', () => {
    expect(validateEmail('user123@example456.com')).toBe(true);
  });

  it('should accept email with underscores', () => {
    expect(validateEmail('user_name@example.com')).toBe(true);
  });
});

describe('validatePhone', () => {
  it('should return true for valid phone numbers', () => {
    expect(validatePhone('+1234567890')).toBe(true);
    expect(validatePhone('123-456-7890')).toBe(true);
    expect(validatePhone('(123) 456-7890')).toBe(true);
  });

  it('should return false for invalid phone numbers', () => {
    expect(validatePhone('123')).toBe(false);
    expect(validatePhone('abc')).toBe(false);
  });

  it('should accept international format', () => {
    expect(validatePhone('+44 20 7946 0958')).toBe(true);
  });

  it('should accept numbers with parentheses', () => {
    expect(validatePhone('(555) 123-4567')).toBe(true);
  });

  it('should return false for numbers too short', () => {
    expect(validatePhone('12345')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(validatePhone('')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should return true for valid passwords', () => {
    expect(validatePassword('Password123')).toBe(true);
    expect(validatePassword('SecurePass1')).toBe(true);
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
  });

  it('should return false for 7 character password', () => {
    expect(validatePassword('Pass12A')).toBe(false);
  });

  it('should return true for exactly 8 character valid password', () => {
    expect(validatePassword('Pass123A')).toBe(true);
  });

  it('should return true for long valid password', () => {
    expect(validatePassword('VerySecurePassword123')).toBe(true);
  });
});

describe('validateUrl', () => {
  it('should return true for valid HTTP URLs', () => {
    expect(validateUrl('http://example.com')).toBe(true);
    expect(validateUrl('http://www.example.com')).toBe(true);
  });

  it('should return true for valid HTTPS URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('https://www.example.com/path')).toBe(true);
  });

  it('should return true for URLs with query parameters', () => {
    expect(validateUrl('https://example.com?param=value')).toBe(true);
  });

  it('should return true for URLs with hash', () => {
    expect(validateUrl('https://example.com#section')).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    expect(validateUrl('not a url')).toBe(false);
    expect(validateUrl('example.com')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(validateUrl('')).toBe(false);
  });

  it('should accept URLs with ports', () => {
    expect(validateUrl('http://example.com:8080')).toBe(true);
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

  it('should return false for non-numeric characters', () => {
    expect(validateCreditCard('1234abcd5678efgh')).toBe(false);
  });

  it('should return false for too short numbers', () => {
    expect(validateCreditCard('123456789012')).toBe(false);
  });

  it('should return false for too long numbers', () => {
    expect(validateCreditCard('12345678901234567890')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(validateCreditCard('')).toBe(false);
  });

  it('should validate 13-digit cards', () => {
    expect(validateCreditCard('4111111111111')).toBe(true);
  });
});

describe('sanitizeInput', () => {
  it('should remove angle brackets', () => {
    expect(sanitizeInput('Hello <script>')).toBe('Hello script');
    expect(sanitizeInput('<div>test</div>')).toBe('divtest/div');
  });

  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
    expect(sanitizeInput('\n\ttest\n')).toBe('test');
  });

  it('should handle empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('should handle string with only brackets', () => {
    expect(sanitizeInput('<<>>')).toBe('');
  });

  it('should preserve safe characters', () => {
    expect(sanitizeInput('Hello World!')).toBe('Hello World!');
  });

  it('should handle multiple spaces', () => {
    expect(sanitizeInput('  hello   world  ')).toBe('hello   world');
  });
});

describe('validatePostalCode', () => {
  describe('US postal codes', () => {
    it('should validate 5-digit zip codes', () => {
      expect(validatePostalCode('12345', 'US')).toBe(true);
    });

    it('should validate ZIP+4 codes', () => {
      expect(validatePostalCode('12345-6789', 'US')).toBe(true);
    });

    it('should return false for 4-digit codes', () => {
      expect(validatePostalCode('1234', 'US')).toBe(false);
    });

    it('should return false for 6-digit codes', () => {
      expect(validatePostalCode('123456', 'US')).toBe(false);
    });

    it('should return false for codes with letters', () => {
      expect(validatePostalCode('1234A', 'US')).toBe(false);
    });
  });

  describe('UK postal codes', () => {
    it('should validate UK postal codes', () => {
      expect(validatePostalCode('SW1A 1AA', 'UK')).toBe(true);
      expect(validatePostalCode('M1 1AE', 'UK')).toBe(true);
    });

    it('should validate without space', () => {
      expect(validatePostalCode('SW1A1AA', 'UK')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(validatePostalCode('sw1a 1aa', 'UK')).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(validatePostalCode('INVALID', 'UK')).toBe(false);
    });
  });

  describe('CA postal codes', () => {
    it('should validate Canadian postal codes', () => {
      expect(validatePostalCode('K1A 0B1', 'CA')).toBe(true);
      expect(validatePostalCode('V5K 0A1', 'CA')).toBe(true);
    });

    it('should validate without space', () => {
      expect(validatePostalCode('K1A0B1', 'CA')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(validatePostalCode('k1a 0b1', 'CA')).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(validatePostalCode('123456', 'CA')).toBe(false);
    });
  });

  describe('Unknown countries', () => {
    it('should return false for unknown country codes', () => {
      expect(validatePostalCode('12345', 'XX')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      expect(validatePostalCode('', 'US')).toBe(false);
    });

    it('should default to US when no country specified', () => {
      expect(validatePostalCode('12345')).toBe(true);
    });
  });
});
