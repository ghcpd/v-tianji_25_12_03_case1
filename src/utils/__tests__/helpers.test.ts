import * as Helpers from '../helpers';
import { deepClone, groupBy, chunk, unique, sortBy, randomId, debounce, throttle, sleep, retry } from '../helpers';

describe('deepClone', () => {
  it('should clone primitive values', () => {
    expect(deepClone(5)).toBe(5);
    expect(deepClone('test')).toBe('test');
    expect(deepClone(true)).toBe(true);
  });

  it('should clone arrays', () => {
    const arr = [1, 2, 3];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
  });

  it('should clone objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });

  it('should clone Date objects', () => {
    const date = new Date('2020-01-01T00:00:00Z');
    const cloned = deepClone(date);
    expect(cloned).toEqual(date);
    expect(cloned).not.toBe(date);
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
});

describe('chunk', () => {
  it('should split array into chunks', () => {
    const arr = [1, 2, 3, 4, 5];
    const chunks = chunk(arr, 2);
    expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should handle size larger than array', () => {
    const arr = [1, 2, 3];
    expect(chunk(arr, 10)).toEqual([[1, 2, 3]]);
  });
});

describe('unique', () => {
  it('should remove duplicates from array', () => {
    const arr = [1, 2, 2, 3, 3, 3];
    expect(unique(arr)).toEqual([1, 2, 3]);
  });

  it('should remove duplicates by key for objects', () => {
    const arr = [{ id: 1 }, { id: 2 }, { id: 1 }];
    expect(unique(arr, 'id')).toEqual([{ id: 1 }, { id: 2 }]);
  });
});

describe('sortBy', () => {
  it('should sort array by key in ascending order', () => {
    const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
    const sorted = sortBy(items, 'value', 'asc');
    expect(sorted[0].value).toBe(1);
    expect(sorted[2].value).toBe(3);
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
});

describe('timing helpers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('debounce should delay function calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 1000);

    debounced('a');
    debounced('b');

    expect(fn).not.toBeCalled();

    jest.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('throttle should limit function calls', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 1000);

    throttled(1);
    throttled(2);
    throttled(3);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);

    jest.advanceTimersByTime(1000);
    throttled(4);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('sleep should resolve after given ms', async () => {
    const p = sleep(500);
    jest.advanceTimersByTime(500);
    await expect(p).resolves.toBeUndefined();
  });

  it('retry should retry on failures and eventually resolve', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('ok');

    // stub sleep to avoid waiting
    jest.spyOn(Helpers, 'sleep').mockImplementation(() => Promise.resolve());

    const result = await retry(fn, 3, 10);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('retry should throw after max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fail'));
    jest.spyOn(Helpers, 'sleep').mockImplementation(() => Promise.resolve());

    await expect(retry(fn, 2, 10)).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
