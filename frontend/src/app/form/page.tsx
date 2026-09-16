"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Folder,
  Calendar,
  Type,
  User,
  MapPin,
  Clock,
  FileText,
  Image as ImageIcon, // 💡 เพิ่มไอคอนรูปภาพ
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function FormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    category: "การเงิน",
    date: "",
    title: "",
    chairman: "",
    room: "",
    description: "",
    bannerUrl: "", // 💡 เพิ่มสเตทสำหรับ Banner URL
  });
  const [startTime, setStartTime] = useState("08:30");
  const [endTime, setEndTime] = useState("11:30");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://smart-event-backend-fua9.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");
    if (!token || !userJson) {
      router.push("/");
      return;
    }
    const user = JSON.parse(userJson);
    setUserName(user.name);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    const dataToSend = { ...formData, startTime, endTime };

    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "บันทึกข้อมูลไม่สำเร็จ");

      Swal.fire({
        icon: "success",
        title: "บันทึกเรียบร้อย!",
        text: "กิจกรรมถูกโพสต์และแจ้งเตือนเข้ากลุ่ม LINE แล้ว",
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: "rounded-2xl" },
      }).then(() => {
        router.push("/dashboard");
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        text: err.message,
        confirmButtonColor: "#fff",
      });
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white min-h-screen flex flex-col justify-between selection:bg-red-100 selection:text-red-900">
      <Navbar userName={userName} onLogout={handleLogout} />

      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 lg:p-8 grow flex flex-col justify-center">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-600 transition-all uppercase tracking-wider group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            กลับไปหน้าแดชบอร์ด
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
            แบบฟอร์มบันทึกกิจกรรม
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 sm:p-10 rounded-2xl border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.015)]"
        >
          <form onSubmit={handleSubmit} className="space-y-5 bg-white">
            {/* หมวดหมู่ */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Folder className="h-3.5 w-3.5 text-gray-300" /> หมวดหมู่งาน
              </label>
              <select
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white text-gray-900 transition-all text-sm"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="การเงิน">การเงิน</option>
                <option value="การตลาด">การตลาด</option>
                <option value="ประชาสัมพันธ์">ประชาสัมพันธ์</option>
                <option value="กิจกรรม">กิจกรรม</option>
                <option value="การเรียนการสอน">การเรียนการสอน</option>
                <option value="ด่วน">ด่วน / กิจกรรมเร่งด่วน</option>
              </select>
            </div>

            {/* วันและเวลา */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5 text-gray-300" />{" "}
                  วันที่กิจกรรม
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white text-gray-900 transition-all text-sm"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <Clock className="h-3.5 w-3.5 text-gray-300" /> เวลาเริ่ม
                </label>
                {/* 💡 ครอบดักแกะค่า e.target.value ส่งไปให้สเตท */}
                <input
                  type="time"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white text-gray-900 transition-all text-sm"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <Clock className="h-3.5 w-3.5 text-gray-300" /> เวลาสิ้นสุด
                </label>
                {/* 💡 ครอบดักแกะค่า e.target.value เหมือนกัน */}
                <input
                  type="time"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white text-gray-900 transition-all text-sm"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* เรื่อง */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Type className="h-3.5 w-3.5 text-gray-300" /> หัวข้อ/เรื่อง
              </label>
              <input
                type="text"
                required
                placeholder="ระบุวาระการประชุม หรือชื่อกิจกรรมหลัก"
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white text-gray-900 transition-all text-sm"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            {/* ผู้รับผิดชอบ */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <User className="h-3.5 w-3.5 text-gray-300" /> ผู้รับผิดชอบ
              </label>
              <input
                type="text"
                required
                placeholder="ระบุชื่อผู้รับผิดชอบหลัก หรือหน่วยงาน"
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white text-gray-900 transition-all text-sm"
                value={formData.chairman}
                onChange={(e) =>
                  setFormData({ ...formData, chairman: e.target.value })
                }
              />
            </div>

            {/* المكان */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5 text-gray-300" /> สถานที่
              </label>
              <input
                type="text"
                required
                placeholder="เช่น อาคารวิทยบริการ ชั้น 3"
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white text-gray-900 transition-all text-sm"
                value={formData.room}
                onChange={(e) =>
                  setFormData({ ...formData, room: e.target.value })
                }
              />
            </div>

            {/* 📝 ช่องพิมพ์กรอกรายละเอียดงานแบบพิมพ์อิสระ */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <FileText className="h-3.5 w-3.5 text-gray-300" />{" "}
                รายละเอียดเพิ่มเติม (ระบุสิ่งที่ต้องทำ)
              </label>
              <textarea
                rows={3}
                placeholder="ระบุสิ่งที่สมาชิกต้องเตรียมตัว หรือรายละเอียดวาระงานอย่างละเอียด..."
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white text-gray-900 transition-all text-sm resize-none"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* 🖼️ ช่องกรอก Banner URL */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <ImageIcon className="h-3.5 w-3.5 text-gray-300" /> รูปภาพ Banner
                (URL - เลือกเติมได้)
              </label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white text-gray-900 transition-all text-sm"
                value={formData.bannerUrl}
                onChange={(e) =>
                  setFormData({ ...formData, bannerUrl: e.target.value })
                }
              />
              <p className="text-[10px] text-gray-400">
                * รองรับลิงก์รูปภาพจากภายนอก เช่น Google Drive (ที่แชร์สาธารณะ)
                หรือเว็บฝากรูป
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-medium rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2 mt-6"
            >
              <Send className="h-4 w-4" />
              {loading
                ? "กำลังทำการบันทึก..."
                : "โพสต์กิจกรรมและส่งแจ้งเตือน LINE"}
            </button>
          </form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
