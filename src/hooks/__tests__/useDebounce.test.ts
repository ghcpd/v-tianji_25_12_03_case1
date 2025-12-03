import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Basic Functionality', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));
      expect(result.current).toBe('initial');
    });

    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      expect(result.current).toBe('initial');

      rerender({ value: 'updated', delay: 500 });
      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });

    it('should update after delay expires', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'first', delay: 300 } }
      );

      rerender({ value: 'second', delay: 300 });

      act(() => {
        jest.advanceTimersByTime(299);
      });
      expect(result.current).toBe('first');

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current).toBe('second');
    });
  });

  describe('Multiple Updates', () => {
    it('should cancel previous timeout when value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'first', delay: 500 } }
      );

      rerender({ value: 'second', delay: 500 });
      
      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(result.current).toBe('first');

      rerender({ value: 'third', delay: 500 });
      
      act(() => {
        jest.advanceTimersByTime(400);
      });
      expect(result.current).toBe('first');

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe('third');
    });

    it('should handle rapid successive updates', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'v1', delay: 300 } }
      );

      rerender({ value: 'v2', delay: 300 });
      rerender({ value: 'v3', delay: 300 });
      rerender({ value: 'v4', delay: 300 });
      rerender({ value: 'v5', delay: 300 });

      expect(result.current).toBe('v1');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('v5');
    });
  });

  describe('Different Data Types', () => {
    it('should work with strings', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'hello', delay: 200 } }
      );

      rerender({ value: 'world', delay: 200 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe('world');
    });

    it('should work with numbers', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 10, delay: 200 } }
      );

      rerender({ value: 20, delay: 200 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe(20);
    });

    it('should work with booleans', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: true, delay: 200 } }
      );

      rerender({ value: false, delay: 200 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe(false);
    });

    it('should work with objects', () => {
      const obj1 = { name: 'John', age: 30 };
      const obj2 = { name: 'Jane', age: 25 };

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: obj1, delay: 200 } }
      );

      rerender({ value: obj2, delay: 200 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe(obj2);
    });

    it('should work with arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [4, 5, 6];

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: arr1, delay: 200 } }
      );

      rerender({ value: arr2, delay: 200 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe(arr2);
    });

    it('should work with null', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'something', delay: 200 } }
      );

      rerender({ value: null, delay: 200 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe(null);
    });

    it('should work with undefined', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'something', delay: 200 } }
      );

      rerender({ value: undefined, delay: 200 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe(undefined);
    });
  });

  describe('Different Delays', () => {
    it('should work with zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'first', delay: 0 } }
      );

      rerender({ value: 'second', delay: 0 });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current).toBe('second');
    });

    it('should work with short delay (100ms)', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'first', delay: 100 } }
      );

      rerender({ value: 'second', delay: 100 });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe('second');
    });

    it('should work with long delay (5000ms)', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'first', delay: 5000 } }
      );

      rerender({ value: 'second', delay: 5000 });

      act(() => {
        jest.advanceTimersByTime(4999);
      });
      expect(result.current).toBe('first');

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current).toBe('second');
    });

    it('should handle changing delay value', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'first', delay: 500 } }
      );

      rerender({ value: 'second', delay: 200 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe('second');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timeout on unmount', () => {
      const { result, rerender, unmount } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      rerender({ value: 'updated', delay: 500 });
      
      unmount();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should not throw error
      expect(result.current).toBe('initial');
    });

    it('should cleanup previous timeout when value changes before delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'v1', delay: 500 } }
      );

      rerender({ value: 'v2', delay: 500 });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });

      rerender({ value: 'v3', delay: 500 });

      act(() => {
        jest.advanceTimersByTime(200);
      });
      
      // First timeout should be cancelled, v2 should not appear
      expect(result.current).toBe('v1');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('v3');
    });
  });

  describe('Edge Cases', () => {
    it('should handle same value updates', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'same', delay: 200 } }
      );

      rerender({ value: 'same', delay: 200 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe('same');
    });

    it('should handle empty string', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'text', delay: 200 } }
      );

      rerender({ value: '', delay: 200 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe('');
    });

    it('should not update if time has not elapsed', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'first', delay: 1000 } }
      );

      rerender({ value: 'second', delay: 1000 });

      act(() => {
        jest.advanceTimersByTime(999);
      });

      expect(result.current).toBe('first');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should simulate search input debouncing', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: '', delay: 300 } }
      );

      // User types 'r'
      rerender({ value: 'r', delay: 300 });
      act(() => jest.advanceTimersByTime(50));
      
      // User types 'e'
      rerender({ value: 're', delay: 300 });
      act(() => jest.advanceTimersByTime(50));
      
      // User types 'a'
      rerender({ value: 'rea', delay: 300 });
      act(() => jest.advanceTimersByTime(50));
      
      // User types 'c'
      rerender({ value: 'reac', delay: 300 });
      act(() => jest.advanceTimersByTime(50));
      
      // User types 't'
      rerender({ value: 'react', delay: 300 });
      
      // Still showing initial value
      expect(result.current).toBe('');

      // After 300ms of no typing, value updates
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('react');
    });

    it('should simulate form validation debouncing', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: '', delay: 500 } }
      );

      rerender({ value: 'test@', delay: 500 });
      act(() => jest.advanceTimersByTime(100));
      
      rerender({ value: 'test@example', delay: 500 });
      act(() => jest.advanceTimersByTime(100));
      
      rerender({ value: 'test@example.com', delay: 500 });
      
      expect(result.current).toBe('');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('test@example.com');
    });
  });
});
