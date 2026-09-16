import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
// นำเข้าโมดูลเวอร์ชันใหม่ v9+
import { messagingApi } from "@line/bot-sdk";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

const { MessagingApiClient } = messagingApi;
const lineClient = new MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "dummy_token",
});

// ฟังก์ชันช่วยดึง Group ID ไดนามิกจากฐานข้อมูล Supabase หรือ .env
async function getTargetGroupId() {
  try {
    const result = await query("SELECT value FROM system_settings WHERE key = 'target_group_id'");
    if (result.rows.length > 0 && result.rows[0].value && result.rows[0].value.trim() !== "") {
      return result.rows[0].value.trim();
    }
  } catch (error) {
    console.error("Error reading target_group_id from database:", error.message);
  }
  return (process.env.LINE_GROUP_ID || "").trim();
}

// ฟังก์ชันแปลงวันที่ปัจจุบันเป็น YYYY-MM-DD ตามเขตเวลาประเทศไทย (Asia/Bangkok)
function getBangkokTodayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
}

// ฟังก์ชันแกะสตริง YYYY-MM-DD จาก Date Object หรือ String อย่างปลอดภัย
function getIsoDateStr(dateInput) {
  if (!dateInput) return "";
  try {
    if (typeof dateInput === 'string') {
      return dateInput.split('T')[0].trim();
    }
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      const year = dateInput.getFullYear();
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const day = String(dateInput.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return String(dateInput).split('T')[0].trim();
  } catch (e) {
    return String(dateInput);
  }
}

// ==========================================
// 👑 Middleware ตรวจสอบสิทธิ์ว่าผู้ใช้รายนี้คือ Admin หรือไม่
// ==========================================
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "ปฏิเสธการเข้าถึง: สำหรับผู้ดูแลระบบเท่านั้น" });
  }
};

