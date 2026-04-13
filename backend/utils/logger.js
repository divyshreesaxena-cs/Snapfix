const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const serializeError = (error) => {
  if (!error) return undefined;
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
  };
};

const writeToFile = (filename, entry) => {
  try {
    fs.appendFileSync(path.join(logsDir, filename), `${JSON.stringify(entry)}\n`);
  } catch (error) {
    console.error('Failed to write log file', error);
  }
};

const buildEntry = (level, message, meta = {}) => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  ...meta,
  error: serializeError(meta.error),
});

const log = (level, message, meta = {}) => {
  const entry = buildEntry(level, message, meta);
  const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  consoleMethod(JSON.stringify(entry));
  writeToFile('app.log', entry);
  if (level === 'error') writeToFile('error.log', entry);
};

const child = (baseMeta = {}) => ({
  info: (message, meta = {}) => log('info', message, { ...baseMeta, ...meta }),
  warn: (message, meta = {}) => log('warn', message, { ...baseMeta, ...meta }),
  error: (message, meta = {}) => log('error', message, { ...baseMeta, ...meta }),
});

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
  child,
};
