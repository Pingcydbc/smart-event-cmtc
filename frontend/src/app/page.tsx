"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function Page() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://smart-event-backend-fua9.onrender.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      Swal.fire({
        icon: "success",
        title: "เข้าสู่ระบบสำเร็จ",
        text: `ยินดีต้อนรับคุณ ${data.user.name}`,
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        router.push("/dashboard");
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message,
        confirmButtonColor: "#dc2626",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-red-600">
            Smart Event CMTC
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            เข้าสู่ระบบเพื่อจัดการกิจกรรม
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              อีเมล
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-gray-900 transition-all duration-200"
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
              minLength={6}
              placeholder="รหัสผ่านอย่างน้อย 6 ตัว"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-gray-900 transition-all duration-200"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-white hover:bg-red-600 border border-red-600 text-red-600 hover:text-white font-medium rounded-xl transition-all duration-300 active:scale-[0.99] mt-2"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
}
