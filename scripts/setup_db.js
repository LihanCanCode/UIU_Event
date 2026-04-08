const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setup() {
    const config = {
        host: 'localhost',
        user: 'root',
        password: '123456',
        multipleStatements: true
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected to MySQL server.');

        // 1. Create database
        await connection.query('CREATE DATABASE IF NOT EXISTS event_koi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
        console.log('Database "event_koi" created or already exists.');
        await connection.query('USE event_koi;');

        // 2. Run SQL files in order
        const sqlFiles = [
            '01_schema.sql',
            '02_procedures_triggers.sql',
            '03_views_indexes.sql',
            '04_seed.sql',
            '14_custom_seed_2026.sql',
            '15_cleanup.sql'
        ];

        for (const fileName of sqlFiles) {
            const filePath = path.join(__dirname, '..', 'database', fileName);
            console.log(`Executing ${fileName}...`);
            let sql = fs.readFileSync(filePath, 'utf8');

            // Remove DELIMITER commands
            sql = sql.replace(/DELIMITER\s+\S+/gi, '');
            sql = sql.replace(/DELIMITER\s+;/gi, '');

            // Determine delimiter
            const delimiter = fileName.includes('procedures_triggers') ? '$$' : ';';

            // Split by delimiter, taking care not to split inside strings or comments (simplified)
            // For complex cases, we'll just try to split by the delimiter at the end of lines
            const statements = sql.split(delimiter).map(s => s.trim()).filter(s => s.length > 0);

            for (let statement of statements) {
                try {
                    await connection.query(statement);
                } catch (err) {
                    console.error(`Error in ${fileName} at statement:`, statement.substring(0, 100) + '...');
                    throw err;
                }
            }
            console.log(`Finished ${fileName}.`);
        }

        console.log('Database setup complete!');
        await connection.end();
    } catch (err) {
        console.error('Error during database setup:', err);
        process.exit(1);
    }
}

setup();
