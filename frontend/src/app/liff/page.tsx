"use client";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function LiffPage() {
  const [liffInitialized, setLiffInitialized] = useState(false);
  const [lineProfile, setLineProfile] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://smart-event-backend-fua9.onrender.com";
  
  const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "2006734185-dummy";

  useEffect(() => {
    // โหลด JWT Token ที่เคยล็อกอินไว้ในเซสชัน LIFF (ถ้ามี)
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }

    // นำเข้าและเริ่มต้นทำงาน LINE LIFF SDK
    import("@line/liff")
      .then((liffModule) => {
        const liff = liffModule.default;
        return liff.init({ liffId: LIFF_ID }).then(() => {
          setLiffInitialized(true);
          if (!liff.isLoggedIn()) {
            liff.login();
          } else {
            return liff.getProfile().then((profile) => {
              setLineProfile(profile);
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ฟังก์ชันยิงข้อมูลผูกบัญชี LINE ID เข้ากับ User Web
  const linkAccount = async (jwtToken: string, lineId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/profile/line`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ lineUserId: lineId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "ผูกบัญชีไม่สำเร็จ");

      await Swal.fire({
        icon: "success",
        title: "ผูกบัญชีสำเร็จ!",
        text: "บัญชีเว็บของคุณเชื่อมต่อกับ LINE เรียบร้อยแล้ว",
        timer: 2000,
        showConfirmButton: false,
      });

      // ปิดหน้าต่าง LIFF ทันทีเมื่อเสร็จสิ้น
      const liff = (await import("@line/liff")).default;
      liff.closeWindow();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เชื่อมต่อ LINE ล้มเหลว",
        text: err.message,
        confirmButtonColor: "#dc2626",
      });
    }
  };

  // ดำเนินการอัตโนมัติหากมีทั้ง Token และ LINE Profile ครบถ้วนแล้ว
  useEffect(() => {
    if (token && lineProfile) {
      linkAccount(token, lineProfile.userId);
    }
  }, [token, lineProfile]);

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

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เข้าสู่ระบบล้มเหลว");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.token);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message,
        confirmButtonColor: "#dc2626",
      });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50/20 p-4">
      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold tracking-tight text-red-600">
            Smart Event CMTC x LINE
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            เชื่อมต่อบัญชีของคุณเข้ากับแอปพลิเคชัน LINE เพื่อรับการแจ้งเตือน
          </p>
        </div>

        {lineProfile && (
          <div className="flex items-center gap-3 bg-red-50/50 border border-red-100/50 p-3 rounded-xl mb-6">
            {lineProfile.pictureUrl && (
              <img
                src={lineProfile.pictureUrl}
                alt={lineProfile.displayName}
                className="w-10 h-10 rounded-full border border-white shadow-sm"
              />
            )}
            <div>
              <p className="text-xs text-gray-400 font-semibold">บัญชี LINE ที่กำลังเชื่อมต่อ</p>
              <p className="text-sm font-bold text-gray-800">{lineProfile.displayName}</p>
            </div>
          </div>
        )}

        {/* ฟอร์มให้ลงชื่อเข้าใช้เว็บหากยังไม่มี Token */}
        {!token && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <p className="text-xs font-medium text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
              ⚠️ กรุณาเข้าสู่ระบบด้วยบัญชีผู้ใช้ของ <strong className="text-red-600">Smart Event Web</strong> เพื่อยืนยันและยินยอมเชื่อมโยง LINE ส่วนตัวของคุณ
            </p>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                อีเมล
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-gray-900 text-sm transition-all duration-200"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                รหัสผ่าน
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-gray-900 text-sm transition-all duration-200"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all duration-300 active:scale-[0.99] mt-2 shadow-sm"
            >
              เข้าสู่ระบบเพื่อเชื่อมโยง LINE
            </button>
          </form>
        )}

        {token && lineProfile && (
          <div className="text-center py-6">
            <div className="animate-pulse flex flex-col items-center justify-center">
              <div className="h-2 w-20 bg-red-600/40 rounded mb-2"></div>
              <p className="text-xs text-gray-400 font-medium">กำลังผูกบัญชีในระบบหลังบ้าน...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
