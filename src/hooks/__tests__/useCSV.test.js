/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useCSV } from '../useCSV';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement and click
const mockLink = {
  href: '',
  download: '',
  click: jest.fn(),
  style: { display: '' }
};

document.createElement = jest.fn(() => mockLink);
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();

describe('useCSV', () => {
  let container;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a container for the test
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (container) {
      document.body.removeChild(container);
    }
  });

  test('should initialize with prefix', () => {
    const { result } = renderHook(() => useCSV('budget'), { container });
    
    expect(typeof result.current.exportCSV).toBe('function');
    expect(typeof result.current.createFileInputHandler).toBe('function');
  });

  test('should export CSV with default filename', () => {
    const { result } = renderHook(() => useCSV('budget'));
    
    const testData = [
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'San Francisco' }
    ];

    act(() => {
      result.current.exportCSV(testData);
    });

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.download).toMatch(/budget_.*\.csv/);
    expect(mockLink.click).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  test('should export CSV with custom filename', () => {
    const { result } = renderHook(() => useCSV('test'));
    
    const testData = [{ item: 'test' }];

    act(() => {
      result.current.exportCSV(testData, 'custom-export.csv');
    });

    expect(mockLink.download).toBe('custom-export.csv');
  });

  test('should handle empty data array', () => {
    const { result } = renderHook(() => useCSV('empty'));
    
    act(() => {
      result.current.exportCSV([]);
    });

    expect(mockLink.click).toHaveBeenCalled();
    expect(mockLink.download).toMatch(/empty_.*\.csv/);
  });

  test('should generate timestamp in filename', () => {
    const { result } = renderHook(() => useCSV('timestamp'));
    
    const beforeTime = Date.now();
    
    act(() => {
      result.current.exportCSV([{ test: 'data' }]);
    });

    const afterTime = Date.now();
    
    // Extract timestamp from filename
    const filename = mockLink.download;
    const match = filename.match(/timestamp_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})\.csv/);
    expect(match).toBeTruthy();
  });

  test('should create file input handler with validation', () => {
    const mockCallback = jest.fn();
    const mockErrorCallback = jest.fn();
    const { result } = renderHook(() => useCSV('test'));
    
    const handler = result.current.createFileInputHandler(
      mockCallback,
      mockErrorCallback,
      ['name', 'age']
    );

    expect(typeof handler).toBe('function');
  });

  test('should validate CSV headers when provided', () => {
    const mockCallback = jest.fn();
    const mockErrorCallback = jest.fn();
    const { result } = renderHook(() => useCSV('test'));
    
    // Create a mock file with CSV content
    const csvContent = 'name,age,city\nJohn,30,NYC\nJane,25,SF';
    const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
    
    const mockEvent = {
      target: {
        files: [mockFile]
      }
    };

    const handler = result.current.createFileInputHandler(
      mockCallback,
      mockErrorCallback,
      ['name', 'age', 'city']
    );

    // Mock FileReader
    const mockFileReader = {
      readAsText: jest.fn(),
      onload: null,
      onerror: null,
      result: csvContent
    };

    global.FileReader = jest.fn(() => mockFileReader);

    act(() => {
      handler(mockEvent);
      // Simulate FileReader onload
      mockFileReader.onload();
    });

    expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);
  });

  test('should handle file reading errors', () => {
    const mockCallback = jest.fn();
    const mockErrorCallback = jest.fn();
    const { result } = renderHook(() => useCSV('test'));
    
    const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    const mockEvent = {
      target: { files: [mockFile] }
    };

    const handler = result.current.createFileInputHandler(
      mockCallback,
      mockErrorCallback
    );

    const mockFileReader = {
      readAsText: jest.fn(),
      onload: null,
      onerror: null
    };

    global.FileReader = jest.fn(() => mockFileReader);

    act(() => {
      handler(mockEvent);
      // Simulate FileReader error
      mockFileReader.onerror();
    });

    expect(mockErrorCallback).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('file') })
    );
  });

  test('should handle invalid CSV format', () => {
    const mockCallback = jest.fn();
    const mockErrorCallback = jest.fn();
    const { result } = renderHook(() => useCSV('test'));
    
    const invalidCsv = 'invalid,csv,format\n"unclosed quote,data';
    const mockFile = new File([invalidCsv], 'test.csv', { type: 'text/csv' });
    const mockEvent = {
      target: { files: [mockFile] }
    };

    const handler = result.current.createFileInputHandler(
      mockCallback,
      mockErrorCallback
    );

    const mockFileReader = {
      readAsText: jest.fn(),
      onload: null,
      onerror: null,
      result: invalidCsv
    };

    global.FileReader = jest.fn(() => mockFileReader);

    act(() => {
      handler(mockEvent);
      mockFileReader.onload();
    });

    expect(mockErrorCallback).toHaveBeenCalled();
  });

  test('should handle no file selected', () => {
    const mockCallback = jest.fn();
    const mockErrorCallback = jest.fn();
    const { result } = renderHook(() => useCSV('test'));
    
    const mockEvent = {
      target: { files: [] }
    };

    const handler = result.current.createFileInputHandler(
      mockCallback,
      mockErrorCallback
    );

    act(() => {
      handler(mockEvent);
    });

    expect(mockCallback).not.toHaveBeenCalled();
    expect(mockErrorCallback).not.toHaveBeenCalled();
  });
});