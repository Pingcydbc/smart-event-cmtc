"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function LiffPage() {
  const [liffInitialized, setLiffInitialized] = useState(false);
  const [lineProfile, setLineProfile] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "all">("my");
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://smart-event-backend-fua9.onrender.com";
  
  const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "2010617243-H2wIcDTp";

  useEffect(() => {
    // นำเข้าและเริ่มต้นทำงาน LINE LIFF SDK
    import("@line/liff")
      .then((liffModule) => {
        const liff = liffModule.default;
        return liff.init({ liffId: LIFF_ID }).then(() => {
          setLiffInitialized(true);
          if (!liff.isLoggedIn()) {
            liff.login();
          } else {
            return liff.getProfile().then(async (profile) => {
              setLineProfile(profile);
              await handleAutoLogin(profile.userId);
            });
          }
        });
      })
      .catch((err) => {
        console.error("LIFF initialization failed", err);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาดในการโหลด LINE LIFF",
          text: err.message,
          confirmButtonColor: "#dc2626",
        });
        setLoading(false);
      });
  }, []);

  // ฟังก์ชันล็อกอินอัตโนมัติด้วย LINE User ID
  const handleAutoLogin = async (lineId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/liff/login-by-line?lineUserId=${lineId}`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        await fetchTasks(data.token);
      } else {
        // หากยังไม่ได้เชื่อมโยง LINE ID (ยังไม่มีในระบบ)
        console.log("LINE ID not linked yet. Showing login form.");
      }
    } catch (err) {
      console.error("Auto login error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ดึงข้อมูลกิจกรรมทั้งหมดสำหรับแสดงผลใน LIFF
  const fetchTasks = async (jwtToken: string) => {
    setLoadingTasks(true);
    try {
      const res = await fetch(`${API_URL}/api/tasks?showAll=true`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Fetch tasks error:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // ฟังก์ชันกดรับงานมอบหมายสำหรับ Staff
  const handleAcceptTask = async (taskId: number, taskTitle: string) => {
    const result = await Swal.fire({
      title: "ยืนยันการรับงาน",
      text: `คุณต้องการรับงาน "${taskTitle}" หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ใช่, ยืนยัน",
      cancelButtonText: "ยกเลิก",
      customClass: {
        popup: "rounded-2xl",
      }
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
        await fetchTasks(token);
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

  // ฟังก์ชันเชื่อมต่อ LINE ID และล็อกอินแบบ Manual
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineProfile) {
      Swal.fire({
        icon: "warning",
        title: "ไม่พบโปรไฟล์ LINE",
        text: "กรุณารอสักครู่ขณะระบบดึงข้อมูลจากแอปพลิเคชัน LINE",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. ล็อกอินระบบเว็บเพื่อดึง JWT Token
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.message || "เข้าสู่ระบบล้มเหลว");

      const jwtToken = loginData.token;

      // 2. ผูก LINE User ID เข้ากับไอดีที่ล็อกอินสำเร็จ
      const linkRes = await fetch(`${API_URL}/api/auth/profile/line`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ lineUserId: lineProfile.userId }),
      });

      const linkData = await linkRes.json();
      if (!linkRes.ok) throw new Error(linkData.message || "ผูกบัญชี LINE ล้มเหลว");

      // 3. บันทึกเซสชันและเปิดหน้าแดชบอร์ด
      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user", JSON.stringify(loginData.user));
      setToken(jwtToken);
      setUser(loginData.user);

      await Swal.fire({
        icon: "success",
        title: "เชื่อมต่อสำเร็จ!",
        text: `ยินดีต้อนรับคุณ ${loginData.user.name} ระบบจดจำ LINE ของคุณแล้ว`,
        timer: 2000,
        showConfirmButton: false,
      });

      await fetchTasks(jwtToken);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message,
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันออกจากระบบและยกเลิกจำสถานะในเครื่องนี้
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setTasks([]);
  };

  // เปลี่ยนสี badge ตามสิทธิ์
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Admin</span>;
      case "user_pr":
        return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Staff / ผู้ปฏิบัติงาน</span>;
      case "user_n":
        return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Normal User / ผู้ใช้ทั่วไป</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{role}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        <p className="mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          กำลังเตรียมระบบ LINE LIFF...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-8">
      {/* 1. หน้าจอหลัก (แดชบอร์ดแสดงผลหลังล็อกอินแล้ว) */}
      {token && user ? (
        <div className="w-full max-w-md mx-auto flex flex-col">
          {/* Header ส่วนโปรไฟล์ผู้ใช้ */}
          <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white p-6 rounded-b-[2rem] shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              {lineProfile?.pictureUrl ? (
                <img
                  src={lineProfile.pictureUrl}
                  alt={lineProfile.displayName}
                  className="w-14 h-14 rounded-full border-2 border-white/60 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs text-red-100 font-medium">เข้าใช้งานผ่าน LINE</p>
                <h3 className="text-lg font-bold truncate">{user.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  {getRoleBadge(user.role)}
                  <span className="text-[10px] text-red-100 font-mono truncate max-w-[120px]">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center relative z-10 text-xs">
              <span className="text-red-100">ผูก LINE บัญชี: <strong>{lineProfile?.displayName || "เสร็จสิ้น"}</strong></span>
              <button
                onClick={handleLogout}
                className="bg-white/10 hover:bg-white/20 active:scale-95 text-white py-1 px-3 rounded-lg font-medium transition-all"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>

          {/* รายการกิจกรรมสำหรับผู้ใช้งานนั้นๆ */}
          <div className="p-4 flex-1">
            {/* ปุ่มเพิ่มงานสำหรับ Normal User, Staff และ แอดมิน */}
            {(user.role === "admin" || user.role === "user_pr" || user.role === "user_n") && (
              <div className="mb-5">
                <Link
                  href="/form"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 active:scale-[0.98] text-white py-3 px-4 rounded-xl text-xs font-bold shadow-md shadow-red-500/10 transition-all text-center"
                >
                  ➕ เพิ่มกิจกรรมใหม่ / สร้างงาน
                </Link>
              </div>
            )}

            {/* แท็บสลับหน้างานสำหรับ Staff / ผู้ปฏิบัติงาน */}
            {user.role === "user_pr" && (
              <div className="flex bg-slate-200/60 p-1 rounded-xl mb-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("my")}
                  className={`flex-1 py-2 text-center rounded-lg transition-all ${
                    activeTab === "my"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🎖️ งานของคุณ ({tasks.filter((t) => t.user_id === user.id).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`flex-1 py-2 text-center rounded-lg transition-all ${
                    activeTab === "all"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  📋 งานทั้งหมดที่เปิดรับ ({tasks.length})
                </button>
              </div>
            )}

            {/* หัวข้อเรื่องและจำนวนกิจกรรม */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-800">
                {user.role === "admin" || user.role === "user_n" 
                  ? "📋 งานทั้งหมดในระบบ" 
                  : activeTab === "my" 
                    ? "🎖️ งานที่คุณได้รับมอบหมาย" 
                    : "📋 รายการงานทั้งหมดที่รับได้"}
              </h4>
              <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                {(user.role === "user_pr" 
                  ? (activeTab === "my" ? tasks.filter((t) => t.user_id === user.id) : tasks)
                  : tasks
                ).length} กิจกรรม
              </span>
            </div>

            {loadingTasks ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="text-xs text-slate-400 mt-2">กำลังดึงข้อมูลกิจกรรม...</p>
              </div>
            ) : (user.role === "user_pr" 
                  ? (activeTab === "my" ? tasks.filter((t) => t.user_id === user.id) : tasks) 
                  : tasks
                 ).length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                <span className="text-3xl block mb-2">🎉</span>
                <h5 className="text-xs font-bold text-slate-700">ไม่มีกิจกรรมนัดหมายในขณะนี้</h5>
                <p className="text-[10px] text-slate-400 mt-1">หากมีกิจกรรมใหม่หรือได้รับมอบหมายงาน จะแสดงผลตรงนี้ทันที</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(user.role === "user_pr" 
                  ? (activeTab === "my" ? tasks.filter((t) => t.user_id === user.id) : tasks)
                  : tasks
                ).map((task) => (
                  <div
                    key={task.id}
                    className="bg-white p-4 rounded-xl border border-slate-100/80 shadow-sm flex flex-col gap-2 hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 uppercase tracking-wider">
                        {task.category}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {new Date(task.date).toLocaleDateString("th-TH", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <h5 className="font-bold text-slate-800 text-sm leading-snug">{task.title}</h5>

                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 pt-2 border-t border-slate-50 text-[11px] text-slate-500">
                      <div className="truncate">
                        <span className="font-semibold text-slate-700">⏱️ เวลา:</span>{" "}
                        {task.start_time?.substring(0, 5)} - {task.end_time?.substring(0, 5)} น.
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-slate-700">🚪 ห้อง:</span> {task.room}
                      </div>
                      <div className="col-span-2 truncate">
                        <span className="font-semibold text-slate-700">👤 ผู้ดูแล:</span> {task.chairman}
                      </div>
                    </div>

                    {/* ปุ่มสำหรับกดรับงาน (เฉพาะบทบาท Staff / user_pr) */}
                    {user.role === "user_pr" && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                        {task.user_id === user.id ? (
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            ✅ คุณได้รับผิดชอบงานนี้แล้ว
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAcceptTask(task.id, task.title)}
                            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg transition-all shadow-sm shadow-red-500/10 flex items-center gap-1"
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
        </div>
      ) : (
        /* 2. หน้าจอล็อกอินเชื่อมบัญชี (แสดงครั้งแรกสุดเท่านั้น) */
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold tracking-tight text-red-600">
                Smart Event CMTC x LINE
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                เชื่อมต่อบัญชีผู้ใช้เพื่อความปลอดภัยในการเข้าถึงผ่าน LINE
              </p>
            </div>

            {lineProfile && (
              <div className="flex items-center gap-3 bg-red-50/50 border border-red-100/50 p-3 rounded-xl mb-5">
                {lineProfile.pictureUrl && (
                  <img
                    src={lineProfile.pictureUrl}
                    alt={lineProfile.displayName}
                    className="w-10 h-10 rounded-full border border-white shadow-sm"
                  />
                )}
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">บัญชี LINE ที่กำลังเชื่อมต่อ</p>
                  <p className="text-xs font-bold text-slate-800">{lineProfile.displayName}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                ⚠️ <strong>เชื่อมต่อครั้งแรกเพียงครั้งเดียว:</strong> กรุณากรอกรหัสผ่านของระบบ <strong>Smart Event Web</strong> เพื่อเชื่อมโยงบัญชีและสิทธิ์ใช้งานของคุณเข้ากับ LINE ส่วนตัวนี้
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  อีเมล
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900 text-sm transition-all duration-200"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-900 text-sm transition-all duration-200"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all duration-300 active:scale-[0.99] mt-2 shadow-sm"
              >
                ยืนยันการเชื่อมต่อ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
