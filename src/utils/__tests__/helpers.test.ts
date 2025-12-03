import { debounce, throttle, deepClone, groupBy, chunk, unique, sortBy, randomId, sleep, retry } from '../helpers';

jest.useFakeTimers();

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
    const date = new Date();
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
});

describe('unique', () => {
  it('should remove duplicates from array', () => {
    const arr = [1, 2, 2, 3, 3, 3];
    expect(unique(arr)).toEqual([1, 2, 3]);
  });

  it('should remove duplicates by key', () => {
    const arr = [
      { id: 1, name: 'a' },
      { id: 1, name: 'b' },
      { id: 2, name: 'c' },
    ];
    expect(unique(arr, 'id')).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'c' },
    ]);
  });
});

describe('sortBy', () => {
  it('should sort array by key in ascending order', () => {
    const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
    const sorted = sortBy(items, 'value', 'asc');
    expect(sorted[0].value).toBe(1);
    expect(sorted[2].value).toBe(3);
  });

  it('should sort array by key in descending order', () => {
    const items = [{ value: 1 }, { value: 3 }, { value: 2 }];
    const sorted = sortBy(items, 'value', 'desc');
    expect(sorted[0].value).toBe(3);
    expect(sorted[2].value).toBe(1);
  });
});

describe('randomId', () => {
  it('should generate id of specified length', () => {
    const id = randomId(10);
    expect(id).toHaveLength(10);
  });

  it('should generate id with default length and valid chars', () => {
    const id = randomId();
    expect(id).toHaveLength(8);
    expect(/^[A-Za-z0-9]+$/.test(id)).toBe(true);
  });
});

describe('debounce', () => {
  it('should debounce calls and use last arguments', () => {
    const func = jest.fn();
    const debounced = debounce(func, 500);

    debounced('a');
    debounced('b');
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(499);
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('b');
  });
});

describe('throttle', () => {
  it('should throttle calls within limit', () => {
    const func = jest.fn();
    const throttled = throttle(func, 500);

    throttled();
    throttled();
    throttled();
    expect(func).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    throttled();
    expect(func).toHaveBeenCalledTimes(2);
  });
});

describe('sleep', () => {
  it('resolves after given ms', async () => {
    const promise = sleep(1000);
    jest.advanceTimersByTime(999);
    let resolved = false;
    promise.then(() => { resolved = true; });
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(resolved).toBe(true);
  });
});

describe('retry', () => {
  beforeAll(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.useFakeTimers();
  });
  it('resolves on first try', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    await expect(retry(fn, 3, 1000)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockResolvedValueOnce('ok');

    await expect(retry(fn, 3, 10)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(retry(fn, 2, 10)).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
