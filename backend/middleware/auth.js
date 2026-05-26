import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // ดึง Token ออกมาจากรูปแบบ "Bearer <TOKEN>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'ยังไม่ได้เข้าสู่ระบบ (Token missing)' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token หมดอายุ หรือไม่ถูกต้อง' });
    }
    // ฝากข้อมูล user (id, email) ไว้กับ req เพื่อไปใช้ต่อใน Controller อื่นๆ
    req.user = user;
    next();
  });
};

// 💡 ฟังก์ชันตรวจสอบว่าเป็น Admin หรือไม่
export const isAdmin = (req, res, next) => {
  // req.user จะได้มาจากตอนที่คัดกรอง JWT Token สเต็ปแรกเรียบร้อยแล้ว
  if (req.user && req.user.role === 'admin') {
    next(); // สิทธิ์ถูกต้อง ปล่อยให้ผ่านไปทำหน้าที่ต่อได้
  } else {
    return res.status(403).json({ message: "ปฏิเสธการเข้าถึง: สำหรับผู้ดูแลระบบเท่านั้น" });
  }
};