"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Users,
  Calendar,
  Trash2,
  ArrowLeft,
  UserX,
  Clock,
  MapPin,
  Eye,
  Edit3,
  UserPlus,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AdminDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("events");
  const [loading, setLoading] = useState(true);

  const API_URL = "https://smart-event-backend-fua9.onrender.com";

  // 🔐 1. เช็กสิทธิ์แอดมินตั้งแต่ตอนโหลดหน้าเพจครั้งแรก
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");

    if (!token || !userJson) {
      router.push("/");
      return;
    }

    const user = JSON.parse(userJson);
    if (user.role !== "admin") {
      Swal.fire({
        icon: "error",
        title: "ปฏิเสธการเข้าถึง",
        text: "หน้านี้เฉพาะผู้ดูแลระบบเท่านั้นครับน้า",
        confirmButtonColor: "#dc2626",
      });
      router.push("/dashboard");
      return;
    }

    setUserName(user.name);
    fetchAdminData(token);
  }, [router]);

  // 📡 2. ดึงข้อมูลสมาชิกทั้งหมด และ กิจกรรมทั้งหมดจากท่อแอดมินหลังบ้าน
  const fetchAdminData = async (token: string) => {
    try {
      const eventsRes = await fetch(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const eventsData = await eventsRes.json();

      const usersRes = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();

      if (eventsRes.ok) setEvents(eventsData);
      if (usersRes.ok) setUsers(usersData);
    } catch (err) {
      console.error("Fetch admin data error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 👁️ 3. ฟังก์ชันแอดมินกดดูรายละเอียดงานแบบ Pop-up
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
      title: `<span class="text-gray-900 font-bold text-xl border-b border-gray-100 pb-2 block">📄 รายละเอียดกิจกรรม (โหมด Admin)</span>`,
      html: `
        <div class="text-left space-y-3 text-sm text-gray-600 pt-3 bg-white">
          <div class="mb-2"><span class="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs uppercase">${event.category}</span></div>
          <div class="text-base font-bold text-gray-900 mb-2">${event.title}</div>
          
          <div class="bg-gray-50 p-3 rounded-xl text-xs text-gray-700 border border-gray-100 whitespace-pre-wrap mb-3">
            <strong>📝 วาระงาน / รายละเอียดสิ่งที่ต้องทำ:</strong><br/>
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

  // ✏️ 4. ฟังก์ชันแอดมินกดแก้ไขงานของใครก็ได้
  const handleEditEvent = async (event: any) => {
    const token = localStorage.getItem("token");
    const timeStart = event.start_time
      ? event.start_time.substring(0, 5)
      : "08:30";
    const timeEnd = event.end_time ? event.end_time.substring(0, 5) : "11:30";
    const rawDate = new Date(event.date).toISOString().split("T")[0];

    Swal.fire({
      title: "👑 แก้ไขกิจกรรม (สิทธิ์ผู้ดูแลระบบ)",
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
            title: "แอดมินแก้ไขข้อมูลสำเร็จ!",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchAdminData(token!);
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

  // 👤 5. [เพิ่มใหม่] ฟังก์ชันแอดมินมอบหมายงานให้พนักงานคนอื่น
  const handleAssignEvent = (event: any) => {
    const token = localStorage.getItem("token");

    // ประกอบดรอปดาวน์รายชื่อสมาชิกทุกคนในองค์กรที่มีอยู่ในสเตท
    let optionsHtml = users
      .map(
        (u: any) =>
          `<option value="${u.id}" ${u.id === event.user_id ? "selected" : ""}>${u.name} (${u.role.toUpperCase()})</option>`,
      )
      .join("");

    Swal.fire({
      title: "👤 มอบหมายงานใหม่",
      html: `
        <div class="text-left space-y-2 pt-3 text-sm bg-white">
          <p class="text-xs text-gray-500 mb-2">ระบุรายชื่อสมาชิกที่จะย้ายงานเรื่อง <strong>"${event.title}"</strong> เข้าไปประจำการที่หน้าแดชบอร์ดส่วนตัว</p>
          <label class="block text-xs font-bold text-gray-400 uppercase mb-1">เลือกผู้รับผิดชอบงานคนใหม่</label>
          <select id="swal-assign-user" class="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-red-500 bg-white">
            ${optionsHtml}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#10b981", // สีเขียวสไตล์มอบหมายสำเร็จ
      cancelButtonColor: "#4b5563",
      confirmButtonText: "ยืนยันมอบหมายงาน",
      cancelButtonText: "ยกเลิก",
      customClass: {
        popup: "rounded-2xl",
        cancelButton:
          "border border-gray-200 text-gray-700 font-medium px-4 py-2",
      },
      preConfirm: () => {
        return {
          newUserId: (
            document.getElementById("swal-assign-user") as HTMLSelectElement
          ).value,
        };
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const res = await fetch(
            `${API_URL}/api/admin/tasks/${event.id}/assign`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(result.value),
            },
          );

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "มอบหมายงานไม่สำเร็จ");

          Swal.fire({
            icon: "success",
            title: "มอบหมายงานสำเร็จ!",
            text: "ระบบส่งข้อความแจ้งเตือนเข้า LINE แล้ว",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchAdminData(token!); // โหลดตารางแดชบอร์ดแอดมินใหม่
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

  // ❌ 6. ฟังก์ชันแอดมินสั่งลบกิจกรรมของใครก็ได้
  const handleDeleteEvent = async (id: number, title: string) => {
    const token = localStorage.getItem("token");

    Swal.fire({
      title: "ยืนยันการลบกิจกรรม?",
      text: `คุณกำลังลบกิจกรรมเรื่อง "${title}" ของสมาชิกในองค์กร`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#4b5563",
      confirmButtonText: "ใช่, สั่งลบทันที",
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

          if (!res.ok) throw new Error("ไม่สามารถลบกิจกรรมได้");

          Swal.fire(
            "ลบสำเร็จ!",
            "กิจกรรมถูกลบและแจ้งเตือนเข้า LINE กลุ่มแล้ว",
            "success",
          );
          fetchAdminData(token!);
        } catch (err) {
          Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถลบได้", "error");
        }
      }
    });
  };

  // ❌ 7. ฟังก์ชันแอดมินสั่งลบบัญชีสมาชิก
  const handleDeleteUser = async (id: number, name: string) => {
    const token = localStorage.getItem("token");
    Swal.fire({
      title: "ยืนยันการลบสมาชิก?",
      text: `คุณต้องการลบบัญชีของ "${name}" ออกจากระบบถาวรใช่ไหม?`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#fff",
      confirmButtonText: "ใช่, ลบรายชื่อออก",
      cancelButtonText: "ยกเลิก",
      customClass: {
        popup: "rounded-2xl",
        cancelButton:
          "border border-gray-200 text-gray-700 font-medium px-4 py-2",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "ไม่สามารถลบสมาชิกได้");

          Swal.fire("สำเร็จ!", "ลบสมาชิกคนดังกล่าวออกจากระบบแล้ว", "success");
          fetchAdminData(token!);
        } catch (err: any) {
          Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
        }
      }
    });
  };

  // 👤 8. ฟังก์ชันแอดมินลงทะเบียนบัญชีใหม่
  const handleRegisterUser = () => {
    const token = localStorage.getItem("token");

    Swal.fire({
      title: "👤 เพิ่มสมาชิกใหม่ (สิทธิ์แอดมิน)",
      html: `
        <div class="text-left space-y-3 pt-3 text-sm bg-white" id="register-form">
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">ชื่อ-นามสกุล</label>
            <input id="swal-reg-name" type="text" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500" placeholder="ชื่อ นามสกุล">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">อีเมลบัญชี</label>
            <input id="swal-reg-email" type="email" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500" placeholder="example@email.com">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">รหัสผ่าน</label>
            <input id="swal-reg-password" type="password" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500" placeholder="อย่างน้อย 6 ตัวอักษร">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">ระดับสิทธิ์ (Role)</label>
            <select id="swal-reg-role" class="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-red-500">
              <option value="user_n">USER_N (Normal User / ผู้ใช้ทั่วไป)</option>
              <option value="user_pr">USER_PR (Staff / ผู้ปฏิบัติงาน)</option>
              <option value="admin">ADMIN (ผู้ดูแลระบบ)</option>
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#4b5563",
      confirmButtonText: "ลงทะเบียนสมาชิก",
      cancelButtonText: "ยกเลิก",
      customClass: {
        popup: "rounded-2xl",
        cancelButton:
          "border border-gray-200 text-gray-700 font-medium px-4 py-2",
      },
      preConfirm: () => {
        const name = (document.getElementById("swal-reg-name") as HTMLInputElement).value.trim();
        const email = (document.getElementById("swal-reg-email") as HTMLInputElement).value.trim();
        const password = (document.getElementById("swal-reg-password") as HTMLInputElement).value.trim();
        const role = (document.getElementById("swal-reg-role") as HTMLSelectElement).value;

        if (!name || !email || !password) {
          Swal.showValidationMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
          return false;
        }
        if (password.length < 6) {
          Swal.showValidationMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
          return false;
        }
        return { name, email, password, role };
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const res = await fetch(`${API_URL}/api/auth/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(result.value),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "ลงทะเบียนไม่สำเร็จ");

          Swal.fire({
            icon: "success",
            title: "เพิ่มสมาชิกสำเร็จ!",
            text: `สร้างบัญชีสำหรับคุณ ${result.value.name} เรียบร้อยแล้ว`,
            timer: 2000,
            showConfirmButton: false,
          });
          fetchAdminData(token!);
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

  // กรองเฉพาะกิจกรรมที่ยังไม่ผ่านไปเกิน 1 วัน สำหรับการแสดงผลรายการ (List View) ของแอดมิน
  const activeListEvents = events.filter((event: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - eventDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays < 1; // แสดงเฉพาะงานวันนี้และอนาคต (ซ่อนงานที่ผ่านไปแล้ว 1 วันขึ้นไป)
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-500 font-medium text-sm">
        กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...
      </div>
    );
  }

  return (
    <div className="w-full bg-white min-h-screen flex flex-col justify-between selection:bg-red-100 selection:text-red-900">
      <Navbar
        userName={userName}
        onLogout={() => {
          localStorage.clear();
          router.push("/");
        }}
      />

      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 grow">
        {/* ส่วนหัวหน้าเว็บ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5 mb-6 gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-600 transition-all uppercase tracking-wider mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> กลับหน้าหลัก
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-600" />{" "}
              ระบบควบคุมผู้ดูแลระบบ (Admin)
            </h1>
          </div>

          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 text-sm">
            <button
              onClick={() => setActiveTab("events")}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === "events" ? "bg-white text-red-600 shadow-sm font-semibold" : "text-gray-500 hover:text-gray-900"}`}
            >
              <Calendar className="h-4 w-4" /> จัดการกิจกรรม ({activeListEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === "users" ? "bg-white text-red-600 shadow-sm font-semibold" : "text-gray-500 hover:text-gray-900"}`}
            >
              <Users className="h-4 w-4" /> จัดการสมาชิก ({users.length})
            </button>
          </div>
        </div>

        {/* 📋 แท็บที่ 1: ตารางจัดการกิจกรรมทั้งหมดในองค์กร */}
        {activeTab === "events" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              รายการกิจกรรมทั้งหมดในระบบ
            </h2>
            {activeListEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
                ไม่มีกิจกรรมใด ๆ ในระบบตอนนี้
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                        <th className="px-6 py-4">เรื่อง / วาระกิจกรรม</th>
                        <th className="px-6 py-4">ผู้รับผิดชอบ</th>
                        <th className="px-6 py-4">วัน-เวลา / สถานที่</th>
                        <th className="px-6 py-4 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {activeListEvents.map((event: any) => (
                        <tr
                          key={event.id}
                          className="hover:bg-gray-50/40 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 mb-1">
                              {event.category}
                            </span>
                            <div className="font-semibold text-gray-900">
                              {event.title}
                            </div>
                            <div className="text-[11px] text-red-500 font-semibold mt-0.5 bg-red-50/50 w-fit px-1.5 py-0.5 rounded">
                              ⏱️{" "}
                              {event.start_time
                                ? event.start_time.substring(0, 5)
                                : "08:30"}{" "}
                              -{" "}
                              {event.end_time
                                ? event.end_time.substring(0, 5)
                                : "11:30"}{" "}
                              น.
                            </div>
                            <div className="text-xs text-gray-400 mt-1.5">
                              ผู้โพสต์:{" "}
                              <span className="font-semibold text-gray-600">
                                {event.creator_name || "ไม่ระบุ"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {event.chairman}
                          </td>
                          <td className="px-6 py-4 space-y-1 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />{" "}
                              {new Date(event.date).toLocaleDateString(
                                "th-TH",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <MapPin className="h-3 w-3" /> {event.room}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewDetails(event)}
                                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                                title="ดูรายละเอียดวาระงาน"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* 👤 [ปุ่มเพิ่มใหม่] ปุ่มแอดมินกดจ่ายแจกมอบหมายงานเปลี่ยนคนทำ */}
                              <button
                                onClick={() => handleAssignEvent(event)}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="มอบหมายงานให้คนอื่น"
                              >
                                <UserPlus className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => handleEditEvent(event)}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="แก้ไขข้อมูลกิจกรรมนี้"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() =>
                                  handleDeleteEvent(event.id, event.title)
                                }
                                className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="ลบกิจกรรมนี้ออกจากระบบ"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* 👥 แท็บที่ 2: ตารางจัดการรายชื่อสมาชิกองค์กร */}
        {activeTab === "users" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                รายชื่อสมาชิกที่ใช้งานระบบ
              </h2>
              <button
                onClick={handleRegisterUser}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-all"
              >
                <UserPlus className="h-3.5 w-3.5" /> เพิ่มสมาชิกใหม่
              </button>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="px-6 py-4">ชื่อพนักงาน / สมาชิก</th>
                      <th className="px-6 py-4">อีเมลบัญชี</th>
                      <th className="px-6 py-4">ระดับสิทธิ์ (Role)</th>
                      <th className="px-6 py-4 text-center">เตะออกจากระบบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700">
                    {users.map((user: any) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50/40 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${user.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}
                          >
                            {user.role === "admin"
                              ? "👑 Administrator"
                              : `👤 ${user.role.toUpperCase()}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={user.role === "admin"}
                            className="p-2 text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-xl transition-all"
                            title={
                              user.role === "admin"
                                ? "ไม่สามารถลบผู้ดูแลระบบได้"
                                : "ลบสมาชิกรายนี้"
                            }
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
