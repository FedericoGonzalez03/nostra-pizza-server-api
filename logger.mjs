import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';
import moment from 'moment-timezone';

const { combine, printf } = format;

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const createCustomLogger = (logFileName) => {
    return createLogger({
        format: combine(
            format.timestamp({
                format: () => moment().tz('America/Montevideo').format('YYYY-MM-DD HH:mm:ss')
            }),
            logFormat
        ),
        transports: [
            new transports.Console(),
            new transports.DailyRotateFile({
                filename: `logs/${logFileName}-%DATE%.log`,
                datePattern: 'YYYY-MM-DD',
                maxFiles: '14d'
            })
        ]
    });
};

export default createCustomLogger;