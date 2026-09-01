require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false });
(async () => { try { await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')); console.log('Souqna schema applied.'); } finally { await pool.end(); } })().catch(error => { console.error(error); process.exit(1); });