// ==========================================
// 💡 ฟังก์ชันสร้างการ์ด Flex Message (ล้างบั๊ก marginTop เรียบร้อย)
// ==========================================
function createFlexNotification(
  category,
  date,
  title,
  chairman,
  room,
  startTime,
  endTime,
  description,
  bannerUrl,
  taskId,
) {
  const startStr = startTime ? String(startTime).slice(0, 5) : "";
  const endStr = endTime ? String(endTime).slice(0, 5) : "";
  const timeDisplay =
    startStr && endStr ? `${startStr} - ${endStr} น.` : (startStr ? `${startStr} น.` : "ไม่ได้ระบุเวลา");

  // ตรวจสอบ bannerUrl ว่าเป็น HTTPS URL ที่ถูกต้องเท่านั้น (LINE Messaging API ปฏิเสธ URL ที่ไม่ใช่ HTTPS)
  const isValidBanner = bannerUrl && typeof bannerUrl === "string" && bannerUrl.trim().startsWith("https://");
  const cleanBannerUrl = isValidBanner ? bannerUrl.trim() : null;

  // กำหนดธีมสีตามหมวดหมู่กิจกรรมเพื่อความสวยงามและแยกแยะง่าย
  let themeColor = "#DC2626"; // สีแดง CMTC เป็นสีเริ่มต้น
  let themeBg = "#FEF2F2";
  
  if (category === "การเงิน") {
    themeColor = "#10B981"; // Emerald
    themeBg = "#ECFDF5";
  } else if (category === "การตลาด") {
    themeColor = "#F59E0B"; // Amber
    themeBg = "#FEF3C7";
  } else if (category === "ประชาสัมพันธ์") {
    themeColor = "#0284C7"; // Sky
    themeBg = "#F0F9FF";
  } else if (category === "กิจกรรม") {
    themeColor = "#E11D48"; // Rose
    themeBg = "#FFF1F2";
  } else if (category === "การเรียนการสอน") {
    themeColor = "#2563EB"; // Blue
    themeBg = "#EFF6FF";
  } else if (category === "ด่วน" || category === "ด่วนที่สุด") {
    themeColor = "#E11D48"; // Rose/Red
    themeBg = "#FFF1F2";
  }

  // โครงสร้าง Flex Message ดีไซน์ Premium
  const flexContents = {
    type: "bubble",
    size: "giga",
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "0px",
      contents: [
        // 1. Banner รูปภาพ (ถ้ามีและเป็น HTTPS)
        ...(cleanBannerUrl ? [{
          type: "image",
          url: cleanBannerUrl,
          size: "full",
          aspectRatio: "20:11",
          aspectMode: "cover",
        }] : []),
        
        // 2. ส่วนเนื้อหาหลัก
        {
          type: "box",
          layout: "vertical",
          paddingAll: "20px",
          contents: [
            // หมวดหมู่ (Pill Badge)
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  backgroundColor: themeBg,
                  cornerRadius: "6px",
                  paddingPercent: "10%",
                  alignItems: "center",
                  justifyContent: "center",
                  contents: [
                    {
                      type: "text",
                      text: category || "กิจกรรมทั่วไป",
                      color: themeColor,
                      size: "xs",
                      weight: "bold",
                    }
                  ]
                },
                {
                  type: "text",
                  text: "📌 กิจกรรมใหม่",
                  color: "#94A3B8",
                  size: "xs",
                  weight: "bold",
                  align: "end",
                  gravity: "center"
                }
              ]
            },
            
            // หัวข้องาน
            {
              type: "text",
              text: title,
              weight: "bold",
              size: "xl",
              color: "#0F172A",
              wrap: true,
              margin: "md",
            },
            
            // เส้นแบ่งตกแต่ง
            {
              type: "box",
              layout: "vertical",
              margin: "lg",
              height: "2px",
              backgroundColor: "#F1F5F9"
            },
            
            // รายละเอียด วัน-เวลา และสถานที่ (Grid Card Layout)
            {
              type: "box",
              layout: "vertical",
              margin: "lg",
              spacing: "md",
              contents: [
                // แถวที่ 1: วันและเวลา
                {
                  type: "box",
                  layout: "horizontal",
                  spacing: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      width: "36px",
                      height: "36px",
                      backgroundColor: "#F8FAFC",
                      cornerRadius: "100px",
                      alignItems: "center",
                      justifyContent: "center",
                      contents: [
                        {
                          type: "text",
                          text: "📅",
                          size: "md",
                          align: "center"
                        }
                      ]
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "วันจัดกิจกรรม",
                          size: "xs",
                          color: "#94A3B8",
                          weight: "medium"
                        },
                        {
                          type: "text",
                          text: `${date} (${timeDisplay})`,
                          size: "sm",
                          color: "#334155",
                          weight: "bold",
                          wrap: true
                        }
                      ]
                    }
                  ]
                },
                // แถวที่ 2: สถานที่จัดงาน
                {
                  type: "box",
                  layout: "horizontal",
                  spacing: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      width: "36px",
                      height: "36px",
                      backgroundColor: "#F8FAFC",
                      cornerRadius: "100px",
                      alignItems: "center",
                      justifyContent: "center",
                      contents: [
                        {
                          type: "text",
                          text: "🚪",
                          size: "md",
                          align: "center"
                        }
                      ]
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "สถานที่จัดงาน",
                          size: "xs",
                          color: "#94A3B8",
                          weight: "medium"
                        },
                        {
                          type: "text",
                          text: room || "ไม่ได้ระบุสถานที่",
                          size: "sm",
                          color: "#334155",
                          weight: "bold",
                          wrap: true
                        }
                      ]
                    }
                  ]
                },
                // แถวที่ 3: ผู้รับผิดชอบ
                {
                  type: "box",
                  layout: "horizontal",
                  spacing: "md",
                  contents: [
                    {
                      type: "box",
                      layout: "vertical",
                      width: "36px",
                      height: "36px",
                      backgroundColor: "#F8FAFC",
                      cornerRadius: "100px",
                      alignItems: "center",
                      justifyContent: "center",
                      contents: [
                        {
                          type: "text",
                          text: "👤",
                          size: "md",
                          align: "center"
                        }
                      ]
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "ผู้รับผิดชอบงาน",
                          size: "xs",
                          color: "#94A3B8",
                          weight: "medium"
                        },
                        {
                          type: "text",
                          text: chairman || "ไม่ได้ระบุผู้รับผิดชอบ",
                          size: "sm",
                          color: "#334155",
                          weight: "bold",
                          wrap: true
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            
            // กล่องวาระงาน (ถ้ามีรายละเอียด)
            ...(description ? [{
              type: "box",
              layout: "vertical",
              backgroundColor: "#F8FAFC",
              paddingAll: "12px",
              cornerRadius: "8px",
              margin: "lg",
              borderWidth: "1px",
              borderColor: "#E2E8F0",
              contents: [
                {
                  type: "text",
                  text: "📝 วาระ / สิ่งที่ต้องทำ",
                  size: "xs",
                  color: "#64748B",
                  weight: "bold"
                },
                {
                  type: "text",
                  text: description,
                  size: "sm",
                  color: "#475569",
                  wrap: true,
                  margin: "xs"
                }
              ]
            }] : [])
          ]
        }
      ]
    }
  };

  // ปุ่มกดมอบหมายงานด้านล่าง (Footer)
  if (taskId) {
    flexContents.footer = {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      paddingTop: "0px",
      contents: [
        {
          type: "button",
          style: "primary",
          color: themeColor, // ปรับสีปุ่มตามธีมหมวดหมู่
          height: "md",
          action: {
            type: "uri",
            label: "🎯 มอบหมายงานใหม่",
            uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || "2010617243-H2wIcDTp"}/assign?taskId=${taskId}`
          }
        }
      ]
    };
  }

  return {
    type: "flex",
    altText: `📌 มีกิจกรรมใหม่: ${title}`,
    contents: flexContents,
  };
}

// 1. REGISTER: สมัครสมาชิก (อนุญาตเฉพาะ Admin เท่านั้น)
router.post("/auth/register", authenticateToken, isAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!password || password.length < 6) {
    return res
      .status(400)
      .json({ message: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรขึ้นไป" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || "user_n"; // กำหนดสิทธิ์เริ่มต้นเป็น user_n หากไม่ได้ระบุ
    const result = await query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashedPassword, userRole],
    );
    res
      .status(201)
      .json({ message: "สมัครสมาชิกให้ผู้ใช้ใหม่สำเร็จ", user: result.rows[0] });
  } catch (error) {
    res
      .status(400)
      .json({ message: "อีเมลนี้ถูกใช้งานแล้ว หรือข้อมูลไม่ถูกต้อง" });
  }
});

// 2. LOGIN: เข้าสู่ระบบ
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
    }
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || "user_n",
      },
      JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "user_n",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่ระบบหลังบ้าน" });
  }
});

// 2.5 GET & UPDATE PROFILE (สำหรับผูกบัญชี LINE)
router.get("/auth/profile", authenticateToken, async (req, res) => {
  try {
    const result = await query("SELECT id, name, email, role, line_user_id FROM users WHERE id = $1", [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้งาน" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "ดึงข้อมูลโปรไฟล์ไม่สำเร็จ" });
  }
});

router.post("/auth/profile/line", authenticateToken, async (req, res) => {
  const { lineUserId } = req.body;
  try {
    if (lineUserId) {
      // เคลียร์ line_user_id นี้จากบัญชีอื่นก่อน เพื่อป้องกันการซ้ำซ้อน
      await query("UPDATE users SET line_user_id = NULL WHERE line_user_id = $1 AND id != $2", [lineUserId, req.user.id]);
    }
    await query("UPDATE users SET line_user_id = $1 WHERE id = $2", [lineUserId || null, req.user.id]);
    res.json({ message: "อัปเดตการเชื่อมต่อบัญชี LINE สำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "เชื่อมต่อบัญชี LINE ล้มเหลว" });
  }
});

// 3. GET ALL TASKS: ดึงข้อมูลงานทั้งหมดขึ้นแดชบอร์ด (แยกตาม 4 Roles)
router.get("/tasks", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { showAll } = req.query;

  try {
    let result;
    // แสดงกิจกรรมรวมขององค์กรสำหรับปฏิทินและแดชบอร์ด
    if (showAll === "true" || !req.query.onlyMine || userRole === "admin" || userRole === "pr" || userRole === "user_pr") {
      result = await query(`
        SELECT tasks.*, users.name as creator_name 
        FROM tasks 
        JOIN users ON tasks.user_id = users.id 
        ORDER BY tasks.created_at DESC
      `);
    } else {
      result = await query(
        `
        SELECT tasks.*, users.name as creator_name 
        FROM tasks 
        JOIN users ON tasks.user_id = users.id 
        WHERE tasks.user_id = $1
        ORDER BY tasks.created_at DESC
      `,
        [userId],
      );
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลแดชบอร์ดได้" });
  }
});

// 3.5 POST ACCEPT TASK: รับงานมอบหมาย (สำหรับ Staff/ผู้ปฏิบัติงาน)
router.post("/tasks/:id/accept", authenticateToken, async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;
  const userName = req.user.name;

  try {
    // 1. ตรวจสอบกิจกรรม
    const checkTask = await query("SELECT * FROM tasks WHERE id = $1", [taskId]);
    if (checkTask.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลกิจกรรม" });
    }

    // 2. อัปเดตงานมอบหมายให้ผู้ใช้คนนี้
    await query(
      `UPDATE tasks 
       SET user_id = $1, chairman = $2 
       WHERE id = $3`,
      [userId, userName, taskId]
    );

    // 3. ส่ง LINE แจ้งเตือนไปยังกลุ่มประชาสัมพันธ์/แอดมิน เพื่อบอกว่ามีคนรับงานแล้ว
    try {
      const acceptMessage = `✅ คุณ ${userName} ได้กดรับงานแล้ว!\n📝 เรื่อง: ${checkTask.rows[0].title}\n🚪 สถานที่: ${checkTask.rows[0].room}\n⏱️ เวลา: ${checkTask.rows[0].start_time ? checkTask.rows[0].start_time.slice(0, 5) : "08:30"} - ${checkTask.rows[0].end_time ? checkTask.rows[0].end_time.slice(0, 5) : "11:30"} น.`;
      
      const targetGroupId = await getTargetGroupId();
      await lineClient.pushMessage({
        to: targetGroupId,
        messages: [{ type: "text", text: acceptMessage }],
      });
    } catch (lineErr) {
      console.error("LIFF accept job LINE notify error:", lineErr);
    }

    res.json({ message: "รับงานสำเร็จเรียบร้อยแล้ว!" });
  } catch (error) {
    console.error("Accept Job API Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการรับงาน" });
  }
});

// 4. POST NEW TASK: บันทึกข้อมูลงานจากฟอร์ม (เวอร์ชันจัดท่อสลับสาย ปิดบั๊กป๊อปอัพตัวแดง 🟢)
router.post("/tasks", authenticateToken, async (req, res) => {
  const {
    category,
    date,
    title,
    chairman,
    room,
    startTime,
    endTime,
    description,
    bannerUrl,
  } = req.body;
  const userId = req.user.id;

  try {
    // 🟢 สเต็ปที่ 1: สั่งบันทึกข้อมูลเข้า Supabase ออนไลน์ตัวจริง
    const result = await query(
      "INSERT INTO tasks (user_id, category, date, title, chairman, room, start_time, end_time, description, banner_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
      [
        userId,
        category,
        date,
        title,
        chairman,
        room,
        startTime,
        endTime,
        description,
        bannerUrl || null,
      ],
    );

    // 🟢 สเต็ปที่ 2: แปลงวันที่ให้อยู่ในฟอร์แมต YYYY-MM-DD
    const taskObj = result.rows[0];
    const formattedDateStr = getIsoDateStr(taskObj.date) || date;

    // 🟢 สเต็ปที่ 3: ส่ง LINE แจ้งเตือนเข้าห้องกลุ่มไลน์
    try {
      const targetGroupId = await getTargetGroupId();
      if (!targetGroupId) {
        console.warn("⚠️ LINE Notification: No target_group_id configured. Please set group in Admin panel or invite bot to group.");
      } else {
        try {
          // พยายามส่งแบบ Flex Message ก่อน
          await lineClient.pushMessage({
            to: targetGroupId,
            messages: [
              createFlexNotification(
                category,
                formattedDateStr,
                title,
                chairman,
                room,
                startTime,
                endTime,
                description,
                bannerUrl,
                taskObj.id, // 💡 ส่งรหัส ID กิจกรรมไปสร้างปุ่มมอบหมายผ่าน LIFF
              ),
            ],
          });
          console.log(`🟢 LINE Flex Notification sent successfully to group ${targetGroupId}`);
        } catch (flexError) {
          console.warn("⚠️ Flex Message failed, attempting Plain Text Fallback:", flexError.message);
          // Fallback ส่งเป็นข้อความธรรมดา หาก Flex ติดปัญหา
          const startStr = startTime ? String(startTime).slice(0, 5) : "";
          const endStr = endTime ? String(endTime).slice(0, 5) : "";
          const timeText = startStr && endStr ? `${startStr} - ${endStr} น.` : (startStr ? `${startStr} น.` : "ไม่ได้ระบุเวลา");
          const fallbackText = `📌 มีกิจกรรมใหม่ในระบบ!\n\n` +
                               `🏷️ หมวดหมู่: ${category || "ทั่วไป"}\n` +
                               `📝 เรื่อง: ${title}\n` +
                               `📅 วันที่: ${formattedDateStr} (${timeText})\n` +
                               `🚪 สถานที่: ${room || "-"}\n` +
                               `👤 ผู้รับผิดชอบ: ${chairman || "-"}\n` +
                               (description ? `📋 วาระงาน: ${description}\n` : "") +
                               `\n👉 มอบหมายงาน: https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || "2010617243-H2wIcDTp"}/assign?taskId=${taskObj.id}`;
          
          await lineClient.pushMessage({
            to: targetGroupId,
            messages: [{ type: "text", text: fallbackText }],
          });
          console.log(`🟢 LINE Plain Text Notification sent successfully to group ${targetGroupId}`);
        }
      }
    } catch (lineError) {
      console.error(
        "⚠️ LINE Notification push completely failed. Details:",
        lineError.message,
        lineError.response ? JSON.stringify(lineError.response.data || lineError.response) : ""
      );
    }

    // 🟢 สเต็ปที่ 4: ทำการตอบกลับหาหน้าบ้าน ( Next.js ได้รับตรงนี้จะแสดงป๊อปอัพสำเร็จ )
    res
      .status(201)
      .json({ message: "บันทึกกิจกรรมสำเร็จ", task: result.rows[0] });
  } catch (error) {
    console.error(error);
    // ป้องกันการยิงซ้ำถ้ามีการตอบกลับไปแล้ว
    if (!res.headersSent) {
      res.status(500).json({ message: "ไม่สามารถบันทึกข้อมูลฟอร์มได้" });
    }
  }
});

// 5. API สำหรับลบกิจกรรม
router.delete("/tasks/:id", authenticateToken, async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;
  const userName = req.user.name;
  const userRole = req.user.role;

  try {
    const checkTask = await query("SELECT * FROM tasks WHERE id = $1", [
      taskId,
    ]);
    if (checkTask.rows.length === 0)
      return res.status(404).json({ message: "ไม่พบกิจกรรม" });
    if (checkTask.rows[0].user_id !== userId && userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "คุณไม่มีสิทธิ์ลบกิจกรรมของผู้อื่น" });
    }

    const deletedTaskTitle = checkTask.rows[0].title;
    await query("DELETE FROM tasks WHERE id = $1", [taskId]);

    // ตอบกลับหน้าบ้านทันทีเพื่อความเร็ว
    res.json({ message: "ลบกิจกรรมเรียบร้อยแล้ว" });

    // แอบยิงไลน์ข้างหลัง
    try {
      const deleteMessage = `❌ มีการยกเลิก/ลบกิจกรรม!\n📝 เรื่อง: ${deletedTaskTitle}\n👤 ลบโดย: ${userName} ${userRole === "admin" ? "(Admin)" : ""}`;
      const targetGroupId = await getTargetGroupId();
      await lineClient.pushMessage({
        to: targetGroupId,
        messages: [{ type: "text", text: deleteMessage }],
      });
    } catch (le) {
      console.error("LINE delete log notify failed:", le.message);
    }
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบ" });
  }
});

// 6. API สำหรับแก้ไขงาน
router.put("/tasks/:id", authenticateToken, async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;
  const {
    category,
    date,
    title,
    chairman,
    room,
    startTime,
    endTime,
    description,
  } = req.body;

  try {
    const checkTask = await query("SELECT * FROM tasks WHERE id = $1", [
      taskId,
    ]);
    if (checkTask.rows.length === 0)
      return res.status(404).json({ message: "ไม่พบกิจกรรมที่ต้องการแก้ไข" });
    if (checkTask.rows[0].user_id !== userId && userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "คุณไม่มีสิทธิ์แก้ไขกิจกรรมของผู้อื่น" });
    }

    const result = await query(
      `UPDATE tasks 
       SET category = $1, date = $2, title = $3, chairman = $4, room = $5, start_time = $6, end_time = $7, description = $8
       WHERE id = $9 RETURNING *`,
      [
        category,
        date,
        title,
        chairman,
        room,
        startTime,
        endTime,
        description,
        taskId,
      ],
    );

    res.json({ message: "อัปเดตข้อมูลสำเร็จ", task: result.rows[0] });
  } catch (error) {
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดหลังบ้าน ไม่สามารถอัปเดตได้" });
  }
});

// =========================================================
// 👑 ADMIN ONLY API ROUTES
// =========================================================

// 👑 7. [ฟังก์ชันมอบหมายงาน] แอดมินสั่งเปลี่ยนตัวเจ้าของกิจกรรม
router.patch(
  "/admin/tasks/:id/assign",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    const taskId = req.params.id;
    const { newUserId } = req.body;

    if (!newUserId) {
      return res
        .status(400)
        .json({ message: "กรุณาระบุรายชื่อสมาชิกที่จะรับมอบหมายงานครับน้า" });
    }

    try {
      const checkTask = await query("SELECT * FROM tasks WHERE id = $1", [
        taskId,
      ]);
      if (checkTask.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "ไม่พบกิจกรรมที่ต้องการมอบหมาย" });
      }

      const checkUser = await query("SELECT name, line_user_id FROM users WHERE id = $1", [
        newUserId,
      ]);
      if (checkUser.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "ไม่พบรายชื่อพนักงานคนดังกล่าวในระบบ" });
      }

      const targetUserName = checkUser.rows[0].name;
      const targetLineUserId = checkUser.rows[0].line_user_id;
      const oldTaskTitle = checkTask.rows[0].title;

      await query(
        `UPDATE tasks 
         SET user_id = $1, chairman = $2 
         WHERE id = $3`,
        [newUserId, targetUserName, taskId],
      );

      res.json({
        message: `มอบหมายงานสำเร็จ! เปลี่ยนตัวผู้รับผิดชอบเป็นคุณ ${targetUserName} เรียบร้อยครับน้า`,
      });

      try {
        const assignMessage = `🎖️ คุณได้รับมอบหมายงานใหม่!\n📝 เรื่อง: ${oldTaskTitle}\n🚪 สถานที่: ${checkTask.rows[0].room}\n⏱️ เวลา: ${checkTask.rows[0].start_time ? checkTask.rows[0].start_time.slice(0, 5) : "08:30"} - ${checkTask.rows[0].end_time ? checkTask.rows[0].end_time.slice(0, 5) : "11:30"} น.\n(ระบบย้ายงานเข้าแดชบอร์ดส่วนตัวเรียบร้อยแล้วครับ)`;
        
        if (targetLineUserId) {
          // หากผู้ใช้ผูกบัญชี LINE ไว้ ให้ส่งตรงไปยัง LINE ส่วนตัวของพนักงานรายนั้น
          await lineClient.pushMessage({
            to: targetLineUserId,
            messages: [{ type: "text", text: assignMessage }],
          });
          console.log(`LINE: Sent personal notification to user ${targetUserName} (${targetLineUserId})`);
        } else {
          // หากยังไม่เชื่อมต่อบัญชี ให้แจ้งเตือนลงกลุ่มพนักงานพร้อมหมายเหตุบอกแอดมิน
          const groupFallbackMessage = `🎖️ แอดมินมอบหมายงานใหม่!\n📝 เรื่อง: ${oldTaskTitle}\n👤 ผู้รับผิดชอบ: ${targetUserName}\n(หมายเหตุ: พนักงานคนนี้ยังไม่ได้เชื่อมต่อบัญชี LINE ส่วนตัว)`;
          const targetGroupId = await getTargetGroupId();
          await lineClient.pushMessage({
            to: targetGroupId,
            messages: [{ type: "text", text: groupFallbackMessage }],
          });
        }
      } catch (le) {
        console.error("LINE assign notify failed:", le.message);
      }
    } catch (error) {
      console.error("Admin assign and change chairman error:", error);
      res
        .status(500)
        .json({ message: "เกิดข้อผิดพลาดหลังบ้าน ไม่สามารถมอบหมายงานได้" });
    }
  },
);

// ดึงข้อมูลสมาชิกทั้งหมด (Admin เท่านั้น)
router.get("/admin/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "ดึงข้อมูลสมาชิกไม่สำเร็จ" });
  }
});

// ลบสมาชิกออกจากระบบ (Admin เท่านั้น)
router.delete(
  "/admin/users/:id",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    const { id } = req.params;
    try {
      if (parseInt(id) === req.user.id)
        return res.status(400).json({ message: "ลบไอดีตัวเองไม่ได้ครับน้า" });
      await query("DELETE FROM users WHERE id = $1", [id]);
      res.json({ message: "ลบสมาชิกสำเร็จ" });
    } catch (error) {
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบ" });
    }
  },
);

// ดึงรหัสกลุ่มไลน์ปัจจุบัน (Admin เท่านั้น)
router.get("/admin/settings/target-group-id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const targetGroupId = await getTargetGroupId();
    res.json({ targetGroupId });
  } catch (error) {
    res.status(500).json({ message: "ดึงข้อมูลตั้งค่ารหัสกลุ่มไลน์ล้มเหลว" });
  }
});

// บันทึก/อัปเดตข้อมูลรหัสกลุ่มไลน์เป้าหมาย (Admin เท่านั้น)
router.put("/admin/settings/target-group-id", authenticateToken, isAdmin, async (req, res) => {
  const { targetGroupId } = req.body;
  if (!targetGroupId || targetGroupId.trim() === "") {
    return res.status(400).json({ message: "กรุณาระบุรหัสกลุ่มไลน์เป้าหมาย" });
  }

  try {
    await query(
      `INSERT INTO system_settings (key, value)
       VALUES ('target_group_id', $1)
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value`,
      [targetGroupId.trim()]
    );
    res.json({ message: "อัปเดตรหัสกลุ่มไลน์เป้าหมายสำเร็จ" });
  } catch (error) {
    console.error("Update target group id error:", error);
    res.status(500).json({ message: "อัปเดตรหัสกลุ่มไลน์เป้าหมายล้มเหลว" });
  }
});

// อัปเดตสิทธิ์สมาชิก (Admin เท่านั้น)
router.put(
  "/admin/users/:id/role",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["admin", "pr", "user_pr", "staff", "user_n"].includes(role)) {
      return res.status(400).json({ message: "ระดับสิทธิ์ไม่ถูกต้อง" });
    }

    try {
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ message: "ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้" });
      }

      const result = await query(
        "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role",
        [role, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "ไม่พบผู้ใช้ที่ต้องการแก้ไข" });
      }

      res.json({ message: "อัปเดตสิทธิ์ผู้ใช้สำเร็จ", user: result.rows[0] });
    } catch (error) {
      console.error("Update role error:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสิทธิ์" });
    }
  }
);



// ทดสอบส่งข้อความเข้ากลุ่ม LINE (Admin เท่านั้น)
router.post("/admin/settings/test-line-notification", authenticateToken, isAdmin, async (req, res) => {
  try {
    const targetGroupId = await getTargetGroupId();
    if (!targetGroupId) {
      return res.status(400).json({ success: false, message: "ยังไม่ได้ระบุ LINE Group ID ในระบบ กรุณาบันทึกรหัสกลุ่มก่อนครับ" });
    }

    await lineClient.pushMessage({
      to: targetGroupId,
      messages: [{
        type: "text",
        text: `🔔 [ทดสอบระบบ Smart Event CMTC]\n\n✅ ข้อความแจ้งเตือนทดสอบนี้ส่งสำเร็จเรียบร้อยแล้วครับ!\n🆔 Group ID: ${targetGroupId}\n⏱️ เวลาทดสอบ: ${new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'medium' }).format(new Date())}`
      }]
    });

    res.json({ success: true, message: `ส่งข้อความทดสอบเข้ากลุ่ม (${targetGroupId}) สำเร็จเรียบร้อยแล้ว!` });
  } catch (error) {
    console.error("Test LINE notification error:", error);
    res.status(500).json({ 
      success: false, 
      message: `ส่งข้อความไม่สำเร็จ: ${error.message}. กรุณาตรวจสอบว่าบอทอยู่ในกลุ่มแล้วหรือไม่ หรือ LINE Access Token ถูกต้อง` 
    });
  }
});

// ==========================================
// 🤖 LINE WEBHOOK ENDPOINT
// ==========================================
router.post("/webhook", async (req, res) => {
  try {
    const events = req.body.events;
    if (!events || events.length === 0) {
      return res.status(200).json({ status: "ok" });
    }

    for (let event of events) {
      // 🟢 1. กรณีบอทถูกเชิญเข้ากลุ่ม (Join Event) หรือมีคนเข้ากลุ่ม
      if (event.type === "join" || event.type === "memberJoined") {
        if (event.source && event.source.groupId) {
          const joinedGroupId = event.source.groupId;
          try {
            // บันทึก group id นี้ลงฐานข้อมูลอัตโนมัติทันที
            await query(
              `INSERT INTO system_settings (key, value)
               VALUES ('target_group_id', $1)
               ON CONFLICT (key)
               DO UPDATE SET value = EXCLUDED.value`,
              [joinedGroupId]
            );
            console.log(`Auto-saved target_group_id on join: ${joinedGroupId}`);

            if (event.replyToken) {
              await lineClient.replyMessage({
                replyToken: event.replyToken,
                messages: [{
                  type: "text",
                  text: `🎉 สวัสดีครับทุกคน! บอท Smart Event CMTC เข้าร่วมกลุ่มเรียบร้อยแล้วครับ\n\n✅ ระบบได้ตั้งค่ากลุ่มนี้สำหรับการแจ้งเตือนกิจกรรมอัตโนมัติเรียบร้อยแล้ว!\n🆔 Group ID: ${joinedGroupId}\n\n👉 พิมพ์ "เช็คงานวันนี้" เพื่อดูตารางงาน\n👉 พิมพ์ "id" เพื่อตรวจสอบรหัสกลุ่ม`
                }]
              });
            }
          } catch (joinErr) {
            console.error("Handle join event error:", joinErr);
          }
        }
      }

      // 🟢 2. จัดการข้อความที่พิมพ์มา (รวมถึงปุ่มกดจาก Rich Menu)
      if (event.type === "message" && event.message.type === "text") {
        const rawMessage = event.message.text.trim();
        const userMessage = rawMessage.toLowerCase();
        const replyToken = event.replyToken;

        // เคสที่ 1: เช็ค ID
        if (userMessage === "id" || userMessage === "check id" || userMessage === "ไอดี") {
          if (event.source.type === "group") {
            const groupId = event.source.groupId;
            // บันทึกลง database ทันทีเพื่อความสะดวก
            try {
              await query(
                `INSERT INTO system_settings (key, value)
                 VALUES ('target_group_id', $1)
                 ON CONFLICT (key)
                 DO UPDATE SET value = EXCLUDED.value`,
                [groupId]
              );
            } catch (saveErr) {
              console.error("Save group id error:", saveErr.message);
            }

            await lineClient.replyMessage({
              replyToken,
              messages: [{
                type: "text",
                text: `🆔 รหัสกลุ่ม LINE ของคุณคือ:\n${groupId}\n\n✅ ระบบได้บันทึกกลุ่มนี้เป็นกลุ่มเป้าหมายสำหรับการแจ้งเตือนเรียบร้อยแล้วครับ!`
              }]
            });
          } else {
            await lineClient.replyMessage({
              replyToken,
              messages: [{
                type: "text",
                text: `🆔 User ID ของคุณคือ:\n${event.source.userId}`
              }]
            });
          }
        }

        // เคสที่ 2: ตั้งค่ากลุ่มนี้ / ลงทะเบียนกลุ่ม
        else if (userMessage === "ตั้งค่ากลุ่มนี้" || userMessage === "ลงทะเบียนกลุ่ม" || userMessage === "setgroup") {
          if (event.source.type === "group") {
            const groupId = event.source.groupId;
            await query(
              `INSERT INTO system_settings (key, value)
               VALUES ('target_group_id', $1)
               ON CONFLICT (key)
               DO UPDATE SET value = EXCLUDED.value`,
              [groupId]
            );
            await lineClient.replyMessage({
              replyToken,
              messages: [{
                type: "text",
                text: `✅ ตั้งค่ากลุ่มสำเร็จ!\nบันทึกกลุ่ม ${groupId} สำหรับการแจ้งเตือนกิจกรรมเรียบร้อยแล้วครับ!`
              }]
            });
          } else {
            await lineClient.replyMessage({
              replyToken,
              messages: [{
                type: "text",
                text: `คำสั่งนี้ใช้ได้เฉพาะในกลุ่ม LINE เท่านั้นครับ`
              }]
            });
          }
        }

        // เคสที่ 3: "เช็คงานวันนี้" (จาก Rich Menu หรือพิมพ์เข้ามา)
        else if (
          userMessage === "เช็คงานวันนี้" ||
          userMessage.includes("เช็คงาน") ||
          userMessage.includes("งานวันนี้") ||
          userMessage.includes("ดูกิจกรรม") ||
          userMessage === "today"
        ) {
          try {
            const todayStr = getBangkokTodayStr();
            console.log(`🔍 Webhook checking tasks for today (Bangkok): ${todayStr}`);

            let result;
            try {
              result = await query(
                "SELECT * FROM tasks WHERE date::text LIKE $1 || '%' ORDER BY start_time ASC NULLS LAST, id ASC",
                [todayStr]
              );
            } catch (sqlErr) {
              console.warn("Primary date query with date::text failed, attempting fallback query:", sqlErr.message);
              result = await query(
                "SELECT * FROM tasks WHERE date::text = $1 ORDER BY id ASC",
                [todayStr]
              );
            }

            if (!result || result.rows.length === 0) {
              await lineClient.replyMessage({
                replyToken,
                messages: [{
                  type: "text",
                  text: `📅 รายการกิจกรรมวันนี้ (${todayStr})\n\n☀️ วันนี้ไม่มีกิจกรรมนัดหมายในระบบครับ ขอให้เป็นวันที่ดีสำหรับการทำงานครับ! ✨`
                }],
              });
            } else {
              // 🎨 สร้าง Flex Message Bubble สำหรับแต่ละกิจกรรม (จำกัดไม่เกิน 10 bubbles ตามข้อกำหนด LINE Carousel)
              const maxTasks = result.rows.slice(0, 10);
              const bubbles = maxTasks.map(task => {
                const dateStr = getIsoDateStr(task.date) || todayStr;
                const startTime = task.start_time ? String(task.start_time).slice(0, 5) : "";
                const endTime = task.end_time ? String(task.end_time).slice(0, 5) : "";

                const flex = createFlexNotification(
                  task.category || "กิจกรรม",
                  dateStr,
                  task.title || "กิจกรรม",
                  task.chairman || "ไม่ระบุ",
                  task.room || "ไม่ระบุ",
                  startTime,
                  endTime,
                  task.description || "",
                  task.banner_url || null,
                  task.id
                );
                return flex.contents;
              });

              try {
                await lineClient.replyMessage({
                  replyToken,
                  messages: [
                    {
                      type: "flex",
                      altText: `📅 รายการกิจกรรมวันนี้ (${todayStr}) - พบ ${result.rows.length} กิจกรรม`,
                      contents: bubbles.length > 1 
                        ? { type: "carousel", contents: bubbles }
                        : bubbles[0]
                    }
                  ],
                });
              } catch (flexReplyErr) {
                console.warn("Flex Carousel reply failed, falling back to Plain Text:", flexReplyErr.message);
                let fallbackText = `📅 สรุปรายการกิจกรรมวันนี้ (${todayStr}) - ทั้งหมด ${result.rows.length} กิจกรรม\n\n`;
                result.rows.forEach((task, index) => {
                  const timeDisplay = task.start_time ? `${String(task.start_time).slice(0, 5)} น.` : "ไม่ระบุเวลา";
                  fallbackText += `${index + 1}. 📝 เรื่อง: ${task.title}\n` +
                                  `⏰ เวลา: ${timeDisplay}\n` +
                                  `🚪 สถานที่: ${task.room || "-"}\n` +
                                  `👤 ผู้รับผิดชอบ: ${task.chairman || "-"}\n` +
                                  `-----------------------\n`;
                });
                
                const targetTo = event.source.groupId || event.source.userId;
                try {
                  await lineClient.replyMessage({
                    replyToken,
                    messages: [{ type: "text", text: fallbackText }]
                  });
                } catch (replyAgainErr) {
                  // หาก replyToken ถูกใช้ไปแล้ว ให้ส่งแบบ pushMessage แทน
                  if (targetTo) {
                    await lineClient.pushMessage({
                      to: targetTo,
                      messages: [{ type: "text", text: fallbackText }]
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error("Webhook Check Task Error:", error);
            try {
              await lineClient.replyMessage({
                replyToken,
                messages: [{ type: "text", text: "⚠️ เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม กรุณาลองใหม่อีกครั้งครับ" }]
              });
            } catch (err2) {
              console.error("Send error reply failed:", err2.message);
            }
          }
        }

        // เคสที่ 4: "ติดต่อแอดมิน" (จาก Rich Menu)
        else if (userMessage === "ติดต่อแอดมิน" || userMessage.includes("ติดต่อแอดมิน") || userMessage === "admin") {
          try {
            const userId = event.source.userId;
            
            // 1. ตอบกลับหา User
            await lineClient.replyMessage({
              replyToken,
              messages: [{ 
                type: "text", 
                text: "📨 รับเรื่องเรียบร้อยครับ! ผมได้แจ้งเตือนเจ้าหน้าที่ให้ทราบแล้ว\n\nหากมีรายละเอียดเพิ่มเติมหรือต้องการแนบรูปภาพ สามารถพิมพ์ทิ้งไว้ได้เลยครับ เจ้าหน้าที่จะรีบมาตอบกลับโดยเร็วที่สุดครับ" 
              }],
            });

            // 2. ส่งแจ้งเตือนเข้ากลุ่ม Admin
            const targetGroupId = await getTargetGroupId();
            if (targetGroupId) {
              await lineClient.pushMessage({
                to: targetGroupId,
                messages: [{ 
                  type: "text", 
                  text: `⚠️ แจ้งเตือน: มีสมาชิกต้องการติดต่อแอดมิน!\n👤 User ID: ${userId || "ไม่ระบุ"}\n\n(แอดมินสามารถตรวจสอบและติดต่อกลับได้ครับ)` 
                }],
              });
            }
          } catch (error) {
            console.error("Contact Admin Notification Error:", error);
          }
        }
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(200).json({ status: "error_handled" });
  }
});

// ==========================================
// 🛠️ ADMIN ONLY: สั่งสร้าง Rich Menu
// ==========================================
router.post("/admin/setup-rich-menu", authenticateToken, isAdmin, async (req, res) => {
  try {
    // 1. นิยามโครงสร้างเมนู (3 ปุ่ม)
    const richMenuObject = {
      size: { width: 2500, height: 843 }, // แบบครึ่งหน้า (Half)
      selected: true,
      name: "Smart Event Menu",
      chatBarText: "เมนูหลัก",
      areas: [
        {
          bounds: { x: 0, y: 0, width: 833, height: 843 },
          action: { 
            type: "uri", 
            uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || "2010617243-H2wIcDTp"}` 
          }
        },
        {
          bounds: { x: 833, y: 0, width: 833, height: 843 },
          action: { type: "message", text: "เช็คงานวันนี้" }
        },
        {
          bounds: { x: 1666, y: 0, width: 834, height: 843 },
          action: { type: "message", text: "ติดต่อแอดมิน" }
        }
      ]
    };

    // 💡 ขั้นตอนของ LINE API: Create -> Upload Image -> Set Default
    // หมายเหตุ: การอัปโหลดรูปต้องทำผ่าน Multipart Form หรือ Stream 
    // ในที่นี้ผมจะทำโครงสร้างให้คุณไปกดยิงผ่าน Postman หรือสร้างปุ่มหน้าเว็บภายหลังครับ
    
    // หมายเหตุ: MessagingApiClient (v9+) ยังไม่รองรับการจัดการ Rich Menu โดยตรงแบบง่ายในตัวเดียว
    // ปกติจะใช้ axios หรือ fetch ยิงไปที่ https://api.line.me/v2/bot/richmenu
    
    res.json({ 
      message: "Infrastructure สำหรับ Rich Menu เตรียมพร้อมแล้ว!",
      instruction: "กรุณาส่งรูปภาพขนาด 2500x843 ไปที่ LINE API เพื่อเริ่มใช้งาน"
    });

  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการตั้งค่า Rich Menu" });
  }
});

