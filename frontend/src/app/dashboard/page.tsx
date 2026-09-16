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
  Eye,
  Edit3,
  LayoutGrid,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // สเตทสำหรับระบบสลับมุมมอง (list = แบบการ์ดรายการ, calendar = แบบปฏิทินอัจฉริยะ)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // สเตทสำหรับแท็บงาน Staff / ผู้ปฏิบัติงาน ("my" = งานที่รับผิดชอบ, "all" = งานทั้งหมด)
  const [activeTab, setActiveTab] = useState<"my" | "all">("my");

  // สเตทสำหรับปฏิทิน
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://smart-event-backend-fua9.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");

    if (!token || !userJson) {
      router.push("/");
      return;
    }

    try {
      const user = JSON.parse(userJson);
      setUserName(user.name || "");
      setUserEmail(user.email || "");
      setCurrentUserId(user.id);
      setCurrentUserRole(user.role || "user_n");
    } catch (e) {
      console.error("Parse user error:", e);
    }

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
        if (data.email) setUserEmail(data.email);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    }
  };

  const fetchEvents = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks?showAll=true`, {
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
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "2010617243-H2wIcDTp";
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
        const idVal = (
          document.getElementById("swal-line-id") as HTMLInputElement
        ).value.trim();
        if (!idVal) {
          Swal.showValidationMessage("กรุณากรอก LINE User ID");
          return false;
        }
        if (!idVal.startsWith("U") || idVal.length < 15) {
          Swal.showValidationMessage(
            "รูปแบบ LINE User ID ไม่ถูกต้อง (ต้องขึ้นต้นด้วย U)"
          );
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
          if (!res.ok)
            throw new Error(data.message || "ยกเลิกการเชื่อมต่อไม่สำเร็จ");

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

  // 📥 ฟังก์ชันกดรับงานสำหรับ Staff / PR
  const handleAcceptTask = async (taskId: number, taskTitle: string) => {
    const token = localStorage.getItem("token");
    const result = await Swal.fire({
      title: "ยืนยันการรับงาน",
      text: `คุณต้องการรับงาน "${taskTitle}" หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ใช่, ยืนยันรับงาน",
      cancelButtonText: "ยกเลิก",
      customClass: {
        popup: "rounded-2xl",
      },
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาดในการรับงาน");

      await Swal.fire({
        icon: "success",
        title: "สำเร็จ!",
        text: "คุณรับงานเรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });

      if (token) {
        await fetchEvents(token);
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message,
        confirmButtonColor: "#dc2626",
      });
    }
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
      title: `<span class="text-slate-900 font-bold text-xl border-b border-slate-100 pb-2 block">📄 รายละเอียดกิจกรรม</span>`,
      html: `
        <div class="text-left space-y-3 text-sm text-slate-600 pt-3 bg-white">
          ${
            event.banner_url
              ? `<div class="mb-3 overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                  <img src="${event.banner_url}" class="w-full h-auto object-cover max-h-52 rounded-xl" alt="Banner" onerror="this.style.display='none'" />
                 </div>`
              : ""
          }
          <div class="flex items-center justify-between">
            <span class="font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded text-xs uppercase">${event.category || "กิจกรรม"}</span>
            <span class="text-slate-400 text-xs">📅 ${formattedDate}</span>
          </div>
          <div class="text-base font-bold text-slate-900 leading-snug">${event.title}</div>
          
          <div class="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-700 border border-slate-100 whitespace-pre-wrap">
            <strong class="text-slate-900">📝 วาระงาน / รายละเอียดสิ่งที่ต้องทำ:</strong><br/>
            <p class="mt-1 text-slate-600 font-medium leading-relaxed">${event.description || "ไม่มีรายละเอียดเพิ่มเติมสำหรับกิจกรรมนี้"}</p>
          </div>

          <div class="grid grid-cols-1 gap-1.5 border-t border-slate-50 pt-3 text-xs">
            <div><strong>⏱️ ช่วงเวลา:</strong> <span class="text-red-600 font-bold">${timeStart} - ${timeEnd} น.</span></div>
            <div><strong>👤 ผู้รับผิดชอบ:</strong> ${event.chairman || "ไม่ระบุ"}</div>
            <div><strong>🚪 สถานที่จัด:</strong> ${event.room || "ไม่ระบุ"}</div>
            <div class="text-[11px] text-slate-400 pt-1 border-t border-slate-50">ผู้โพสต์ระบบ: ${event.creator_name || "ไม่ระบุ"}</div>
          </div>
        </div>
      `,
      confirmButtonText: "ปิดหน้าต่าง",
      confirmButtonColor: "#475569",
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
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1">หมวดหมู่งาน</label>
            <select id="swal-category" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500">
              <option value="การเงิน" ${event.category === "การเงิน" ? "selected" : ""}>การเงิน</option>
              <option value="การตลาด" ${event.category === "การตลาด" ? "selected" : ""}>การตลาด</option>
              <option value="ประชาสัมพันธ์" ${event.category === "ประชาสัมพันธ์" ? "selected" : ""}>ประชาสัมพันธ์</option>
              <option value="กิจกรรม" ${event.category === "กิจกรรม" ? "selected" : ""}>กิจกรรม</option>
              <option value="การเรียนการสอน" ${event.category === "การเรียนการสอน" ? "selected" : ""}>การเรียนการสอน</option>
              <option value="ด่วน" ${event.category === "ด่วน" ? "selected" : ""}>ด่วน</option>
              <option value="ด่วนที่สุด" ${event.category === "ด่วนที่สุด" ? "selected" : ""}>ด่วนที่สุด</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1">หัวข้อ/เรื่อง</label>
            <input id="swal-title" type="text" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500" value="${event.title}">
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">วันที่</label>
              <input id="swal-date" type="date" class="w-full px-2 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500" value="${rawDate}">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">เวลาเริ่ม</label>
              <input id="swal-start" type="time" class="w-full px-2 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500" value="${timeStart}">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-1">เวลาสิ้นสุด</label>
              <input id="swal-end" type="time" class="w-full px-2 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500" value="${timeEnd}">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1">ผู้รับผิดชอบ</label>
            <input id="swal-chairman" type="text" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500" value="${event.chairman}">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1">สถานที่</label>
            <input id="swal-room" type="text" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500" value="${event.room}">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea id="swal-description" rows="3" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500 resize-none">${event.description || ""}</textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
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
      cancelButtonColor: "#64748b",
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
  // 🎨 ตัวช่วยจัดสีและป้ายกำกับตามมาตรฐานระบบ
  // =========================================================
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="bg-white/20 backdrop-blur-sm text-white border border-white/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase shadow-xs">
            👑 Admin
          </span>
        );
      case "pr":
      case "user_pr":
        return (
          <span className="bg-sky-500/30 backdrop-blur-sm text-white border border-sky-300/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase shadow-xs">
            📢 PR / ประชาสัมพันธ์
          </span>
        );
      case "staff":
        return (
          <span className="bg-blue-500/30 backdrop-blur-sm text-white border border-blue-300/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase shadow-xs">
            👤 Staff / ผู้ปฏิบัติงาน
          </span>
        );
      case "user_n":
        return (
          <span className="bg-emerald-500/30 backdrop-blur-sm text-white border border-emerald-300/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase shadow-xs">
            👥 Normal User
          </span>
        );
      default:
        return (
          <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
            {role || "MEMBER"}
          </span>
        );
    }
  };

  const getTaskDateStr = (dateVal: any) => {
    if (!dateVal) return "";
    if (typeof dateVal === "string") {
      return dateVal.split("T")[0].trim();
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getCategoryDot = (category: string) => {
    switch (category) {
      case "การเงิน":
        return "bg-emerald-500";
      case "การตลาด":
        return "bg-amber-500";
      case "ประชาสัมพันธ์":
        return "bg-sky-500";
      case "กิจกรรม":
        return "bg-rose-500";
      case "การเรียนการสอน":
        return "bg-blue-600";
      case "ด่วน":
      case "ด่วนที่สุด":
        return "bg-red-600";
      default:
        return "bg-slate-400";
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "การเงิน":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "การตลาด":
        return "bg-amber-50 text-amber-600 border border-amber-100";
      case "ประชาสัมพันธ์":
        return "bg-sky-50 text-sky-600 border border-sky-100";
      case "กิจกรรม":
        return "bg-rose-50 text-rose-600 border border-rose-100";
      case "การเรียนการสอน":
        return "bg-blue-50 text-blue-600 border border-blue-100";
      case "ด่วน":
      case "ด่วนที่สุด":
        return "bg-red-50 text-red-600 border border-red-200 font-bold";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-100";
    }
  };

  // =========================================================
  // 🧠 ส่วนคำนวณปฏิทิน
  // =========================================================
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
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)
    );
  };

  const handleToday = () => {
    const now = new Date();
    setCalendarDate(now);
    setSelectedDate(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    );
  };

  // คัดกรองงานตามบทบาทและแท็บ (staff / pr)
  const displayedEvents =
    currentUserRole === "staff" ||
    currentUserRole === "user_pr" ||
    currentUserRole === "pr"
      ? activeTab === "my"
        ? events.filter(
            (t: any) =>
              t.user_id === currentUserId || t.assigned_to === currentUserId
          )
        : events
      : events;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          กำลังเตรียมระบบและดึงข้อมูลกิจกรรม...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col justify-between selection:bg-red-100 selection:text-red-900">
      <Navbar userName={userName} onLogout={handleLogout} />

      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 grow">
        {/* =========================================================
            ✨ 1. Hero Profile Card สไตล์เดียวกับ LINE LIFF
            ========================================================= */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-rose-500 text-white p-6 sm:p-8 rounded-3xl shadow-lg shadow-red-500/10 relative overflow-hidden mb-6">
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -mr-12 -mt-12 pointer-events-none"></div>
          <div className="absolute left-1/2 bottom-0 w-32 h-32 bg-white/5 rounded-full -mb-16 pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black text-white border-2 border-white/60 shadow-md">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <p className="text-xs text-red-100 font-medium tracking-wide">
                  ระบบจัดการกิจกรรมอัจฉริยะ CMTC
                </p>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {userName}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {getRoleBadge(currentUserRole)}
                  {userEmail && (
                    <span className="text-[11px] text-red-100 font-mono bg-black/10 px-2 py-0.5 rounded-md">
                      {userEmail}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* สถานะการเชื่อมต่อ LINE */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex flex-col sm:items-end justify-center text-xs">
              <span className="text-red-100 text-[11px]">สถานะการเชื่อมต่อ LINE</span>
              {lineUserId ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold text-white flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    ผูก LINE แล้ว
                  </span>
                  <button
                    onClick={handleUnlinkLine}
                    className="text-[10px] text-red-200 hover:text-white bg-black/20 hover:bg-black/30 px-2 py-1 rounded-md transition-all cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLinkLine}
                  className="mt-1 bg-white text-red-600 hover:bg-red-50 text-[11px] font-bold py-1 px-3 rounded-lg transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  🔗 เชื่อมต่อ LINE ส่วนตัว
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            🔘 2. Action Buttons & Segmented View Switcher
            ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          {/* ปุ่มสร้างกิจกรรม และ ปุ่มแอดมิน */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/form"
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 active:scale-[0.98] text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md shadow-red-500/15 transition-all text-center"
            >
              <Plus className="w-4 h-4" />
              เพิ่มกิจกรรมใหม่ / สร้างงาน
            </Link>

            {currentUserRole === "admin" && (
              <Link
                href="/admin"
                className="py-2.5 px-4 bg-slate-900 hover:bg-black active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
              >
                <ShieldCheck className="h-4 w-4 text-red-500" />
                จัดการระบบหลังบ้าน
              </Link>
            )}
          </div>

          {/* สวิตเชอร์สลับมุมมอง รายการ vs ปฏิทิน (Segmented Control แบบเดียวกับ LIFF) */}
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold sm:w-64">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex-1 py-2 text-center rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              📋 แบบรายการ
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`flex-1 py-2 text-center rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              📅 แบบปฏิทิน
            </button>
          </div>
        </div>

        {/* =========================================================
            🎖️ 3. แท็บกรองสำหรับ Staff / PR
            ========================================================= */}
        {(currentUserRole === "staff" ||
          currentUserRole === "user_pr" ||
          currentUserRole === "pr") && (
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5 text-xs font-semibold border border-slate-200/60 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("my")}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                activeTab === "my"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🎖️ งานที่คุณรับผิดชอบ (
              {
                events.filter(
                  (t: any) =>
                    t.user_id === currentUserId ||
                    t.assigned_to === currentUserId
                ).length
              }
              )
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              📋 งานทั้งหมดในระบบ ({events.length})
            </button>
          </div>
        )}

        {/* =========================================================
            📅 4. โหมดที่ 1: แสดงผลแบบปฏิทินอัจฉริยะ (Calendar View)
            ========================================================= */}
        {viewMode === "calendar" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* กล่องตารางปฏิทินรายเดือน */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              {/* แถบควบคุมเดือนและปี */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl hover:bg-slate-100 active:scale-95 text-slate-600 transition-all cursor-pointer"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                    {monthsTh[calendarDate.getMonth()]}{" "}
                    <span className="font-mono text-slate-400">
                      {calendarDate.getFullYear() + 543}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleToday}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all cursor-pointer"
                  >
                    วันนี้
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl hover:bg-slate-100 active:scale-95 text-slate-600 transition-all cursor-pointer"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* หัวแถวชื่อวัน */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
                {daysOfWeekTh.map((d, i) => (
                  <div
                    key={d}
                    className={`text-xs font-bold py-1.5 uppercase ${
                      i === 0
                        ? "text-red-500"
                        : i === 6
                        ? "text-blue-500"
                        : "text-slate-400"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* ช่องตารางวันในเดือน */}
              {(() => {
                const year = calendarDate.getFullYear();
                const month = calendarDate.getMonth();
                const startDayOfWeek = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                const todayObj = new Date();
                const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

                const calendarCells = [];
                for (let i = 0; i < startDayOfWeek; i++) {
                  calendarCells.push(
                    <div
                      key={`empty-${i}`}
                      className="h-11 sm:h-14 rounded-2xl bg-slate-50/50"
                    />
                  );
                }

                for (let day = 1; day <= daysInMonth; day++) {
                  const currentCellDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayTasks = displayedEvents.filter(
                    (t: any) => getTaskDateStr(t.date) === currentCellDateStr
                  );
                  const isSelected = selectedDate === currentCellDateStr;
                  const isToday = currentCellDateStr === todayStr;

                  calendarCells.push(
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => setSelectedDate(currentCellDateStr)}
                      className={`h-11 sm:h-14 rounded-2xl flex flex-col items-center justify-center relative transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-red-600 text-white font-bold shadow-md shadow-red-500/25 scale-[1.02]"
                          : isToday
                          ? "border-2 border-red-500 bg-red-50/50 text-red-600 font-bold"
                          : "hover:bg-slate-100 text-slate-700 font-medium"
                      }`}
                    >
                      <span className="text-xs sm:text-sm leading-none">
                        {day}
                      </span>
                      {dayTasks.length > 0 && (
                        <div className="flex justify-center gap-1 mt-1">
                          {dayTasks.slice(0, 3).map((ev: any, idx: number) => (
                            <span
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected
                                  ? "bg-white"
                                  : getCategoryDot(ev.category)
                              }`}
                            />
                          ))}
                          {dayTasks.length > 3 && (
                            <span
                              className={`text-[8px] leading-none ${
                                isSelected ? "text-white" : "text-slate-400"
                              }`}
                            >
                              +
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                }

                return (
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {calendarCells}
                  </div>
                );
              })()}

              {/* คำอธิบายจุดสีหมวดหมู่ */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3.5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{" "}
                  การเงิน
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />{" "}
                  การตลาด
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />{" "}
                  ประชาสัมพันธ์
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />{" "}
                  กิจกรรม
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />{" "}
                  การเรียนการสอน
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> ด่วน /
                  ด่วนที่สุด
                </span>
              </div>
            </div>

            {/* รายการกิจกรรมของวันที่เลือก (แสดงผลด้านล่างปฏิทิน) */}
            {(() => {
              const selectedDateTasks = displayedEvents.filter(
                (t: any) => getTaskDateStr(t.date) === selectedDate
              );
              const [y, m, d] = selectedDate.split("-").map(Number);
              const thaiDateTitle = `${d} ${monthsTh[m - 1]} ${y + 543}`;

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-red-600" />
                      กิจกรรมวันที่ {thaiDateTitle}
                    </h4>
                    <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
                      {selectedDateTasks.length} กิจกรรม
                    </span>
                  </div>

                  {selectedDateTasks.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-xs">
                      <span className="text-3xl block mb-2">🏖️</span>
                      <h5 className="text-sm font-bold text-slate-700">
                        ไม่มีกิจกรรมในวันที่เลือก
                      </h5>
                      <p className="text-xs text-slate-400 mt-1">
                        คุณสามารถคลิกเลือกวันที่มีจุดสีบนปฏิทินเพื่อดูกิจกรรมได้ครับ
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDateTasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group overflow-hidden"
                        >
                          {task.banner_url && (
                            <div className="-mx-5 -mt-5 mb-3.5 h-32 overflow-hidden border-b border-slate-100">
                              <img
                                src={task.banner_url}
                                alt="Event Banner"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) =>
                                  (e.currentTarget.parentElement!.style.display =
                                    "none")
                                }
                              />
                            </div>
                          )}

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${getCategoryBadgeClass(task.category)}`}
                              >
                                {task.category || "กิจกรรม"}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleViewDetails(task)}
                                  className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> รายละเอียด
                                </button>
                                {(currentUserId === task.user_id ||
                                  currentUserRole === "admin") && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleEdit(task)}
                                      className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                                      title="แก้ไข"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDelete(task.id, task.title)
                                      }
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                      title="ลบ"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            <h5 className="font-bold text-slate-900 text-base leading-snug group-hover:text-red-600 transition-colors">
                              {task.title}
                            </h5>

                            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 pt-2 border-t border-slate-50 text-xs text-slate-600">
                              <div className="truncate flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>
                                  {task.start_time?.substring(0, 5)} -{" "}
                                  {task.end_time?.substring(0, 5)} น.
                                </span>
                              </div>
                              <div className="truncate flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{task.room || "-"}</span>
                              </div>
                              <div className="col-span-2 truncate flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>ผู้ดูแล: {task.chairman || "-"}</span>
                              </div>
                            </div>
                          </div>

                          {/* สิทธิ์รับงานสำหรับ Staff / PR */}
                          {(currentUserRole === "staff" ||
                            currentUserRole === "user_pr" ||
                            currentUserRole === "pr") && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end items-center">
                              {task.user_id === currentUserId ||
                              task.assigned_to === currentUserId ? (
                                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />{" "}
                                  คุณได้รับผิดชอบงานนี้แล้ว
                                </span>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleAcceptTask(task.id, task.title)
                                  }
                                  className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl transition-all shadow-sm shadow-red-500/15 flex items-center gap-1 cursor-pointer"
                                >
                                  📥 กดรับงานนี้
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* =========================================================
            📋 5. โหมดที่ 2: แสดงผลแบบการ์ดรายการ (List View สไตล์ LIFF)
            ========================================================= */}
        {viewMode === "list" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-800">
                {currentUserRole === "admin" || currentUserRole === "user_n"
                  ? "📋 รายการกิจกรรมทั้งหมดในระบบ"
                  : activeTab === "my"
                  ? "🎖️ งานที่คุณได้รับมอบหมาย / รับผิดชอบ"
                  : "📋 งานทั้งหมดในระบบ"}
              </h4>
              <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
                {displayedEvents.length} กิจกรรม
              </span>
            </div>

            {displayedEvents.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
                <span className="text-4xl block mb-3">🎉</span>
                <h5 className="text-base font-bold text-slate-800">
                  ไม่มีกิจกรรมนัดหมายในขณะนี้
                </h5>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  หากมีกิจกรรมใหม่หรือได้รับมอบหมายงาน
                  รายการจะแสดงผลในหน้านี้ทันทีครับ
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedEvents.map((task: any) => (
                  <div
                    key={task.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group overflow-hidden"
                  >
                    {task.banner_url && (
                      <div className="-mx-5 -mt-5 mb-3.5 h-32 overflow-hidden border-b border-slate-100">
                        <img
                          src={task.banner_url}
                          alt="Event Banner"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) =>
                            (e.currentTarget.parentElement!.style.display =
                              "none")
                          }
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${getCategoryBadgeClass(task.category)}`}
                        >
                          {task.category || "กิจกรรม"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-400">
                            {new Date(task.date).toLocaleDateString("th-TH", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleViewDetails(task)}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> รายละเอียด
                          </button>
                        </div>
                      </div>

                      <h5 className="font-bold text-slate-900 text-base leading-snug group-hover:text-red-600 transition-colors">
                        {task.title}
                      </h5>

                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 pt-2 border-t border-slate-50 text-xs text-slate-600">
                        <div className="truncate flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {task.start_time?.substring(0, 5)} -{" "}
                            {task.end_time?.substring(0, 5)} น.
                          </span>
                        </div>
                        <div className="truncate flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{task.room || "-"}</span>
                        </div>
                        <div className="col-span-2 truncate flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>ผู้ดูแล: {task.chairman || "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-400">
                      <div className="text-[11px] truncate max-w-[150px]">
                        ผู้สร้าง: {task.creator_name || "ไม่ระบุ"}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* ปุ่มรับงาน สำหรับ Staff / PR */}
                        {(currentUserRole === "staff" ||
                          currentUserRole === "user_pr" ||
                          currentUserRole === "pr") && (
                          <div>
                            {task.user_id === currentUserId ||
                            task.assigned_to === currentUserId ? (
                              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                งานของคุณ
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  handleAcceptTask(task.id, task.title)
                                }
                                className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg transition-all shadow-xs cursor-pointer"
                              >
                                📥 รับงาน
                              </button>
                            )}
                          </div>
                        )}

                        {/* ปุ่มแก้ไข / ลบ (เฉพาะเจ้าของงานหรือแอดมิน) */}
                        {(currentUserId === task.user_id ||
                          currentUserRole === "admin") && (
                          <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(task)}
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                              title="แก้ไข"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(task.id, task.title)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                              title="ลบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
