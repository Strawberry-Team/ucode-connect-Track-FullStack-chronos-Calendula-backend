import mysql from 'mysql2/promise';
const connection = mysql.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 3306,
    database: process.env.DATABASE_NAME || 'Calendula',
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
});

const originalQuery = connection.query;
connection.query = async function (...args) {
    const formattedQuery = args[0]
        .replace(/\s+/g, ' ')
        .trim();
    console.log('Executing SQL:', formattedQuery, args[1] ? '' : '\n');
    if (args[1]) {
        console.log('With values:', args[1], '\n');
    }
    return originalQuery.apply(this, args);
};
export default connection;