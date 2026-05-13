const winston = require("winston");
const path = require("path");
const fs = require("fs");

const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const isProduction = process.env.NODE_ENV === "production";

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extras = Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
    return `${timestamp} [${level}] ${message}${extras}`;
  }),
);

const transports = [
  new winston.transports.File({
    filename: path.join(logsDir, "app.log"),
    format: fileFormat,
    maxsize: 10 * 1024 * 1024,
    maxFiles: 7,
    tailable: true,
  }),
  new winston.transports.File({
    filename: path.join(logsDir, "error.log"),
    level: "error",
    format: fileFormat,
    maxsize: 10 * 1024 * 1024,
    maxFiles: 7,
    tailable: true,
  }),
];

transports.push(
  new winston.transports.Console({
    level: isProduction ? "warn" : "debug",
    format: consoleFormat,
  }),
);

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "exceptions.log"),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, "rejections.log"),
    }),
  ],
  exitOnError: false,
});

module.exports = logger;
