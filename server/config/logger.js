const winston = require('winston');
const path    = require('path');
const fs      = require('fs');

// Garante que a pasta de logs existe
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const isProduction = process.env.NODE_ENV === 'production';

// ── Formato para arquivo (JSON estruturado) ───────────────────────────────────
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// ── Formato para console (legível em dev) ────────────────────────────────────
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const extras = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
        return `${timestamp} [${level}] ${message}${extras}`;
    })
);

const transports = [
    // Todos os logs (info, warn, error)
    new winston.transports.File({
        filename: path.join(logsDir, 'app.log'),
        format:   fileFormat,
        maxsize:  10 * 1024 * 1024,   // 10MB por arquivo
        maxFiles: 7,                   // mantém 7 arquivos (rotação)
        tailable: true,
    }),
    // Só erros em arquivo separado (mais fácil de monitorar)
    new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level:    'error',
        format:   fileFormat,
        maxsize:  10 * 1024 * 1024,
        maxFiles: 7,
        tailable: true,
    }),
];

// Console: sempre em dev, só warnings+ em produção
transports.push(new winston.transports.Console({
    level:  isProduction ? 'warn' : 'debug',
    format: consoleFormat,
}));

const logger = winston.createLogger({
    level:       isProduction ? 'info' : 'debug',
    transports,
    // Captura exceções e rejeições não tratadas
    exceptionHandlers: [
        new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') }),
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') }),
    ],
    exitOnError: false,
});

module.exports = logger;