# 🤖 Gemini AI Developer Guide - Smart Event CMTC

คู่มือเล่มนี้จัดทำขึ้นสำหรับนักพัฒนา (Developer) และ AI Assistants (เช่น Gemini) เพื่ออธิบายโครงสร้างระบบ, สถาปัตยกรรม, ข้อมูลฐานข้อมูล (Database Schema), API Endpoints และแนวทางปฏิบัติในการแก้ไข/พัฒนาต่อยอดระบบ **Smart Event CMTC**

---

## 🏗️ ภาพรวมเทคโนโลยีและสถาปัตยกรรม (Tech Stack & Architecture)

ระบบเป็นแบบ Multi-container แยกส่วนการทำงานชัดเจน:

*   **Frontend**: Next.js 14+ (App Router), TypeScript, TailwindCSS
*   **Backend**: Node.js, Express.js, TypeScript (หรือ ES Modules)
*   **Database**: PostgreSQL
*   **LINE Platform**: LINE Messaging API (Flex Messages) และ LINE Front-end Framework (LIFF)

---

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema)

*ข้อมูลอ้างอิงและตารางที่ใช้ในระบบ:*

### 1. ตารางผู้ใช้ (`users`)
เก็บข้อมูลผู้ใช้งานและผู้ปฏิบัติงาน
*   `id` (Serial, Primary Key)
*   `username` (Varchar, Unique) - ใช้ล็อกอิน
*   `password` (Text) - เข้ารหัสผ่าน Bcrypt
*   `name` (Varchar) - ชื่อ-นามสกุลจริง
*   `role` (Varchar) - บทบาทสิทธิ์ ได้แก่ `admin` หรือ `staff`
*   `line_user_id` (Varchar, Unique, Nullable) - ไอดีไลน์ของผู้ใช้สำหรับส่งข้อความส่วนตัว (Direct Message)

### 2. ตารางกิจกรรม (`events`)
เก็บข้อมูลนัดหมายและรายละเอียดกิจกรรม
*   `id` (Serial, Primary Key)
*   `title` (Varchar) - หัวขวข้อ/ชื่อกิจกรรม
*   `description` (Text, Nullable) - วาระงาน/รายละเอียด
*   `category` (Varchar) - ประเภทกิจกรรม (`urgent`, `education`, `reception`, `official`, `general`)
*   `event_date` (Date) - วันที่จัดกิจกรรม
*   `start_time` (Time) - เวลาเริ่มต้น
*   `end_time` (Time, Nullable) - เวลาสิ้นสุด
*   `location` (Varchar) - สถานที่จัดกิจกรรม
*   `created_by` (Integer, Foreign Key -> `users.id`) - ผู้บันทึกกิจกรรม
*   `assigned_to` (Integer, Foreign Key -> `users.id`, Nullable) - ผู้ปฏิบัติงานที่ได้รับมอบหมาย
*   `status` (Varchar) - สถานะงาน (`pending`, `completed`)
*   `created_at` (Timestamp)

---

## 🔌 API Endpoints หลัก (Backend API)

หลังบ้านรันอยู่ที่พอร์ต `5000` (เป็นค่าเริ่มต้น) โดยมี Endpoint สำคัญดังนี้:

### 🔐 Authentication (`/api/auth`)
*   `POST /api/auth/register` - ลงทะเบียนผู้ใช้ใหม่ (เฉพาะแอดมิน)
*   `POST /api/auth/login` - ล็อกอินแบบธรรมดา (ใช้ Username/Password) -> คืนค่า JWT Token

### 📅 Events (`/api/events`)
*   `GET /api/events` - ดึงรายการกิจกรรมทั้งหมด
*   `POST /api/events` - สร้างกิจกรรมใหม่ (พร้อมส่ง Flex Message เข้า LINE Group อัตโนมัติ)
*   `PUT /api/events/:id` - แก้ไขรายละเอียดกิจกรรม
*   `DELETE /api/events/:id` - ลบกิจกรรม
*   `POST /api/events/:id/assign` - มอบหมายงานให้กับพนักงาน (พร้อมส่ง Direct Message เข้าไลน์ส่วนตัวผ่าน LIFF)

### 🟢 LINE & LIFF (`/api/liff` / `/api/line`)
*   `POST /api/liff/login-by-line` - ตรวจสอบ LINE User ID ที่เรียกมาจาก LIFF เพื่อสร้าง JWT Token และ Auto-Login
*   `POST /api/line/webhook` - รับ Webhook Event จาก LINE Platform (เช่น คำว่า `id`)
*   `POST /api/liff/link-account` - เชื่อมโยง LINE User ID เข้ากับบัญชีผู้ใช้
*   `POST /api/liff/unlink-account` - ยกเลิกการผูกบัญชี LINE User ID

---

## 🎨 ธีมและหมวดหมู่กิจกรรม (Event Themes)

การส่ง LINE Flex Message จะถูกจัดรูปแบบสีและไอคอนตามหมวดหมู่กิจกรรม (`category`) ดังนี้:

| Category | Label | สีหลัก (Hex) | ไอคอน |
| :--- | :--- | :--- | :--- |
| `urgent` | ด่วน / ด่วนที่สุด | `#E11D48` | `🚨` |
| `education` | การเรียนการสอน | `#2563EB` | `🏫` |
| `reception` | งานรับรอง / อาหาร | `#EA580C` | `🍽️` |
| `official` | งานราชการ / พิธีการ | `#4B5563` | `🏛️` |
| `general` | กิจกรรมทั่วไป | `#059669` | `📅` |

---

## 🤖 คำแนะนำสำหรับ Gemini AI Assistant

หากคุณ (Gemini) ต้องทำการแก้ไขโค้ดหรือตรวจสอบบักในโปรเจกต์นี้ ให้ปฏิบัติตามแนวทางดังนี้:

### 1. เมื่อแก้ไขระบบ Flex Message:
*   ตรวจสอบว่าโค้ดส่งข้อความใน `backend/` มีการเช็คความปลอดภัยของฟิลด์ `description` (หากไม่มี ให้ทำการซ่อน Bubble หรือ Text Box นั้นออกไปเพื่อไม่ให้เกิดกล่องว่างบนไลน์)
*   สไตล์สีของปุ่มใน Footer ของการ์ด Flex Message จะต้องมีสีสอดคล้องกับ `category` ของกิจกรรมนั้น ๆ

### 2. เมื่อทำงานกับหน้าต่าง LIFF (`frontend/src/app/liff/` หรือหน้าเว็บที่เกี่ยวข้อง):
*   ให้ตรวจสอบขั้นตอนการล็อกอินแบบอัตโนมัติ (Auto-login) โดยดึง `userId` จาก `liff.getProfile()` ส่งไปที่ API `/liff/login-by-line` หากสำเร็จให้เปลี่ยนหน้าไปที่หน้าแสดงตารางงานทันที
*   ห้ามให้มีบัญชีที่ใช้ LINE ID ซ้ำซ้อนกันในระบบ (De-duplication) หากมีการผูก LINE ID ใหม่ ให้เขียน Logic ปลดการเชื่อมโยงของไอดีนั้นกับบัญชีอื่นออกก่อนเสมอ

### 3. โครงสร้างโฟลเดอร์หลัก:
*   `backend/src/` - ซอร์สโค้ดฝั่งหลังบ้าน (Express, Database config, Controllers, LINE helper)
*   `frontend/src/` - ซอร์สโค้ดฝั่งหน้าบ้าน (Next.js components, Hooks, LIFF integration, CSS/Tailwind)

---

*สร้างขึ้นเมื่อ: 2026-08-18 โดย Antigravity Developer Tool*
