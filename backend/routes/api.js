import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
// นำเข้าโมดูลเวอร์ชันใหม่ v9+
import { messagingApi } from "@line/bot-sdk";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

// รหัส Group ID ของคุณที่ดึงได้จาก Terminal
const TARGET_GROUP_ID = "C31512452c1c75cde66ee035e2ee0e621";

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
  const timeDisplay =
    startTime && endTime ? `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)} น.` : "ไม่ได้ระบุเวลา";

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
        // 1. Banner รูปภาพ (ถ้ามี)
        ...(bannerUrl ? [{
          type: "image",
          url: bannerUrl,
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

  try {
    let result;
    if (userRole === "admin" || userRole === "user_pr") {
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

    // 🟢 สเต็ปที่ 2: ทำการตอบกลับหาหน้าบ้านทันทีว่าสำเร็จ! (Next.js ได้รับตรงนี้ปุ๊บ จะเด้งป๊อปอัพสีเขียวหล่อ ๆ เลยครับ)
    res
      .status(201)
      .json({ message: "บันทึกกิจกรรมสำเร็จ", task: result.rows[0] });

    // 🟢 สเต็ปที่ 3: แอบยิง LINE แจ้งเตือนเยื้องหลังแบบเงียบ ๆ (จับแยกห้องขังเพื่อไม่ให้มาขัดขวางป๊อปอัพหน้าเว็บ)
    try {
      await lineClient.pushMessage({
        to: TARGET_GROUP_ID,
        messages: [
          createFlexNotification(
            category,
            date,
            title,
            chairman,
            room,
            startTime,
            endTime,
            description,
            bannerUrl,
            result.rows[0].id, // 💡 ส่งรหัส ID กิจกรรมไปสร้างปุ่มมอบหมายผ่าน LIFF
          ),
        ],
      });
    } catch (lineError) {
      // ถ้ารหัสไลน์พังหรือติด 401 ให้พ่นบ่นแค่ใน Logs หลังบ้านพอ หน้าเว็บจริงจะไม่ระเบิดแล้วครับน้า
      console.error(
        "⚠️ LINE Notification failed but data was saved safely:",
        lineError.message,
      );
    }
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
      await lineClient.pushMessage({
        to: TARGET_GROUP_ID,
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
          await lineClient.pushMessage({
            to: TARGET_GROUP_ID,
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

const { MessagingApiClient } = messagingApi;
const lineClient = new MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "dummy_token",
});

router.post("/webhook", async (req, res) => {
  try {
    const events = req.body.events;
    if (!events || events.length === 0)
      return res.status(200).json({ status: "ok" });
    for (let event of events) {
      // 1. จัดการข้อความที่พิมพ์มา (รวมถึงปุ่มจาก Rich Menu)
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text.trim().toLowerCase();
        const replyToken = event.replyToken;

        // เคส: เช็ค ID (ใช้ได้ทั้งในกลุ่มและส่วนตัว)
        if (userMessage === "id") {
          const idText = event.source.type === "group" 
            ? `ID กลุ่มของคุณคือ:\n${event.source.groupId}`
            : `ID ของคุณคือ:\n${event.source.userId}`;
          await lineClient.replyMessage({
            replyToken,
            messages: [{ type: "text", text: idText }],
          });
        }

        // เคส: "เช็คงานวันนี้" (ดึงจาก Rich Menu)
        if (userMessage === "เช็คงานวันนี้") {
          try {
            const todayStr = new Date().toISOString().split('T')[0];
            const result = await query(
              "SELECT * FROM tasks WHERE date = $1 ORDER BY start_time ASC",
              [todayStr]
            );

            if (result.rows.length === 0) {
              await lineClient.replyMessage({
                replyToken,
                messages: [{ type: "text", text: "📅 วันนี้ไม่มีกิจกรรมนัดหมายครับ!" }],
              });
            } else {
              // 🎨 สร้าง Flex Message สำหรับแต่ละกิจกรรม
              const bubbles = result.rows.map(task => {
                const flex = createFlexNotification(
                  task.category,
                  task.date.toISOString().split('T')[0],
                  task.title,
                  task.chairman,
                  task.room,
                  task.start_time.slice(0, 5),
                  task.end_time.slice(0, 5),
                  task.description,
                  task.banner_url
                );
                return flex.contents; // ดึงเฉพาะส่วน contents (bubble)
              });

              // ส่งแบบ Carousel ถ้ามีหลายงาน หรือ Bubble เดียวถ้ามีงานเดียว
              await lineClient.replyMessage({
                replyToken,
                messages: [
                  {
                    type: "flex",
                    altText: `📅 รายการกิจกรรมวันนี้ (${todayStr})`,
                    contents: bubbles.length > 1 
                      ? { type: "carousel", contents: bubbles }
                      : bubbles[0]
                  }
                ],
              });
            }
          } catch (error) {
            console.error("Webhook Check Task Error:", error);
          }
        }

        // 🆕 เคส: "ติดต่อแอดมิน" (ส่งทั้งหา User และเข้ากลุ่ม Admin)
        if (userMessage === "ติดต่อแอดมิน") {
          try {
            const userId = event.source.userId;
            
            // 1. ตอบกลับหา User (แบบที่ 1)
            await lineClient.replyMessage({
              replyToken,
              messages: [{ 
                type: "text", 
                text: "📨 รับเรื่องเรียบร้อยครับ! ผมได้แจ้งเตือนเจ้าหน้าที่ให้ทราบแล้ว\n\nหากมีรายละเอียดเพิ่มเติมหรือต้องการแนบรูปภาพ สามารถพิมพ์ทิ้งไว้ได้เลยครับ เจ้าหน้าที่จะรีบมาตอบกลับผ่านแชทนี้โดยเร็วที่สุดครับ" 
              }],
            });

            // 2. ส่งแจ้งเตือนเข้ากลุ่ม Admin (แบบที่ 2)
            await lineClient.pushMessage({
              to: TARGET_GROUP_ID,
              messages: [{ 
                type: "text", 
                text: `⚠️ แจ้งเตือน: มีสมาชิกต้องการติดต่อแอดมิน!\n👤 User ID: ${userId}\n\n(แอดมินสามารถตอบกลับผ่านหน้าเว็บ Manager หรือระบบแชทได้เลยครับ)` 
              }],
            });
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

// 1. ตรวจสอบสิทธิ์ Admin จาก LINE User ID
router.get("/liff/verify-admin", async (req, res) => {
  const { lineUserId } = req.query;
  if (!lineUserId) {
    return res.status(400).json({ isAdmin: false, message: "กรุณาระบุ LINE User ID" });
  }
  try {
    const result = await query("SELECT id, name, role FROM users WHERE line_user_id = $1 AND role = 'admin'", [lineUserId]);
    if (result.rows.length > 0) {
      return res.json({ isAdmin: true, user: result.rows[0] });
    }
    return res.json({ isAdmin: false, message: "สิทธิ์การเข้าถึงถูกปฏิเสธ: เฉพาะผู้ดูแลระบบที่เชื่อมต่อบัญชีแล้วเท่านั้น" });
  } catch (error) {
    res.status(500).json({ isAdmin: false, message: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์" });
  }
});

// 2. ดึงรายชื่อสมาชิกสำหรับหน้ารายการ LIFF (ต้องยืนยันตัวตนแอดมิน)
router.get("/liff/users", async (req, res) => {
  const { adminLineUserId } = req.query;
  try {
    // ตรวจสอบว่าคนขอดึงข้อมูลคือ admin จริงไหม
    const adminCheck = await query("SELECT role FROM users WHERE line_user_id = $1 AND role = 'admin'", [adminLineUserId]);
    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ message: "ปฏิเสธการเข้าถึง: สิทธิ์ไม่ถูกต้อง" });
    }

    const result = await query("SELECT id, name, role FROM users ORDER BY name ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลรายชื่อพนักงานได้" });
  }
});

// 3. มอบหมายงานใหม่ผ่าน LIFF (ต้องยืนยันตัวตนแอดมิน)
router.post("/liff/assign", async (req, res) => {
  const { adminLineUserId, taskId, newUserId } = req.body;

  if (!adminLineUserId || !taskId || !newUserId) {
    return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
  }

  try {
    // 1. ตรวจสอบสิทธิ์แอดมินคนกด
    const adminCheck = await query("SELECT role FROM users WHERE line_user_id = $1 AND role = 'admin'", [adminLineUserId]);
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
        await lineClient.pushMessage({
          to: TARGET_GROUP_ID,
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
