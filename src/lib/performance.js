// Performance monitoring utilities for WealthStud

/**
 * Simple performance timer for measuring operation duration
 */
export class PerformanceTimer {
  constructor(label) {
    this.label = label;
    this.startTime = performance.now();
  }

  end() {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    console.log(`⚡ ${this.label}: ${duration.toFixed(2)}ms`);
    return duration;
  }
}

/**
 * Wrapper for timing React component renders
 */
export function withPerformanceTracking(Component, componentName) {
  return function PerformanceTrackedComponent(props) {
    const timer = new PerformanceTimer(`${componentName} render`);
    
    React.useEffect(() => {
      timer.end();
    });

    return React.createElement(Component, props);
  };
}

/**
 * Hook for measuring expensive calculations
 */
export function usePerformanceTimer(label) {
  return {
    start: () => new PerformanceTimer(label),
    measure: (fn, measureLabel = label) => {
      const timer = new PerformanceTimer(measureLabel);
      const result = fn();
      timer.end();
      return result;
    }
  };
}

/**
 * Debounce function for performance optimization
 */
export function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Lazy loading utility for large datasets
 */
export function createVirtualizedData(data, itemsPerPage = 50) {
  return {
    totalItems: data.length,
    getPage: (pageNumber) => {
      const start = pageNumber * itemsPerPage;
      const end = start + itemsPerPage;
      return data.slice(start, end);
    },
    getTotalPages: () => Math.ceil(data.length / itemsPerPage)
  };
}

/**
 * Memory usage monitoring
 */
export function logMemoryUsage(label = 'Memory usage') {
  if (performance.memory) {
    const memory = performance.memory;
    console.log(`🧠 ${label}:`, {
      used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
    });
  }
}

/**
 * Batch update utility to reduce re-renders
 */
export function createBatchUpdater(setState, batchDelay = 100) {
  let pendingUpdates = [];
  let timeoutId = null;

  return function batchUpdate(updateFn) {
    pendingUpdates.push(updateFn);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      const finalUpdate = pendingUpdates.reduce((acc, updateFn) => {
        return updateFn(acc);
      }, {});
      
      setState(prevState => ({ ...prevState, ...finalUpdate }));
      pendingUpdates = [];
      timeoutId = null;
    }, batchDelay);
  };
}

/**
 * Optimize large array operations
 */
export const ArrayOptimizations = {
  // Efficient array chunking for processing large datasets
  chunk: (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Process array in batches to avoid blocking UI
  processInBatches: async (array, processor, batchSize = 1000) => {
    const chunks = ArrayOptimizations.chunk(array, batchSize);
    const results = [];
    
    for (const chunk of chunks) {
      const chunkResults = chunk.map(processor);
      results.push(...chunkResults);
      
      // Yield control back to browser
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  },

  // Efficient filtering for large datasets
  parallelFilter: (array, predicate, chunkSize = 1000) => {
    const chunks = ArrayOptimizations.chunk(array, chunkSize);
    return Promise.all(
      chunks.map(chunk => 
        new Promise(resolve => {
          setTimeout(() => resolve(chunk.filter(predicate)), 0);
        })
      )
    ).then(results => results.flat());
  }
};

/**
 * Component optimization utilities
 */
export const ComponentOptimizations = {
  // Shallow comparison for React.memo
  shallowEqual: (prevProps, nextProps) => {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) {
      return false;
    }
    
    for (let key of prevKeys) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }
    
    return true;
  },

  // Deep comparison for complex objects
  deepEqual: (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (let key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!ComponentOptimizations.deepEqual(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    return a === b;
  }
};

/**
 * Performance benchmark utility
 */
export function createBenchmark(name) {
  const marks = [];
  
  return {
    mark: (label) => {
      marks.push({
        label,
        timestamp: performance.now()
      });
    },
    
    report: () => {
      console.group(`📊 Performance Benchmark: ${name}`);
      
      for (let i = 1; i < marks.length; i++) {
        const duration = marks[i].timestamp - marks[i - 1].timestamp;
        console.log(`${marks[i - 1].label} → ${marks[i].label}: ${duration.toFixed(2)}ms`);
      }
      
      if (marks.length >= 2) {
        const totalTime = marks[marks.length - 1].timestamp - marks[0].timestamp;
        console.log(`Total time: ${totalTime.toFixed(2)}ms`);
      }
      
      console.groupEnd();
    }
  };
}