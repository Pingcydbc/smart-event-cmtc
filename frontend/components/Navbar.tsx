"use client";
import Link from "next/link";
import { Calendar, ShieldCheck, LogOut } from "lucide-react";

interface NavbarProps {
  userName: string;
  onLogout: () => void;
}

export default function Navbar({ userName, onLogout }: NavbarProps) {
  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between h-16">
        {/* โลโก้ฝั่งซ้าย */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="p-2 bg-red-50 rounded-xl group-hover:bg-red-100 transition-all">
            <Calendar className="h-5 w-5 text-red-600" />
          </div>
          <span className="font-bold text-gray-900 tracking-tight text-sm sm:text-base">
            SmartEvent <span className="text-red-600">CMTC</span>
          </span>
        </Link>

        {/* ข้อมูลผู้ใช้และปุ่มจัดการฝั่งขวา */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ผู้ใช้งานปัจจุบัน</div>
            <div className="text-sm font-bold text-gray-900">{userName || "กำลังโหลด..."}</div>
          </div>

          <div className="h-8 w-px bg-gray-100 hidden sm:block"></div>

          <div className="flex items-center">
            {/* 💡 เช็กระบบสิทธิ์: ถ้ายูสเซอร์เป็น admin ให้โชว์ปุ่มรูปโล่วาร์ปไปหลังบ้านแอดมิน */}
            {typeof window !== "undefined" && (() => {
              const userJson = localStorage.getItem("user");
              if (userJson) {
                const user = JSON.parse(userJson);
                if (user.role === "admin") {
                  return (
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all border border-red-200/40 mr-2"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      แผงควบคุม Admin
                    </Link>
                  );
                }
              }
              return null;
            })()}

            {/* ปุ่มออกจากระบบ */}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
              title="ออกจากระบบ"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}