// 0. เข้าสู่ระบบอัตโนมัติผ่าน LINE User ID (สำหรับผู้ใช้งานทั่วไปและแอดมินบน LIFF)
router.get("/liff/login-by-line", async (req, res) => {
  const { lineUserId } = req.query;
  if (!lineUserId) {
    return res.status(400).json({ success: false, message: "กรุณาระบุ LINE User ID" });
  }

  try {
    const result = await query("SELECT id, name, email, role, line_user_id FROM users WHERE line_user_id = $1", [lineUserId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "บัญชี LINE นี้ยังไม่ได้เชื่อมต่อกับระบบ" });
    }

    const user = result.rows[0];
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || "user_n",
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "user_n"
      }
    });
  } catch (error) {
    console.error("LIFF Auto Login Error:", error);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบอัตโนมัติ" });
  }
});

// 1. ตรวจสอบสิทธิ์ Admin / PR จาก LINE User ID
router.get("/liff/verify-admin", async (req, res) => {
  const { lineUserId } = req.query;
  if (!lineUserId) {
    return res.status(400).json({ isAdmin: false, message: "กรุณาระบุ LINE User ID" });
  }
  try {
    const result = await query("SELECT id, name, role FROM users WHERE line_user_id = $1 AND role IN ('admin', 'pr', 'user_pr')", [lineUserId]);
    if (result.rows.length > 0) {
      return res.json({ isAdmin: true, user: result.rows[0] });
    }
    return res.json({ isAdmin: false, message: "สิทธิ์การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบและฝ่ายประชาสัมพันธ์ที่เชื่อมต่อบัญชีแล้วเท่านั้น" });
  } catch (error) {
    res.status(500).json({ isAdmin: false, message: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์" });
  }
});

// 2. ดึงรายชื่อสมาชิกสำหรับหน้ารายการ LIFF (ต้องยืนยันตัวตนแอดมินหรือ PR)
router.get("/liff/users", async (req, res) => {
  const { adminLineUserId } = req.query;
  try {
    // ตรวจสอบว่าคนขอดึงข้อมูลคือ admin หรือ pr จริงไหม
    const adminCheck = await query("SELECT role FROM users WHERE line_user_id = $1 AND role IN ('admin', 'pr', 'user_pr')", [adminLineUserId]);
    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ message: "ปฏิเสธการเข้าถึง: สิทธิ์ไม่ถูกต้อง" });
    }

    const result = await query("SELECT id, name, role FROM users ORDER BY name ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลรายชื่อพนักงานได้" });
  }
});

