const mysql = require('mysql2/promise');

async function test() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '123456'
        });
        console.log('Successfully connected to MySQL');
        await connection.end();
    } catch (err) {
        console.error('Error connecting to MySQL:', err.message);
        process.exit(1);
    }
}

test();
