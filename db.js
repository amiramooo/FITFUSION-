const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fitfusion',
    password: '6300859771',
    port: 5432
});

module.exports = pool;

