export default function Footer() {
  return (
    <footer className="w-full bg-gray-50 border-t border-gray-100 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ส่วนข้อมูลวิทยาลัย */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-sm text-gray-600">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">วิทยาลัยเทคนิคเชียงใหม่</h4>
            <p className="text-xs leading-relaxed">
              191 ถนนห้วยแก้ว<br />
              ตำบลสุเทพ อำเภอเมือง<br />
              จังหวัดเชียงใหม่ 50200
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">ติดต่อ</h4>
            <p className="text-xs leading-relaxed">
              โทร: 0-5322-1406<br />
              แฟกซ์: 0-5322-1407<br />
              อีเมล: cmtc@cmtc.ac.th
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">ลิงก์ที่เกี่ยวข้อง</h4>
            <div className="flex flex-col gap-1 text-xs">
              <a href="https://www.cmtc.ac.th" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-700 transition-colors">
                เว็บไซต์วิทยาลัย
              </a>
              <a href="https://www.facebook.com/profile.php?id=100057493567949" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                Facebook: ประชาสัมพันธ์ วิทยาลัยเทคนิคเชียงใหม่
              </a>
            </div>
          </div>
        </div>

        {/* ส่วนลิขสิทธิ์และลิงก์ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 border-t border-gray-200 pt-6">
          <p>© {new Date().getFullYear()} SmartEvent CMTC. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-red-600 transition-colors cursor-pointer">เงื่อนไขการใช้งาน</span>
            <span className="hover:text-red-600 transition-colors cursor-pointer">นโยบายความเป็นส่วนตัว</span>
            <span className="text-gray-300">|</span>
            <p>ระบบจัดการกิจกรรมพร้อมแจ้งเตือนผ่าน <span className="text-green-600 font-semibold">LINE</span></p>
          </div>
        </div>
      </div>
    </footer>
  );
}
