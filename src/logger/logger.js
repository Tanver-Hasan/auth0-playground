const { createLogger, format, transports } = require('winston');

const isProduction = process.env.NODE_ENV === 'production';

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        new transports.Console({
            format: isProduction
                ? format.combine(
                      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                      format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}]: ${message}`)
                  )
                : format.combine(
                      format.colorize(),
                      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                      format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}]: ${message}`)
                  )
        })
    ]
});

module.exports = logger;
