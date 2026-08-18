import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
// 💡 เพิ่มการ Import ไลบรารีสำหรับตั้งเวลา และดึงข้อมูลจากฐานข้อมูล
import cron from "node-cron";
import { query } from "./db.js"; 
import { messagingApi } from "@line/bot-sdk";

const app = express();

// เปิดให้ฝั่ง Frontend (localhost:3000) ยิงข้อมูลข้ามพอร์ตมาหาได้
app.use(cors());
app.use(express.json());

// เรียกใช้งานเส้นทาง API ทั้งหมดโดยจะเริ่มต้นด้วย /api เช่น /api/tasks
app.use('/api', apiRoutes);
// รองรับเส้นทางรากโดยตรง เช่น /webhook เผื่อใน LINE Developers ตั้งค่าเป็น /webhook
app.use('/', apiRoutes);

// ตรวจสอบและอัปเดตตารางฐานข้อมูลอัตโนมัติเมื่อเปิดเซิร์ฟเวอร์
try {
  console.log("Checking database schema updates...");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS line_user_id VARCHAR(255);");
  
  // สร้างตารางสำหรับเก็บตั้งค่าระบบ เช่น LINE Group ID
  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // ตรวจสอบว่ามี target_group_id หรือยัง ถ้ามี LINE_GROUP_ID ใน .env ให้นำมาใช้
  if (process.env.LINE_GROUP_ID) {
    await query(`
      INSERT INTO system_settings (key, value)
      VALUES ('target_group_id', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `, [process.env.LINE_GROUP_ID.trim()]);
  }

  console.log("Database schema checked and updated successfully.");
} catch (dbErr) {
  console.error("Database migration check failed:", dbErr.message);
}

app.get('/', (req, res) => {
  res.send('Smart Event API is running fully standard.');
});

// ==========================================
// ⏱️ ระบบตั้งเวลาส่งสรุปกิจกรรมเข้ากลุ่ม LINE อัตโนมัติ "ทุกวัน เวลา 08:00 น. (เวลาไทย)"
// ==========================================
const { MessagingApiClient } = messagingApi;
const lineClientForCron = new MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "dummy_token"
});

cron.schedule("0 8 * * *", async () => {
  console.log("⏱️ [CRON 08:00] เริ่มต้นฟังก์ชันตรวจสอบและสรุปกิจกรรมประจำวันอัตโนมัติ...");
  
  try {
    // ดึงวันที่ปัจจุบันตามเวลาประเทศไทย (Asia/Bangkok) ในรูปแบบ YYYY-MM-DD
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
    
    // ยิงคำสั่ง SQL ไปดึงกิจกรรมเฉพาะของวันนี้
    const result = await query(
      "SELECT * FROM tasks WHERE date::text LIKE $1 || '%' ORDER BY start_time ASC NULLS LAST, id ASC", 
      [todayStr]
    );

    // ดึงรหัสเป้าหมายกลุ่ม LINE จากฐานข้อมูล หรือ .env
    let targetGroupId = process.env.LINE_GROUP_ID || "";
    try {
      const settingsRes = await query("SELECT value FROM system_settings WHERE key = 'target_group_id'");
      if (settingsRes.rows.length > 0 && settingsRes.rows[0].value) {
        targetGroupId = settingsRes.rows[0].value.trim();
      }
    } catch (settErr) {
      console.error("Failed to fetch targetGroupId for cron job:", settErr.message);
    }

    if (!targetGroupId) {
      console.warn("⚠️ Cron: No target_group_id configured, skipping LINE push.");
      return;
    }

    if (result.rows.length === 0) {
      // เคสที่ 1: วันนี้ไม่มีนัดหมายกิจกรรมใดๆ ในระบบเลย
      await lineClientForCron.pushMessage({
        to: targetGroupId,
        messages: [{ 
          type: 'text', 
          text: `☀️ สวัสดีตอนเช้าครับทุกคน\n📅 วันนี้ (${todayStr}) ไม่มีกิจกรรมนัดหมายในระบบครับ ขอให้เป็นวันที่ดีสำหรับการทำงานครับ! ✨` 
        }]
      });
    } else {
      // เคสที่ 2: วันนี้มีงาน รวบรวมข้อมูลทั้งหมดพิมพ์สรุปรายงาน
      let reportText = `☀️ สวัสดีตอนเช้าครับทุกคน!\n📅 สรุปข้อมูลกิจกรรมประจำวันนี้ (${todayStr})\n\n`;
      
      result.rows.forEach((task, index) => {
        const timeDisplay = task.start_time ? `${String(task.start_time).slice(0, 5)} น.` : "ไม่ระบุเวลา";
        reportText += `${index + 1}. 📝 เรื่อง: ${task.title}\n` +
                      `⏰ เวลา: ${timeDisplay}\n` +
                      `🚪 สถานที่: ${task.room || "-"}\n` +
                      `👤 ผู้รับผิดชอบ: ${task.chairman || "-"}\n` +
                      `-----------------------\n`;
      });
      
      await lineClientForCron.pushMessage({
        to: targetGroupId,
        messages: [{ type: 'text', text: reportText }]
      });
    }
    console.log("🔔 ส่งสรุปกิจกรรมยามเช้าเข้ากลุ่ม LINE สำเร็จเรียบร้อย!");
    
  } catch (error) {
    console.error("Cron Job Error:", error);
  }
}, {
  timezone: "Asia/Bangkok"
});

// ==========================================
// สั่งเปิดเซิร์ฟเวอร์หลัก (Port 5000)
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is perfectly running on port ${PORT}`));