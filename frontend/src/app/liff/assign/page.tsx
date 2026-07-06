"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

function AssignForm() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://smart-event-backend-fua9.onrender.com";

  const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "2010617243-H2wIcDTp";

  useEffect(() => {
    if (!taskId) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่พบรหัสกิจกรรม (Task ID)",
        confirmButtonColor: "#dc2626",
      });
      setLoading(false);
      return;
    }

    // โหลด LINE LIFF SDK
    import("@line/liff")
      .then((liffModule) => {
        const liff = liffModule.default;
        return liff.init({ liffId: LIFF_ID }).then(() => {
          if (!liff.isLoggedIn()) {
            liff.login();
            return;
          }

          return liff.getProfile().then(async (profile) => {
            const uid = profile.userId;
            setLineUserId(uid);

            // 1. ตรวจสอบสิทธิ์กับ Backend ก่อนว่าตรงกับ Admin หรือไม่
            const verifyRes = await fetch(
              `${API_URL}/api/liff/verify-admin?lineUserId=${uid}`
            );
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.isAdmin) {
              setIsAdmin(true);
              setAdminName(verifyData.user.name);

              // 2. หากสิทธิ์ถูกต้อง ให้ดึงรายชื่อพนักงานขึ้นมาแสดง
              const usersRes = await fetch(
                `${API_URL}/api/liff/users?adminLineUserId=${uid}`
              );
              if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(usersData);
              }
            } else {
              Swal.fire({
                icon: "error",
                title: "ปฏิเสธการเข้าถึง",
                text: verifyData.message || "สำหรับผู้ดูแลระบบเท่านั้น",
                confirmButtonColor: "#dc2626",
              });
            }
          });
        });
      })
      .catch((err) => {
        console.error("LIFF assign screen init failed", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !lineUserId || !taskId) {
      Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบถ้วน",
        text: "กรุณาเลือกผู้รับผิดชอบงานคนใหม่",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/liff/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminLineUserId: lineUserId,
          taskId: parseInt(taskId),
          newUserId: parseInt(selectedUserId),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "มอบหมายงานล้มเหลว");

      await Swal.fire({
        icon: "success",
        title: "มอบหมายงานสำเร็จ!",
        text: "อัปเดตระบบและส่งแจ้งเตือนเข้าไลน์ผู้ปฏิบัติงานแล้ว",
        timer: 2000,
        showConfirmButton: false,
      });

      // ปิดหน้าต่าง LIFF ทันที
      const liff = (await import("@line/liff")).default;
      liff.closeWindow();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message,
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        <p className="mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          กำลังยืนยันสิทธิ์แอดมิน...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-2xl font-bold mb-4">
          ⚠️
        </div>
        <h2 className="text-lg font-bold text-gray-800">ปฏิเสธการเข้าถึง</h2>
        <p className="text-sm text-gray-400 max-w-xs mt-1 leading-relaxed">
          หน้าจอมอบหมายงานนี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) ที่ผ่านการเชื่อมต่อบัญชีใน LINE แล้วเท่านั้น
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50/20 p-4">
      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="text-center mb-6">
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 uppercase tracking-wider mb-2">
            👑 LINE Admin Tool
          </span>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            มอบหมายงานกิจกรรม
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            ลงมือเปลี่ยนตัวผู้รับผิดชอบดูแลโดยไม่ต้องเข้าบราวเซอร์ภายนอก
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-500 mb-6 flex justify-between items-center">
          <span>แอดมินคนปัจจุบัน:</span>
          <strong className="text-gray-800 font-bold">{adminName}</strong>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              เลือกผู้รับผิดชอบงานคนใหม่
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-red-500 text-gray-800 text-sm transition-all duration-200"
            >
              <option value="">-- เลือกสมาชิกในองค์กร --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all duration-300 active:scale-[0.99] mt-2 shadow-sm disabled:opacity-50"
          >
            {submitting ? "กำลังบันทึก..." : "🎯 ยืนยันการมอบหมายงาน"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AssignPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">กำลังโหลดหน้าจอ...</p>
      </div>
    }>
      <AssignForm />
    </Suspense>
  );
}
