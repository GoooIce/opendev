const LOG_LEVELS = {
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
};

// Get log level from environment variable or default to 'info'
const configuredLevelName = (process.env.LOG_LEVEL || 'info').toLowerCase();
const configuredLevel = LOG_LEVELS[configuredLevelName] || LOG_LEVELS.info;

function log(level, ...args) {
    const messageLevel = LOG_LEVELS[level];
    if (messageLevel >= configuredLevel) {
        const timestamp = new Date().toISOString();
        const levelUpper = level.toUpperCase();
        console.log(`[${timestamp}] [${levelUpper}]`, ...args);
    }
}

const logger = {
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),
};

export default logger; 