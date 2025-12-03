import { debounce, throttle, deepClone, groupBy, chunk, unique, sortBy, randomId, sleep, retry } from '../helpers';

jest.useFakeTimers();

describe('debounce', () => {
  it('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('test');
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(299);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should cancel previous calls when called again', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('first');
    jest.advanceTimersByTime(100);
    debouncedFn('second');
    jest.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('second');
  });

  it('should handle multiple arguments', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('arg1', 'arg2', 123);
    jest.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });
});

describe('throttle', () => {
  it('should call function immediately on first call', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 300);

    throttledFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should prevent function calls within throttle period', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 300);

    throttledFn('first');
    jest.advanceTimersByTime(100);
    throttledFn('second');
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(200);
    throttledFn('third');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should allow calls after throttle period expires', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 300);

    throttledFn('first');
    jest.advanceTimersByTime(300);
    throttledFn('second');

    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe('deepClone', () => {
  it('should clone primitive values', () => {
    expect(deepClone(5)).toBe(5);
    expect(deepClone('test')).toBe('test');
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });

  it('should clone arrays', () => {
    const arr = [1, 2, 3];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
  });

  it('should clone nested arrays', () => {
    const arr = [1, [2, 3], [4, [5, 6]]];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned[1]).not.toBe(arr[1]);
    expect(cloned[2][1]).not.toBe(arr[2][1]);
  });

  it('should clone objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });

  it('should clone Date objects', () => {
    const date = new Date('2024-01-01');
    const cloned = deepClone(date);
    expect(cloned).toEqual(date);
    expect(cloned).not.toBe(date);
    expect(cloned).toBeInstanceOf(Date);
  });

  it('should clone complex nested structures', () => {
    const complex = {
      arr: [1, 2, { nested: true }],
      date: new Date('2024-01-01'),
      obj: { a: 1, b: [1, 2, 3] },
    };
    const cloned = deepClone(complex);
    expect(cloned).toEqual(complex);
    expect(cloned).not.toBe(complex);
    expect(cloned.date).not.toBe(complex.date);
  });
});

describe('groupBy', () => {
  it('should group array items by key', () => {
    const items = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
      { category: 'A', value: 3 },
    ];
    const grouped = groupBy(items, 'category');
    expect(grouped['A']).toHaveLength(2);
    expect(grouped['B']).toHaveLength(1);
  });

  it('should handle empty arrays', () => {
    const grouped = groupBy([], 'category');
    expect(grouped).toEqual({});
  });

  it('should handle numeric keys', () => {
    const items = [
      { id: 1, value: 'a' },
      { id: 2, value: 'b' },
      { id: 1, value: 'c' },
    ];
    const grouped = groupBy(items, 'id');
    expect(grouped['1']).toHaveLength(2);
    expect(grouped['2']).toHaveLength(1);
  });
});

describe('chunk', () => {
  it('should split array into chunks', () => {
    const arr = [1, 2, 3, 4, 5];
    const chunks = chunk(arr, 2);
    expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should handle chunk size equal to array length', () => {
    const arr = [1, 2, 3];
    const chunks = chunk(arr, 3);
    expect(chunks).toEqual([[1, 2, 3]]);
  });

  it('should handle chunk size larger than array', () => {
    const arr = [1, 2, 3];
    const chunks = chunk(arr, 10);
    expect(chunks).toEqual([[1, 2, 3]]);
  });

  it('should handle empty arrays', () => {
    const chunks = chunk([], 2);
    expect(chunks).toEqual([]);
  });
});

describe('unique', () => {
  it('should remove duplicates from array', () => {
    const arr = [1, 2, 2, 3, 3, 3];
    expect(unique(arr)).toEqual([1, 2, 3]);
  });

  it('should handle arrays without duplicates', () => {
    const arr = [1, 2, 3];
    expect(unique(arr)).toEqual([1, 2, 3]);
  });

  it('should remove duplicates by object key', () => {
    const items = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 1, name: 'C' },
    ];
    const uniqueItems = unique(items, 'id');
    expect(uniqueItems).toHaveLength(2);
    expect(uniqueItems[0].id).toBe(1);
    expect(uniqueItems[1].id).toBe(2);
  });

  it('should handle empty arrays', () => {
    expect(unique([])).toEqual([]);
  });
});

describe('sortBy', () => {
  it('should sort array by key in ascending order', () => {
    const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
    const sorted = sortBy(items, 'value', 'asc');
    expect(sorted[0].value).toBe(1);
    expect(sorted[1].value).toBe(2);
    expect(sorted[2].value).toBe(3);
  });

  it('should sort array by key in descending order', () => {
    const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
    const sorted = sortBy(items, 'value', 'desc');
    expect(sorted[0].value).toBe(3);
    expect(sorted[1].value).toBe(2);
    expect(sorted[2].value).toBe(1);
  });

  it('should not mutate original array', () => {
    const items = [{ value: 3 }, { value: 1 }];
    const original = JSON.stringify(items);
    sortBy(items, 'value');
    expect(JSON.stringify(items)).toBe(original);
  });

  it('should sort strings alphabetically', () => {
    const items = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
    const sorted = sortBy(items, 'name', 'asc');
    expect(sorted[0].name).toBe('Alice');
    expect(sorted[1].name).toBe('Bob');
    expect(sorted[2].name).toBe('Charlie');
  });
});

describe('randomId', () => {
  it('should generate id of specified length', () => {
    const id = randomId(10);
    expect(id).toHaveLength(10);
  });

  it('should use default length of 8', () => {
    const id = randomId();
    expect(id).toHaveLength(8);
  });

  it('should generate different ids', () => {
    const id1 = randomId(10);
    const id2 = randomId(10);
    expect(id1).not.toBe(id2);
  });

  it('should only contain valid characters', () => {
    const id = randomId(100);
    expect(/^[A-Za-z0-9]+$/.test(id)).toBe(true);
  });
});

describe('sleep', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should resolve after specified delay', async () => {
    const promise = sleep(500);
    jest.advanceTimersByTime(500);
    await expect(promise).resolves.toBeUndefined();
  });

  it('should handle immediate sleep', async () => {
    const promise = sleep(0);
    jest.advanceTimersByTime(0);
    await expect(promise).resolves.toBeUndefined();
  });
});

describe('retry', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  it('should succeed on first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await retry(mockFn, 3, 100);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const result = await retry(mockFn, 3, 10);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const error = new Error('persistent failure');
    const mockFn = jest.fn().mockRejectedValue(error);

    await expect(retry(mockFn, 2, 10)).rejects.toThrow('persistent failure');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should use default max attempts of 3', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(retry(mockFn)).rejects.toThrow();
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
});
