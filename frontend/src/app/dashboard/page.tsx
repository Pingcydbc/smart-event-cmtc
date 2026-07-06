"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Trash2,
  ShieldCheck,
  Folder,
  Eye,
  Edit3,
  LayoutGrid,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [userName, setUserName] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // สเตทสำหรับระบบสลับมุมมอง (list = แบบการ์ดเดิม, calendar = แบบปฏิทินใหม่)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // สเตทสำหรับปฏิทินคำนวณวันเวลา (เริ่มต้นที่เดือนและปีปัจจุบัน)
  const [currentDate, setCurrentDate] = useState(new Date());

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
    setCurrentUserId(user.id);
    setCurrentUserRole(user.role || "user_n");
    fetchEvents(token);
    fetchProfile(token);
  }, [router]);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLineUserId(data.line_user_id);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    }
  };

  const fetchEvents = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Fetch tasks error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // 🔗 ฟังก์ชันเชื่อมต่อไลน์ส่วนตัว
  const handleLinkLine = () => {
    const token = localStorage.getItem("token");
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "2006734185-dummy";
    const liffUrl = `https://liff.line.me/${liffId}`;

    Swal.fire({
      title: "🔗 เชื่อมต่อ LINE ส่วนตัว",
      html: `
        <div class="text-left space-y-4 pt-3 text-sm bg-white">
          <div class="text-center pb-2">
            <a href="${liffUrl}" target="_blank" class="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm decoration-none">
              🟢 เชื่อมต่ออัตโนมัติผ่านแอป LINE (LIFF)
            </a>
          </div>

          <div class="relative flex py-2 items-center">
            <div class="flex-grow border-t border-gray-100"></div>
            <span class="flex-shrink mx-4 text-gray-400 text-xs font-semibold uppercase">หรือ กรอกรหัสด้วยตัวเอง</span>
            <div class="flex-grow border-t border-gray-100"></div>
          </div>

          <div class="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs text-gray-600">
            <strong>📋 ขั้นตอนการรับรหัสด้วยตัวเอง:</strong>
            <ol class="list-decimal list-inside mt-1.5 space-y-1">
              <li>แอดไลน์ Official Account ของระบบเป็นเพื่อน</li>
              <li>พิมพ์ส่งข้อความคำว่า <span class="font-bold text-red-600 font-mono">id</span> ในแชทไลน์</li>
              <li>คัดลอกรหัสประจำตัว (ขึ้นต้นด้วยตัว U) มาวางด้านล่างนี้</li>
            </ol>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">วางรหัส LINE User ID ของคุณ</label>
            <input id="swal-line-id" type="text" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500 font-mono" placeholder="U1234567890abcdef..." defaultValue="${lineUserId || ""}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#4b5563",
      confirmButtonText: "เชื่อมต่อบัญชีแบบระบุมือ",
      cancelButtonText: "ยกเลิก",
      customClass: {
        popup: "rounded-2xl",
        cancelButton:
          "border border-gray-200 text-gray-700 font-medium px-4 py-2",
      },
      preConfirm: () => {
        const idVal = (document.getElementById("swal-line-id") as HTMLInputElement).value.trim();
        if (!idVal) {
          Swal.showValidationMessage("กรุณากรอก LINE User ID");
          return false;
        }
        if (!idVal.startsWith("U") || idVal.length < 15) {
          Swal.showValidationMessage("รูปแบบ LINE User ID ไม่ถูกต้อง (ต้องขึ้นต้นด้วย U)");
          return false;
        }
        return idVal;
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const res = await fetch(`${API_URL}/api/auth/profile/line`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ lineUserId: result.value }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "เชื่อมต่อไม่สำเร็จ");

          Swal.fire({
            icon: "success",
            title: "เชื่อมต่อบัญชี LINE สำเร็จ!",
            text: "ระบบจะแจ้งเตือนงานใหม่เข้า LINE ส่วนตัวของคุณ",
            timer: 2000,
            showConfirmButton: false,
          });
          setLineUserId(result.value);
        } catch (err: any) {
          Swal.fire({
            icon: "error",
            title: "ล้มเหลว",
            text: err.message,
            confirmButtonColor: "#dc2626",
          });
        }
      }
    });
  };

  // 🔗 ฟังก์ชันยกเลิกเชื่อมต่อไลน์ส่วนตัว
  const handleUnlinkLine = () => {
    const token = localStorage.getItem("token");

    Swal.fire({
      title: "ยืนยันการยกเลิกเชื่อมต่อ?",
      text: "คุณจะไม่ได้รับการแจ้งเตือนงานใหม่เข้า LINE ส่วนตัวอีกต่อไป",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#4b5563",
      confirmButtonText: "ใช่, ยกเลิกเชื่อมต่อ",
      cancelButtonText: "ยกเลิก",
      customClass: {
        popup: "rounded-2xl",
        cancelButton:
          "border border-gray-200 text-gray-700 font-medium px-4 py-2",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_URL}/api/auth/profile/line`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ lineUserId: null }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "ยกเลิกการเชื่อมต่อไม่สำเร็จ");

          Swal.fire({
            icon: "success",
            title: "ยกเลิกเชื่อมต่อสำเร็จ!",
            text: "บัญชี LINE ของคุณถูกตัดการเชื่อมต่อแล้ว",
            timer: 2000,
            showConfirmButton: false,
          });
          setLineUserId(null);
        } catch (err: any) {
          Swal.fire({
            icon: "error",
            title: "ล้มเหลว",
            text: err.message,
            confirmButtonColor: "#dc2626",
          });
        }
      }
    });
  };

  // 👁️ ฟังก์ชันกดดูรายละเอียดงานแบบ Pop-up
  const handleViewDetails = (event: any) => {
    const formattedDate = new Date(event.date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStart = event.start_time
      ? event.start_time.substring(0, 5)
      : "08:30";
    const timeEnd = event.end_time ? event.end_time.substring(0, 5) : "11:30";

    Swal.fire({
      title: `<span class="text-gray-900 font-bold text-xl border-b border-gray-100 pb-2 block">📄 รายละเอียดกิจกรรม</span>`,
      html: `
        <div class="text-left space-y-3 text-sm text-gray-600 pt-3 bg-white">
          ${
            event.banner_url
              ? `<div class="mb-3 overflow-hidden rounded-xl border border-gray-100">
                  <img src="${event.banner_url}" class="w-full h-auto object-cover max-h-48" alt="Banner" onerror="this.style.display='none'" />
                 </div>`
              : ""
          }
          <div class="mb-2"><span class="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs uppercase">${event.category}</span></div>
          <div class="text-base font-bold text-gray-900 mb-2">${event.title}</div>
          
          <div class="bg-gray-50 p-3 rounded-xl text-xs border border-gray-100 whitespace-pre-wrap mb-3">
            <strong class="text-gray-900">📝 วาระงาน / รายละเอียดสิ่งที่ต้องทำ:</strong><br/>
            <p class="mt-1 text-gray-600 font-medium">${event.description || "ไม่มีรายละเอียดเพิ่มเติมสำหรับกิจกรรมนี้ครับน้า"}</p>
          </div>

          <div class="grid grid-cols-1 gap-1 border-t border-gray-50 pt-3">
            <div><strong>📅 วันที่จัดงาน:</strong> ${formattedDate}</div>
            <div><strong>⏱️ ช่วงเวลา:</strong> <span class="text-red-600 font-bold">${timeStart} - ${timeEnd} น.</span></div>
            <div><strong>👤 ผู้รับผิดชอบ:</strong> ${event.chairman}</div>
            <div><strong>🚪 สถานที่จัด:</strong> ${event.room}</div>
            <div class="text-xs text-gray-400 pt-2 border-t border-gray-50">ผู้โพสต์ระบบ: ${event.creator_name || "ไม่ระบุ"}</div>
          </div>
        </div>
      `,
      confirmButtonText: "ปิดหน้าต่าง",
      confirmButtonColor: "#4b5563",
      customClass: { popup: "rounded-2xl" },
    });
  };

  // ✏️ ฟังก์ชันแก้ไขงานใน Pop-up
  const handleEdit = async (event: any) => {
    const token = localStorage.getItem("token");
    const timeStart = event.start_time
      ? event.start_time.substring(0, 5)
      : "08:30";
    const timeEnd = event.end_time ? event.end_time.substring(0, 5) : "11:30";
    const rawDate = new Date(event.date).toISOString().split("T")[0];

    Swal.fire({
      title: "✏️ แก้ไขข้อมูลกิจกรรม",
      html: `
        <div class="text-left space-y-3 pt-3 text-sm bg-white" id="edit-form">
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">หมวดหมู่งาน</label>
            <select id="swal-category" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500">
              <option value="การเงิน" ${event.category === "การเงิน" ? "selected" : ""}>การเงิน</option>
              <option value="การตลาด" ${event.category === "การตลาด" ? "selected" : ""}>การตลาด</option>
              <option value="ประชาสัมพันธ์" ${event.category === "ประชาสัมพันธ์" ? "selected" : ""}>ประชาสัมพันธ์</option>
              <option value="กิจกรรม" ${event.category === "กิจกรรม" ? "selected" : ""}>กิจกรรม</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">หัวข้อ/เรื่อง</label>
            <input id="swal-title" type="text" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500" value="${event.title}">
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">วันที่</label>
              <input id="swal-date" type="date" class="w-full px-2 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500" value="${rawDate}">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">เวลาเริ่ม</label>
              <input id="swal-start" type="time" class="w-full px-2 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500" value="${timeStart}">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">เวลาสิ้นสุด</label>
              <input id="swal-end" type="time" class="w-full px-2 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500" value="${timeEnd}">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">ผู้รับผิดชอบ</label>
            <input id="swal-chairman" type="text" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500" value="${event.chairman}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">สถานที่</label>
            <input id="swal-room" type="text" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500" value="${event.room}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea id="swal-description" rows="3" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500 resize-none">${event.description || ""}</textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#4b5563",
      confirmButtonText: "บันทึกการแก้ไข",
      cancelButtonText: "ยกเลิก",
      customClass: {
        popup: "rounded-2xl",
        cancelButton:
          "border border-gray-200 text-gray-700 font-medium px-4 py-2",
      },
      preConfirm: () => {
        return {
          category: (
            document.getElementById("swal-category") as HTMLSelectElement
          ).value,
          title: (document.getElementById("swal-title") as HTMLInputElement)
            .value,
          date: (document.getElementById("swal-date") as HTMLInputElement)
            .value,
          startTime: (document.getElementById("swal-start") as HTMLInputElement)
            .value,
          endTime: (document.getElementById("swal-end") as HTMLInputElement)
            .value,
          chairman: (
            document.getElementById("swal-chairman") as HTMLInputElement
          ).value,
          room: (document.getElementById("swal-room") as HTMLInputElement)
            .value,
          description: (
            document.getElementById("swal-description") as HTMLTextAreaElement
          ).value,
        };
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const res = await fetch(`${API_URL}/api/tasks/${event.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(result.value),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "ไม่สามารถอัปเดตงานได้");

          Swal.fire({
            icon: "success",
            title: "อัปเดตเรียบร้อย!",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchEvents(token!);
        } catch (err: any) {
          Swal.fire({
            icon: "error",
            title: "ล้มเหลว",
            text: err.message,
            confirmButtonColor: "#dc2626",
          });
        }
      }
    });
  };

  const handleDelete = async (id: number, title: string) => {
    const token = localStorage.getItem("token");
    Swal.fire({
      title: "ยืนยันการลบกิจกรรม?",
      text: `คุณต้องการลบกิจกรรมเรื่อง "${title}" ใช่ไหม?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#4b5563",
      confirmButtonText: "ใช่, ลบทันที",
      cancelButtonText: "ยกเลิก",
      customClass: {
        popup: "rounded-2xl",
        cancelButton:
          "border border-gray-200 text-gray-700 font-medium px-4 py-2",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_URL}/api/tasks/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "ลบข้อมูลไม่สำเร็จ");
          Swal.fire({
            icon: "success",
            title: "ลบสำเร็จ!",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchEvents(token!);
        } catch (err: any) {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: err.message,
            confirmButtonColor: "#dc2626",
          });
        }
      }
    });
  };

  // =========================================================
  // 🧠 ส่วนคำนวณปฏิทิน CUSTOM VANILLA
  // =========================================================
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthsTh = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const daysOfWeekTh = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "การเงิน":
        return "bg-emerald-500 text-white";
      case "การตลาด":
        return "bg-amber-500 text-white";
      case "ประชาสัมพันธ์":
        return "bg-sky-500 text-white";
      case "กิจกรรม":
        return "bg-rose-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const calendarCells = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(
      <div
        key={`empty-${i}`}
        className="min-h-25 border border-gray-50 bg-gray-50/20 rounded-xl"
      ></div>,
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentCellDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const dayEvents = events.filter((event: any) => {
      // 💡 [แก้ไขตรรกะแล้ว] แกะ ปี-เดือน-วัน ตรง ๆ ป้องกันปัญหา Timezone เบี่ยงข้ามวัน
      const d = new Date(event.date);
      const eventDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return eventDateStr === currentCellDateStr;
    });

    calendarCells.push(
      <div
        key={`day-${day}`}
        className="min-h-25 border border-gray-100 p-1.5 rounded-xl bg-white flex flex-col justify-between hover:border-gray-200 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.005)]"
      >
        <span className="text-xs font-bold text-gray-400 ml-1 mt-0.5">
          {day}
        </span>

        <div className="space-y-1 overflow-y-auto max-h-18.75 scrollbar-none mt-1 grow">
          {dayEvents.map((event: any) => (
            <div
              key={event.id}
              onClick={() => handleViewDetails(event)}
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate cursor-pointer shadow-sm active:scale-95 transition-transform ${getCategoryColor(event.category)}`}
              title={event.title}
            >
              {event.title}
            </div>
          ))}
        </div>
      </div>,
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-500 font-medium text-sm">
        กำลังโหลดข้อมูลแดชบอร์ด...
      </div>
    );
  }

  // กรองเฉพาะกิจกรรมที่ยังไม่ผ่านไปเกิน 1 วัน สำหรับการแสดงผลแบบการ์ดรายการ (List View)
  const activeListEvents = events.filter((event: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - eventDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays < 1; // แสดงเฉพาะงานวันนี้และอนาคต (ซ่อนงานที่ผ่านไปแล้ว 1 วันขึ้นไป)
  });

  return (
    <div className="w-full bg-white min-h-screen flex flex-col justify-between selection:bg-red-100 selection:text-red-900">
      <Navbar userName={userName} onLogout={handleLogout} />

      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 grow">
        {/* ส่วนหัวแดชบอร์ด */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5 mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              รายการกิจกรรมทั้งหมด
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5 flex flex-wrap items-center gap-2">
              ระดับสิทธิ์ใช้งานปัจจุบันของคุณ:{" "}
              <span className="font-bold text-red-600 uppercase bg-red-50 px-2 py-0.5 rounded text-[11px]">
                {currentUserRole}
              </span>
              <span className="text-gray-300">|</span>
              {lineUserId ? (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    🟢 เชื่อมต่อ LINE แล้ว
                  </span>
                  <button
                    onClick={handleUnlinkLine}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 px-2 py-0.5 rounded border border-gray-200/40 transition-all cursor-pointer"
                  >
                    ยกเลิกเชื่อมต่อ
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLinkLine}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200/40 transition-all cursor-pointer"
                >
                  🔗 เชื่อมต่อ LINE ส่วนตัว
                </button>
              )}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* แผงปุ่มสำหรับกดสลับโหมดมุมมอง */}
            <div className="flex bg-gray-50 p-1 border border-gray-100 rounded-xl mr-2 text-xs">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${viewMode === "list" ? "bg-white text-red-600 shadow-sm" : "text-gray-400 hover:text-gray-900"}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> แผงงาน
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${viewMode === "calendar" ? "bg-white text-red-600 shadow-sm" : "text-gray-400 hover:text-gray-900"}`}
              >
                <CalendarDays className="h-3.5 w-3.5" /> ปฏิทิน
              </button>
            </div>

            {currentUserRole === "admin" && (
              <Link
                href="/admin"
                className="py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
              >
                <ShieldCheck className="h-4 w-4 text-red-500" />
                จัดการระบบหลังบ้าน
              </Link>
            )}

            <Link
              href="/form"
              className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm shadow-red-600/10 active:scale-[0.98]"
            >
              + บันทึกกิจกรรมใหม่
            </Link>
          </div>
        </div>

        {/* 📋 โหมดที่ 1: แบบการ์ดเดี่ยว (List View เดิม) */}
        {viewMode === "list" && (
          <div>
            {activeListEvents.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl text-gray-400 font-medium text-sm">
                ยังไม่มีกำหนดการกิจกรรมในขณะนี้
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activeListEvents.map((event: any, index: number) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between hover:border-gray-200/80 transition-all relative group overflow-hidden"
                  >
                    {/* 💡 แสดง Banner รูปภาพที่ด้านบนสุดของการ์ด (ถ้ามี) */}
                    {event.banner_url && (
                      <div className="-mx-6 -mt-6 mb-4 h-32 overflow-hidden border-b border-gray-50">
                        <img
                          src={event.banner_url}
                          alt="Event Banner"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => (e.currentTarget.parentElement!.style.display = 'none')}
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-red-50 text-red-600 uppercase tracking-wider">
                          <Folder className="h-3 w-3" /> {event.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                          <Calendar className="h-3.5 w-3.5 text-gray-300" />
                          {new Date(event.date).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-red-600 transition-colors">
                          {event.title}
                        </h3>

                        <div className="flex items-center gap-1 text-xs font-semibold text-red-500 mt-1.5 bg-red-50/40 w-fit px-2 py-0.5 rounded-md">
                          <Clock className="h-3.5 w-3.5" />
                          {event.start_time
                            ? event.start_time.substring(0, 5)
                            : "08:30"}{" "}
                          -{" "}
                          {event.end_time
                            ? event.end_time.substring(0, 5)
                            : "11:30"}{" "}
                          น.
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t border-gray-50 pt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-gray-300" />
                          <span className="font-medium text-gray-700">
                            ผู้รับผิดชอบ:
                          </span>{" "}
                          {event.chairman}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-gray-300" />
                          <span className="font-medium text-gray-700">
                            สถานที่:
                          </span>{" "}
                          {event.room}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-4 text-[11px] text-gray-400">
                      <div>ผู้โพสต์: {event.creator_name || "ไม่ระบุ"}</div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleViewDetails(event)}
                          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                          title="ดูรายละเอียดเพิ่มเติม"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {(currentUserId === event.user_id ||
                          currentUserRole === "admin") && (
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="แก้ไขกิจกรรม"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {(currentUserId === event.user_id ||
                          currentUserRole === "admin") && (
                          <button
                            onClick={() => handleDelete(event.id, event.title)}
                            className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="ลบกิจกรรมนี้"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            📅 โหมดที่ 2: ส่วนปฏิทินอัจฉริยะ (ปุ่มกดเลื่อนชัดเจน ขอบมน ไม่จมหาย)
            ========================================================= */}
        {viewMode === "calendar" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-white border border-gray-100 rounded-3xl p-4 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.015)]"
          >
            {/* 💡 แผงควบคุมเลื่อนเดือนหน้า-หลัง (อัปเกรดความชัดเจนตามรูปพิมพ์เขียวเรียบร้อย) */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                {monthsTh[month]}{" "}
                <span className="font-mono text-gray-400 ml-1">
                  {year + 543}
                </span>
              </h2>

              {/* แผงปุ่มควบคุมขอบมนเด่นชัดเจน */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 border border-gray-200 rounded-xl shadow-inner">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 text-gray-600 hover:bg-white hover:text-red-600 rounded-lg transition-all shadow-none hover:shadow-sm active:scale-95"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-xs font-bold text-gray-700 hover:bg-white hover:text-red-600 rounded-lg transition-all"
                >
                  เดือนนี้
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 text-gray-600 hover:bg-white hover:text-red-600 rounded-lg transition-all shadow-none hover:shadow-sm active:scale-95"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* แผงวัน อา. - ส. */}
            <div className="grid grid-cols-7 gap-2 text-center mb-2">
              {daysOfWeekTh.map((dayName, idx) => (
                <div
                  key={idx}
                  className={`text-xs font-bold py-2 uppercase tracking-wider ${idx === 0 ? "text-rose-500" : idx === 6 ? "text-sky-500" : "text-gray-400"}`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* แผงตารางปฏิทิน */}
            <div className="grid grid-cols-7 gap-2 bg-gray-50/30 p-2 rounded-2xl border border-gray-50">
              {calendarCells}
            </div>

            {/* คำอธิบายแถบสี */}
            <div className="flex flex-wrap items-center justify-start gap-4 mt-5 pt-4 border-t border-gray-50 text-[11px] text-gray-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-md"></span>{" "}
                แผนกการเงิน
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-md"></span>{" "}
                แผนกการตลาด
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-sky-500 rounded-md"></span>{" "}
                ฝ่ายประชาสัมพันธ์
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-md"></span>{" "}
                หมวดหมู่กิจกรรม
              </span>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
