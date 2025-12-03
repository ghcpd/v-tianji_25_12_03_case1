import { debounce, throttle, deepClone, groupBy, chunk, unique, sortBy, randomId, sleep, retry } from '../helpers';

jest.useFakeTimers();

describe('debounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should debounce function calls', () => {
    const mockFn = jest.fn();
    const debounced = debounce(mockFn, 300);

    debounced('call1');
    debounced('call2');
    debounced('call3');

    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call3');
  });

  it('should call function after delay', () => {
    const mockFn = jest.fn();
    const debounced = debounce(mockFn, 500);

    debounced('test');
    jest.advanceTimersByTime(499);
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should cancel previous timeout', () => {
    const mockFn = jest.fn();
    const debounced = debounce(mockFn, 300);

    debounced('first');
    jest.advanceTimersByTime(200);
    debounced('second');
    jest.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('second');
  });

  it('should work with multiple arguments', () => {
    const mockFn = jest.fn();
    const debounced = debounce(mockFn, 300);

    debounced('arg1', 'arg2', 'arg3');
    jest.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });
});

describe('throttle', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should throttle function calls', () => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 300);

    throttled('call1');
    throttled('call2');
    throttled('call3');

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call1');
  });

  it('should allow calls after limit period', () => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 300);

    throttled('first');
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(300);

    throttled('second');
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenLastCalledWith('second');
  });

  it('should ignore calls within throttle period', () => {
    const mockFn = jest.fn();
    const throttled = throttle(mockFn, 500);

    throttled('call1');
    jest.advanceTimersByTime(100);
    throttled('call2');
    jest.advanceTimersByTime(100);
    throttled('call3');

    expect(mockFn).toHaveBeenCalledTimes(1);
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
    expect(cloned[2]).not.toBe(arr[2]);
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
    expect(cloned.getTime()).toBe(date.getTime());
  });

  it('should clone objects with nested structures', () => {
    const obj = {
      name: 'test',
      nested: {
        array: [1, 2, 3],
        object: { value: 42 },
      },
    };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned.nested).not.toBe(obj.nested);
    expect(cloned.nested.array).not.toBe(obj.nested.array);
  });

  it('should handle empty arrays and objects', () => {
    expect(deepClone([])).toEqual([]);
    expect(deepClone({})).toEqual({});
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

  it('should group by numeric keys', () => {
    const items = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 1, name: 'c' },
    ];
    const grouped = groupBy(items, 'id');
    expect(grouped['1']).toHaveLength(2);
    expect(grouped['2']).toHaveLength(1);
  });

  it('should handle empty array', () => {
    const grouped = groupBy([], 'key');
    expect(grouped).toEqual({});
  });

  it('should handle items with same key', () => {
    const items = [
      { type: 'A', value: 1 },
      { type: 'A', value: 2 },
      { type: 'A', value: 3 },
    ];
    const grouped = groupBy(items, 'type');
    expect(grouped['A']).toHaveLength(3);
  });
});

describe('chunk', () => {
  it('should split array into chunks', () => {
    const arr = [1, 2, 3, 4, 5];
    const chunks = chunk(arr, 2);
    expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should handle exact division', () => {
    const arr = [1, 2, 3, 4];
    const chunks = chunk(arr, 2);
    expect(chunks).toEqual([[1, 2], [3, 4]]);
  });

  it('should handle chunk size larger than array', () => {
    const arr = [1, 2];
    const chunks = chunk(arr, 5);
    expect(chunks).toEqual([[1, 2]]);
  });

  it('should handle empty array', () => {
    const chunks = chunk([], 2);
    expect(chunks).toEqual([]);
  });

  it('should handle chunk size of 1', () => {
    const arr = [1, 2, 3];
    const chunks = chunk(arr, 1);
    expect(chunks).toEqual([[1], [2], [3]]);
  });
});

describe('unique', () => {
  it('should remove duplicates from array', () => {
    const arr = [1, 2, 2, 3, 3, 3];
    expect(unique(arr)).toEqual([1, 2, 3]);
  });

  it('should work with strings', () => {
    const arr = ['a', 'b', 'a', 'c', 'b'];
    expect(unique(arr)).toEqual(['a', 'b', 'c']);
  });

  it('should work with objects using key', () => {
    const arr = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 1, name: 'c' },
    ];
    const result = unique(arr, 'id');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  it('should handle empty array', () => {
    expect(unique([])).toEqual([]);
  });

  it('should handle array with no duplicates', () => {
    const arr = [1, 2, 3, 4];
    expect(unique(arr)).toEqual([1, 2, 3, 4]);
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
    const items = [{ value: 1 }, { value: 3 }, { value: 2 }];
    const sorted = sortBy(items, 'value', 'desc');
    expect(sorted[0].value).toBe(3);
    expect(sorted[1].value).toBe(2);
    expect(sorted[2].value).toBe(1);
  });

  it('should default to ascending order', () => {
    const items = [{ value: 3 }, { value: 1 }];
    const sorted = sortBy(items, 'value');
    expect(sorted[0].value).toBe(1);
    expect(sorted[1].value).toBe(3);
  });

  it('should work with string values', () => {
    const items = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
    const sorted = sortBy(items, 'name', 'asc');
    expect(sorted[0].name).toBe('Alice');
    expect(sorted[2].name).toBe('Charlie');
  });

  it('should not mutate original array', () => {
    const items = [{ value: 3 }, { value: 1 }];
    const original = [...items];
    sortBy(items, 'value');
    expect(items).toEqual(original);
  });
});

describe('randomId', () => {
  it('should generate id of specified length', () => {
    const id = randomId(10);
    expect(id).toHaveLength(10);
  });

  it('should generate id of default length 8', () => {
    const id = randomId();
    expect(id).toHaveLength(8);
  });

  it('should generate different ids', () => {
    const id1 = randomId();
    const id2 = randomId();
    expect(id1).not.toBe(id2);
  });

  it('should only contain alphanumeric characters', () => {
    const id = randomId(100);
    expect(/^[A-Za-z0-9]+$/.test(id)).toBe(true);
  });

  it('should handle length of 1', () => {
    const id = randomId(1);
    expect(id).toHaveLength(1);
  });
});

describe('sleep', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useFakeTimers();
  });

  it('should return a promise', () => {
    const result = sleep(100);
    expect(result).toBeInstanceOf(Promise);
    return result;
  });

  it('should resolve after specified time', async () => {
    const start = Date.now();
    await sleep(50);
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(40);
  });
});

describe('retry', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useFakeTimers();
  });

  it('should succeed on first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await retry(mockFn, 3, 100);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('success');
    
    const result = await retry(mockFn, 3, 10);
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('always fail'));
    
    await expect(retry(mockFn, 3, 10)).rejects.toThrow('always fail');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should use default max attempts', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('fail'));
    
    await expect(retry(mockFn)).rejects.toThrow('fail');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
})