// 3. มอบหมายงานใหม่ผ่าน LIFF (ต้องยืนยันตัวตนแอดมินหรือ PR)
router.post("/liff/assign", async (req, res) => {
  const { adminLineUserId, taskId, newUserId } = req.body;

  if (!adminLineUserId || !taskId || !newUserId) {
    return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
  }

  try {
    // 1. ตรวจสอบสิทธิ์แอดมินหรือ PR คนกด
    const adminCheck = await query("SELECT role FROM users WHERE line_user_id = $1 AND role IN ('admin', 'pr', 'user_pr')", [adminLineUserId]);
    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ message: "ปฏิเสธการเข้าถึง" });
    }

    // 2. ตรวจสอบงานที่จะมอบหมาย
    const checkTask = await query("SELECT * FROM tasks WHERE id = $1", [taskId]);
    if (checkTask.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลกิจกรรม" });
    }

    // 3. ตรวจสอบผู้รับผิดชอบคนใหม่
    const checkUser = await query("SELECT name, line_user_id FROM users WHERE id = $1", [newUserId]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลพนักงานที่จะรับมอบหมาย" });
    }

    const targetUserName = checkUser.rows[0].name;
    const targetLineUserId = checkUser.rows[0].line_user_id;
    const oldTaskTitle = checkTask.rows[0].title;

    // 4. บันทึกการมอบหมายลงฐานข้อมูล
    await query(
      `UPDATE tasks 
       SET user_id = $1, chairman = $2 
       WHERE id = $3`,
      [newUserId, targetUserName, taskId]
    );

    // 5. ส่ง LINE แจ้งเตือนไปยังพนักงานคนใหม่
    try {
      const assignMessage = `🎖️ คุณได้รับมอบหมายงานใหม่ผ่าน LINE!\n📝 เรื่อง: ${oldTaskTitle}\n🚪 สถานที่: ${checkTask.rows[0].room}\n⏱️ เวลา: ${checkTask.rows[0].start_time ? checkTask.rows[0].start_time.slice(0, 5) : "08:30"} - ${checkTask.rows[0].end_time ? checkTask.rows[0].end_time.slice(0, 5) : "11:30"} น.\n(งานนี้ปรากฏอยู่บนแดชบอร์ดของคุณเรียบร้อยแล้วครับ)`;
      
      if (targetLineUserId) {
        await lineClient.pushMessage({
          to: targetLineUserId,
          messages: [{ type: "text", text: assignMessage }],
        });
      } else {
        // หากคนรับงานไม่มี LINE ให้พ่นบอกในกลุ่มแอดมินส่วนกลาง
        const targetGroupId = await getTargetGroupId();
        await lineClient.pushMessage({
          to: targetGroupId,
          messages: [{ type: "text", text: `📢 กิจกรรม "${oldTaskTitle}" ถูกมอบหมายให้คุณ ${targetUserName} แล้ว\n(หมายเหตุ: พนักงานยังไม่ได้เชื่อมต่อไลน์ส่วนตัว)` }],
        });
      }
    } catch (lineErr) {
      console.error("LIFF assign LINE notify error:", lineErr);
    }

    res.json({ message: "มอบหมายงานสำเร็จ!" });
  } catch (error) {
    console.error("LIFF Assign API Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการมอบหมายงาน" });
  }
});

export default router;
