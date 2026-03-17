const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args) => isDev && console.log(...args),
  group: (...args) => isDev && console.group(...args),
  groupEnd: () => isDev && console.groupEnd(),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};
