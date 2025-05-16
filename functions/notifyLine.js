// functions/notifyLine.js - ใช้ Firebase Secret อย่างปลอดภัย
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const axios = require('axios');

const db = admin.firestore();

// ✅ โหลด Secret จาก Firebase
const LINE_TOKEN = defineSecret('LINE_TOKEN');
const LINE_USER_ID = defineSecret('LINE_USER_ID');

exports.notifyLineOnDelivery = onDocumentCreated(
  { document: 'deliveryData/{deliveryId}', secrets: [LINE_TOKEN, LINE_USER_ID] },
  async (event) => {
    const data = event.data.data();
    const deliveryId = event.params.deliveryId;

    const message = generateLineMessage(data, deliveryId);

    try {
      await axios.post(
        'https://api.line.me/v2/bot/message/push',
        {
          to: LINE_USER_ID.value(),
          messages: [
            { type: 'text', text: message },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${LINE_TOKEN.value()}`,
          },
        }
      );

      console.log(`📲 แจ้งเตือน LINE สำเร็จ: ${deliveryId}`);
    } catch (error) {
      console.error('❌ ไม่สามารถส่ง LINE ได้:', error);
    }
  }
);

function generateLineMessage(data, deliveryId) {
  const itemLines = data.cart.map((item, i) => `#${i + 1} ${item.title} x${item.quantity}`).join('\n');
  return `📦 ออเดอร์ใหม่!

ชื่อผู้สั่ง: ${data.nameOrder || '-'}\nเลขออเดอร์: ${deliveryId}\nสถานที่ส่ง: ${data.deliveryLocation || '-'}\nรายการ:\n${itemLines}\n💰 รวม: ${data.totalPrice} บาท`;
}
