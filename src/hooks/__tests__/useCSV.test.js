/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useCSV } from '../useCSV';

global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('useCSV', () => {
  let createdLinks = [];

  beforeEach(() => {
    jest.clearAllMocks();
    createdLinks = [];

    // Track anchor elements created without breaking renderHook's container creation
    const realCreate = HTMLDocument.prototype.createElement.bind(document);
    jest.spyOn(HTMLDocument.prototype, 'createElement').mockImplementation(function(tag, ...args) {
      const el = realCreate(tag, ...args);
      if (tag === 'a') {
        createdLinks.push(el);
        jest.spyOn(el, 'click');
      }
      return el;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should initialize with prefix', () => {
    const { result } = renderHook(() => useCSV('budget'));

    expect(typeof result.current.exportCSV).toBe('function');
    expect(typeof result.current.createFileInputHandler).toBe('function');
    expect(typeof result.current.importCSV).toBe('function');
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

    expect(createdLinks).toHaveLength(1);
    expect(createdLinks[0].download).toMatch(/budget.*\.csv/);
    expect(createdLinks[0].click).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  test('should export CSV with custom filename', () => {
    const { result } = renderHook(() => useCSV('test'));

    act(() => {
      result.current.exportCSV([{ item: 'test' }], 'custom-export.csv');
    });

    expect(createdLinks[0].download).toBe('custom-export.csv');
  });

  test('should handle empty data array gracefully', () => {
    const { result } = renderHook(() => useCSV('empty'));

    let exportResult;
    act(() => {
      exportResult = result.current.exportCSV([]);
    });

    expect(exportResult.success).toBe(false);
    expect(createdLinks).toHaveLength(0);
  });

  test('should generate timestamp in filename', () => {
    const { result } = renderHook(() => useCSV('timestamp'));

    act(() => {
      result.current.exportCSV([{ test: 'data' }]);
    });

    expect(createdLinks[0].download).toMatch(/timestamp.*\.csv/);
  });

  test('should create file input handler', () => {
    const { result } = renderHook(() => useCSV('test'));

    const handler = result.current.createFileInputHandler(jest.fn(), jest.fn(), ['name', 'age']);

    expect(typeof handler).toBe('function');
  });

  test('should validate CSV headers when provided', async () => {
    const mockCallback = jest.fn();
    const mockErrorCallback = jest.fn();
    const { result } = renderHook(() => useCSV('test'));

    const csvContent = 'name,age,city\nJohn,30,NYC\nJane,25,SF';
    const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const mockEvent = { target: { files: [mockFile], value: '' } };

    const handler = result.current.createFileInputHandler(
      mockCallback,
      mockErrorCallback,
      ['name', 'age', 'city']
    );

    const mockFileReader = { readAsText: jest.fn(), onload: null, onerror: null };
    global.FileReader = jest.fn(() => mockFileReader);

    await act(async () => {
      handler(mockEvent);
      mockFileReader.onload({ target: { result: csvContent } });
    });

    expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);
    expect(mockCallback).toHaveBeenCalled();
  });

  test('should handle file reading errors', async () => {
    const mockCallback = jest.fn();
    const mockErrorCallback = jest.fn();
    const { result } = renderHook(() => useCSV('test'));

    const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    const mockEvent = { target: { files: [mockFile], value: '' } };

    const handler = result.current.createFileInputHandler(mockCallback, mockErrorCallback);

    const mockFileReader = { readAsText: jest.fn(), onload: null, onerror: null };
    global.FileReader = jest.fn(() => mockFileReader);

    await act(async () => {
      handler(mockEvent);
      mockFileReader.onerror();
    });

    expect(mockErrorCallback).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('file') })
    );
  });

  test('should handle CSV parsing', async () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => useCSV('test'));

    const csvContent = 'col1,col2\nval1,val2';
    const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const mockEvent = { target: { files: [mockFile], value: '' } };

    const handler = result.current.createFileInputHandler(mockCallback, jest.fn());

    const mockFileReader = { readAsText: jest.fn(), onload: null, onerror: null };
    global.FileReader = jest.fn(() => mockFileReader);

    await act(async () => {
      handler(mockEvent);
      mockFileReader.onload({ target: { result: csvContent } });
    });

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.any(Array) })
    );
  });

  test('should handle no file selected', () => {
    const mockCallback = jest.fn();
    const mockErrorCallback = jest.fn();
    const { result } = renderHook(() => useCSV('test'));

    const mockEvent = { target: { files: [] } };
    const handler = result.current.createFileInputHandler(mockCallback, mockErrorCallback);

    act(() => { handler(mockEvent); });

    expect(mockCallback).not.toHaveBeenCalled();
    expect(mockErrorCallback).not.toHaveBeenCalled();
  });
});
