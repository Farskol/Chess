const winston = require('winston');
const {format} = require("winston");

const myFormat = winston.format.printf(({ level, message, label, timestamp }) => {
    let string = '_'.padEnd(115,'_') + '\n';
    string += `${timestamp}\n\n[${level.toUpperCase()}]:\n${message}`;
    return string;
});

const logger = winston.createLogger({
    level: 'info',
    levels: winston.config.npm.levels,
    format:  winston.format.combine(
        //  winston.format.label({ label: 'right meow!' }),
        winston.format.timestamp({format:'YYYY-MM-DDTHH:mm:ss.sssZ'}),
        myFormat
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.Console,
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'info.log', level: 'info' }),
        new winston.transports.File({ filename: 'warn.log', level: 'warn' }),
    ]
})

module.exports.logger = logger;
