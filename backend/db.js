import pg from 'pg';

const { Pool } = pg;

// 💡 ปรับปรุงให้รองรับการเชื่อมต่อผ่าน DATABASE_URL (สำหรับ Supabase/Render)
// และเปิดใช้งาน SSL เพื่อความปลอดภัยในการเชื่อมต่อ Cloud
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database successfully!');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err);
});

export const query = (text, params) => pool.query(text, params);