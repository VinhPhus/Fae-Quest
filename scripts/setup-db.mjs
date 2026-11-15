import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

// Đã hoàn tất khởi tạo. Mật khẩu được bảo mật và chỉ đọc qua process.env.DATABASE_PASSWORD
const client = new Client({
  host: process.env.SUPABASE_DB_HOST || 'db.dliowzbrwqqmdifstmea.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 10000,
});

async function setupDatabase() {
  if (!process.env.DATABASE_PASSWORD) {
    console.log('⚠️ Bảng đã được khởi tạo trước đó. Để chạy lại script, vui lòng truyền DATABASE_PASSWORD.');
    return;
  }
  try {
    await client.connect();
    const sqlPath = path.join(__dirname, '..', 'supabase_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await client.query(sql);
    console.log('✅ Khởi tạo cơ sở dữ liệu hoàn tất!');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await client.end();
  }
}

setupDatabase();
