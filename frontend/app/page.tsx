'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // สั่งให้ระบบดีดหน้าจอไปที่หน้า /login ทันทีที่เปิดเว็บเข้ามาครับน้า
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-sm text-slate-500 animate-pulse">กำลังนำคุณเข้าสู่ระบบ Smart Event...</p>
      </div>
    </div>
  );
}
