# 📢 Smart Event CMTC

ระบบบริหารจัดการกิจกรรมและแจ้งเตือนประสานงานภายในองค์กร ผ่านหน้าเว็บไซต์และแอปพลิเคชัน LINE (LINE Messaging API & LIFF) พัฒนาขึ้นด้วยเทคโนโลยีสแต็กสมัยใหม่ มีความรวดเร็ว ปลอดภัย และเชื่อมต่อสื่อสารได้อย่างมีประสิทธิภาพ

---

## 🏛️ โครงสร้างสถาปัตยกรรม (System Architecture)

ระบบประกอบด้วย 3 บริการหลัก ทำงานร่วมกันแบบ Multi-container:

```mermaid
graph TD
    A[Next.js Frontend] <-->|Rest API| B[Express.js Backend]
    B <-->|Queries| C[PostgreSQL Database]
    B -->|Push Notification| D((LINE Platform))
    D -->|LINE Groups / DMs| E[Users / Admins]
```

* **Frontend (Next.js):** อยู่ในโฟลเดอร์ `/frontend` พัฒนาด้วย Next.js, TypeScript และ CSS จัดการฝั่งผู้ใช้ บันทึกฟอร์ม และหน้าแผงควบคุมระบบ
* **Backend (Express.js):** อยู่ในโฟลเดอร์ `/backend` พัฒนาด้วย Node.js และ Express.js ทำหน้าที่ควบคุมสิทธิ์ (JWT/Bcrypt), ประมวลผลตารางนัดหมาย, ตั้งเวลาส่งสรุปงาน (Cron Job) และเชื่อมต่อ LINE Messaging API
* **Database (PostgreSQL):** ใช้จัดเก็บข้อมูลสมาชิกและกิจกรรม

---

## ✨ ฟีเจอร์หลักของระบบ (Core Features)

1. **Dashboard & Calendar View:**
   * สลับมุมมองระหว่าง **"แผงงาน"** (ซ่อนงานเก่าที่ผ่านไปแล้วเกิน 1 วันอัตโนมัติ เพื่อการจัดการงานปัจจุบัน) และ **"ปฏิทิน"** (ดูงานย้อนหลังได้ทั้งหมด)
2. **LINE Group Notification (Flex Message):**
   * ส่งการ์ดรายละเอียดกิจกรรมที่มีรูปภาพ (Flex Message) เข้ากลุ่ม LINE ทันทีเมื่อผู้ใช้บันทึกกิจกรรมใหม่ พร้อมปุ่ม **"🎯 มอบหมายงาน"**
3. **LINE DM Notification (Personal Notification via LIFF):**
   * เมื่อแอดมินกดมอบหมายงานผ่านแอป LINE (LIFF) ระบบจะส่งข้อความแจ้งเตือนตรงเข้าแชท **LINE ส่วนตัวของพนักงาน** คนนั้นทันที
4. **Admin Member Management:**
   * ระบบปิดการสมัครสมาชิกสาธารณะเพื่อความปลอดภัย แอดมินสามารถลงทะเบียนและเลือกบทบาทสิทธิ์ (Role) ให้พนักงานคนอื่น ๆ ได้เองผ่านหน้าเว็บ
5. **Daily Morning Cron Job:**
   * ตั้งเวลาส่งข้อความสรุปกิจกรรมยามเช้าเข้ากลุ่ม LINE ทุกวันในเวลา **08:00 น.** อัตโนมัติ

---

## 🚀 วิธีการติดตั้งและรันในเครื่อง (Local Setup)

### สิ่งที่ต้องเตรียม (Prerequisites)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (แนะนำเพื่อให้รันง่ายในคำสั่งเดียว)
* หรือ [Node.js v20+](https://nodejs.org/) และ [PostgreSQL](https://www.postgresql.org/) หากต้องการรันแบบแยกฝั่งพัฒนา

---

### วิธีที่ 1: รันผ่าน Docker Compose (แนะนำ)
เปิด Terminal ที่โฟลเดอร์รากของโปรเจ็คแล้วรันคำสั่ง:

```bash
docker-compose up --build
```
ระบบจะเริ่มทำงาน:
* **Frontend:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:5000](http://localhost:5000)
* **PostgreSQL:** รันผ่านพอร์ต `5433` (สำหรับ pgAdmin ด้านนอก)

---

### วิธีที่ 2: รันแยกทีละส่วนสำหรับงานพัฒนา (Development Mode)

#### 1. ตั้งค่าฐานข้อมูลและหลังบ้าน (Backend)
1. เข้าไปที่โฟลเดอร์หลังบ้าน:
   ```bash
   cd backend
   ```
2. คัดลอกและสร้างไฟล์ `.env` พร้อมตั้งค่าตัวแปร:
   ```env
   DATABASE_URL="postgresql://myuser:mypassword@localhost:5433/mydatabase"
   JWT_SECRET="cmtc_smart_event_super_secret_key"
   LINE_CHANNEL_SECRET="รหัส_secret_ของคุณ"
   LINE_CHANNEL_ACCESS_TOKEN="รหัส_token_ของคุณ"
   ```
3. ติดตั้ง Dependencies และเริ่มรัน:
   ```bash
   npm install
   npm run dev
   ```

#### 2. ตั้งค่าหน้าบ้าน (Frontend)
1. เข้าไปที่โฟลเดอร์หน้าบ้าน:
   ```bash
   cd ../frontend
   ```
2. คัดลอกและสร้างไฟล์ `.env` พร้อมตั้งค่าตัวแปร:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000"
   NEXT_PUBLIC_LIFF_ID="2010617243-H2wIcDTp"
   ```
3. ติดตั้ง Dependencies และเริ่มรัน:
   ```bash
   npm install
   npm run dev
   ```

---

## 📱 วิธีการผูกบัญชี LINE สำหรับผู้ปฏิบัติงาน

1. สแกนแอดไลน์บอทของระบบเป็นเพื่อน (LINE OA)
2. พิมพ์ข้อความคำว่า **`id`** ในแชทไลน์เพื่อรับรหัส LINE User ID (ขึ้นต้นด้วยตัว `U`)
3. เข้าสู่ระบบผ่านหน้าเว็บหลัก -> คลิก **`🔗 เชื่อมต่อ LINE ส่วนตัว`**
4. เลือกกดปุ่ม **`🟢 เชื่อมต่ออัตโนมัติผ่านแอป LINE (LIFF)`** เพื่อผูกบัญชีทันที หรือ วางรหัสลงช่องกรอกมือแล้วกดยืนยัน
