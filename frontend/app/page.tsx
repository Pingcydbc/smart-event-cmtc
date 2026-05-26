'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // 💡 ปรับให้เด้งตรงเข้าหน้าแผงควบคุมแดชบอร์ดหลักที่มีปฏิทินงานทันทีครับน้า
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-sm text-slate-500 animate-pulse">กำลังนำคุณเข้าสู่ระบบ Smart Event CMTC...</p>
      </div>
    </div>
  );
}
