import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:         parseInt(process.env.DB_PORT  || '3306'),
  database:           process.env.DB_NAME     || 'cipher_login',
  user:               process.env.DB_USER,
  password:           process.env.DB_PASS,
  charset:            'utf8mb4',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

pool.getConnection()
  .then(conn => {
    console.log('✓ MySQL connected');
    conn.release();
  })
  .catch(err => {
    console.error('✗ MySQL connection failed:', err.message);
    process.exit(1);
  });

export default pool;