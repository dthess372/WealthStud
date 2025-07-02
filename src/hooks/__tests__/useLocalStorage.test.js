import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  test('should return initial value when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => 
      useLocalStorage('test-key', { initial: 'value' })
    );

    expect(result.current[0]).toEqual({ initial: 'value' });
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  test('should return stored value from localStorage', () => {
    const storedValue = { name: 'John', age: 30 };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedValue));
    
    const { result } = renderHook(() => 
      useLocalStorage('user-data', {})
    );

    expect(result.current[0]).toEqual(storedValue);
  });

  test('should update localStorage when value changes', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => 
      useLocalStorage('counter', 0)
    );

    act(() => {
      result.current[1](5);
    });

    expect(result.current[0]).toBe(5);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('counter', '5');
  });

  test('should handle function updates', () => {
    localStorageMock.getItem.mockReturnValue('10');
    
    const { result } = renderHook(() => 
      useLocalStorage('number', 0)
    );

    act(() => {
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(11);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('number', '11');
  });

  test('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage not available');
    });
    
    const { result } = renderHook(() => 
      useLocalStorage('error-key', 'default')
    );

    expect(result.current[0]).toBe('default');
  });

  test('should handle JSON parse errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json{');
    
    const { result } = renderHook(() => 
      useLocalStorage('invalid-json', { default: true })
    );

    expect(result.current[0]).toEqual({ default: true });
  });

  test('should handle setItem errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });
    
    const { result } = renderHook(() => 
      useLocalStorage('quota-test', 0)
    );

    act(() => {
      result.current[1](100);
    });

    // Should still update the state even if localStorage fails
    expect(result.current[0]).toBe(100);
  });

  test('should work with complex objects', () => {
    const complexObject = {
      user: { name: 'Alice', preferences: { theme: 'dark' } },
      settings: [1, 2, 3],
      metadata: { timestamp: Date.now() }
    };
    
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => 
      useLocalStorage('complex', {})
    );

    act(() => {
      result.current[1](complexObject);
    });

    expect(result.current[0]).toEqual(complexObject);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'complex', 
      JSON.stringify(complexObject)
    );
  });
});