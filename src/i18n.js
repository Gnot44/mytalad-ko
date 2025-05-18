import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi) // โหลดไฟล์แปลผ่าน HTTP
  .use(LanguageDetector) // ตรวจจับภาษาอัตโนมัติ (จาก browser, localStorage, etc.)
  .use(initReactI18next) // เชื่อมกับ react-i18next
  .init({
    fallbackLng: 'th', // ถ้าไม่เจอภาษาให้ fallback เป็นไทย
    debug: false, // ตั้งเป็น true ถ้าอยากดู log debug
    interpolation: {
      escapeValue: false, // React escape ให้อยู่แล้ว
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // path ไฟล์แปล
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false // ปิด Suspense เผื่อบางระบบยังไม่พร้อม
    }
  });

export default i18n;
