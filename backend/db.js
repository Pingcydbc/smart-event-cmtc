import pg from 'pg';

const { Pool } = pg;

// กำหนดค่าการเชื่อมต่อแยกเป็นส่วนๆ เพื่อความแม่นยำสูงใน Docker Container
const pool = new Pool({
  user: 'myuser',
  host: 'postgres_db',       // ชื่อเซิร์ฟเวอร์อิงตามชื่อ container ใน docker-compose
  database: 'mydatabase',
  password: 'mypassword',
  port: 5432,               // พอร์ตภายในตู้ Docker (หลังบ้านคุยกันเองใช้ 5432)
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database successfully!');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err);
});

export const query = (text, params) => pool.query(text, params);