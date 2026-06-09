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

app.get('/', (req, res) => {
  res.send('Smart Event API is running fully standard.');
});

// ==========================================
// ⏱️ ข้อ 3: ระบบตั้งเวลาส่งสรุปกิจกรรมเข้ากลุ่ม LINE อัตโนมัติ "ทุกวัน เวลา 08:00 น."
// ==========================================
const { MessagingApiClient } = messagingApi;
const lineClientForCron = new MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

cron.schedule("0 8 * * *", async () => {
  console.log("⏱️ เริ่มต้นฟังก์ชันตรวจสอบและสรุปกิจกรรมประจำวันอัตโนมัติ...");
  
  try {
    // ดึงวันที่ปัจจุบันมาจัดฟอร์แมตเป็น ปี-เดือน-วัน (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0]; 
    
    // ยิงคำสั่ง SQL ไปดึงกิจกรรมเฉพาะของวันนี้ขึ้นมาเรียงลำดับเวลาสร้าง
    const result = await query(
      "SELECT * FROM tasks WHERE date = $1 ORDER BY created_at ASC", 
      [todayStr]
    );

    // รหัสเป้าหมายกลุ่ม LINE ของคุณ
    const targetGroupId = "C31512452c1c75cde66ee035e2ee0e621";

    if (result.rows.length === 0) {
      // เคสที่ 1: วันนี้ไม่มีนัดหมายกิจกรรมใดๆ ในระบบเลย
      await lineClientForCron.pushMessage({
        to: targetGroupId,
        messages: [{ 
          type: 'text', 
          text: `☀️ สวัสดีตอนเช้าครับทุกคน\n📅 วันนี้ไม่มีกิจกรรมนัดหมายใด ๆ ครับ ขอให้เป็นวันที่ดีสำหรับการทำงานครับ! ✨` 
        }]
      });
    } else {
      // เคสที่ 2: วันนี้มีงาน รวบรวมข้อมูลทั้งหมดพิมพ์สรุปรายงานส่งเข้าไปในกล่องข้อความทีเดียว
      let reportText = `☀️ สวัสดีตอนเช้าครับทุกคน!\n📅 สรุปข้อมูลกิจกรรมประจำวันนี้ครับ (${todayStr})\n\n`;
      
      result.rows.forEach((task, index) => {
        // 💡 ปรับปรุงคำศัพท์ใหม่เป็น "สถานที่" และ "ผู้รับผิดชอบ" เรียบร้อยแล้ว
        reportText += `${index + 1}. 📝 เรื่อง: ${task.title}\n` +
                      `🚪 สถานที่: ${task.room}\n` +
                      `👤 ผู้รับผิดชอบ: ${task.chairman}\n` +
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
});

// ==========================================
// สั่งเปิดเซิร์ฟเวอร์หลัก (Port 5000)
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is perfectly running on port ${PORT}`));