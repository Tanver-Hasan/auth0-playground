const { createLogger, format, transports } = require('winston');

const logger = createLogger({
    level: "info", // Log only info and above
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        new transports.File({ filename: "logs/app.log" }) // File log (correct format)
    ]
});

// Separate console logging with colors
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(), // Colors for better readability
            format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}]: ${message}`)
        )
    }));
}

module.exports = logger;
