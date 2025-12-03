import { debounce, throttle, deepClone, groupBy, chunk, unique, sortBy, randomId, sleep, retry } from '../helpers';

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
});

describe('debounce', () => {
  beforeEach(() => jest.useFakeTimers());

  it('should delay invoking the function until after the delay', () => {
    const fn = jest.fn();
    const d = debounce(fn, 1000);

    d();
    d();

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  beforeEach(() => jest.useFakeTimers());

  it('should only call the function at most once per limit', () => {
    const fn = jest.fn();
    const t = throttle(fn, 500);

    t();
    t();
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    t();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('deepClone edge-cases', () => {
  it('should clone Dates', () => {
    const d = new Date('2020-01-01T00:00:00Z');
    const cloned = deepClone(d);
    expect(cloned).toEqual(d);
    expect(cloned).not.toBe(d);
  });

  it('should handle null and primitives', () => {
    expect(deepClone(null)).toBeNull();
    expect(deepClone(undefined)).toBeUndefined();
  });
});

describe('unique with key', () => {
  it('should remove duplicate objects by key', () => {
    const arr = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 1, name: 'c' }];
    const uniqueItems = unique(arr, 'id');
    expect(uniqueItems).toHaveLength(2);
    expect(uniqueItems.map(i => i.id)).toEqual([1, 2]);
  });
});

describe('sortBy desc', () => {
  it('should sort in descending order', () => {
    const items = [{ value: 3 }, { value: 1 }, { value: 2 }];
    const sorted = sortBy(items, 'value', 'desc');
    expect(sorted[0].value).toBe(3);
    expect(sorted[2].value).toBe(1);
  });
});

describe('randomId determinism', () => {
  it('respects Math.random output for deterministic tests', () => {
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0);
    const id = randomId(5);
    expect(id).toBe('AAAAA');
    spy.mockRestore();
  });
});

describe('sleep and retry', () => {
  beforeEach(() => jest.useFakeTimers());

  it('sleep resolves after the timeout', async () => {
    const p = sleep(1000);
    jest.advanceTimersByTime(1000);
    await expect(p).resolves.toBeUndefined();
  });

  it('retry succeeds after transient failures', async () => {
    const calls: number[] = [];
    let tries = 0;

    const fn = jest.fn(async () => {
      tries++;
      calls.push(tries);
      if (tries < 3) {
        throw new Error('fail');
      }
      return 'ok';
    });

    const promise = retry(fn, 4, 10);

    // advance timers for retries: two delays expected (for attempts 1 & 2)
    jest.advanceTimersByTime(10); // after first failure
    // allow rejected promise chain microtasks
    await Promise.resolve();
    jest.advanceTimersByTime(20); // next sleep increased by attempt
    await Promise.resolve();

    await expect(promise).resolves.toBe('ok');
    expect(calls).toHaveLength(3);
  });

  it('retry throws when exhausted', async () => {
    const fn = jest.fn(async () => { throw new Error('bad'); });

    const p = retry(fn, 2, 10);
    jest.advanceTimersByTime(10);
    await Promise.resolve();

    await expect(p).rejects.toThrow('bad');
  });
});
