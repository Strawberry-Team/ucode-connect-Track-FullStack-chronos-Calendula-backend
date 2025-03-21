import mysql from 'mysql2/promise';

const padZero = num => num.toString().padStart(2, '0');

const connection = mysql.createPool({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    typeCast: function (field, next) {
        if (field.type === 'DATE') {
            const val = field.string();

            if (val === null) return null;

            const d = new Date(val);

            return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
        }

        if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
            const val = field.string();

            if (val === null) return null;

            const d = new Date(val);

            return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())} ${padZero(d.getHours())}:${padZero(d.getMinutes())}:${padZero(d.getSeconds())}`;
        }

        if (field.type === 'TINY' && field.length === 1) {
            const val = field.string();

            return val === null ? null : val === '1';
        }

        return next();
    }
});

const originalQuery = connection.query;

connection.query = async function (...args) {
    if (process.env.DATABASE_LOGS === 'true') {
        const formattedQuery = args[0]
            .replace(/\s+/g, ' ')
            .trim();
        console.log('Executing SQL:', formattedQuery, args[1] ? '' : '\n');

        if (args[1]) {
            console.log('With values:', args[1], '\n');
        }
    }

    return originalQuery.apply(this, args);
};

export default connection;