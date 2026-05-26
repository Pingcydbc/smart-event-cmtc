import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Smart Event CMTC',
  description: 'Web Application for Event Management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* 💡 บังคับพื้นหลังของโครงสร้างเว็บทั้งหมดให้เป็นสีขาวบริสุทธิ์ bg-white */}
      <body className={`${inter.className} bg-white text-gray-900 min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}