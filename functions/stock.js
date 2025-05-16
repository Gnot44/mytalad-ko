const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const db = admin.firestore();

exports.autoDecreaseStockOnDeliveryWrite = onDocumentWritten('deliveryData/{deliveryId}', async (event) => {
  const beforeData = event.data.before?.data();
  const afterData = event.data.after?.data();
  const deliveryId = event.params.deliveryId;

  if (
    (!beforeData && afterData?.status === true && afterData.stockUpdated !== true) ||
    (beforeData?.status === false && afterData?.status === true && afterData.stockUpdated !== true)
  ) {
    await processStockUpdate(afterData, deliveryId);
  } else {
    console.log('ข้าม: ไม่มีสถานะใหม่เป็น true หรือ stock ถูกหักไปแล้ว');
  }
});

async function processStockUpdate(deliveryData, deliveryId) {
  try {
    const cart = deliveryData.cart || [];

    for (const item of cart) {
      if (item && item.pid && item.quantity) {
        const pid = String(item.pid).trim();
        const quantity = Number(item.quantity);

        const snap = await db.collection('cardsData').where('pid', '==', pid).limit(1).get();
        if (!snap.empty) {
          const docRef = snap.docs[0].ref;
          const current = Number(snap.docs[0].data().stockKg || 0);
          const newStock = current - quantity;
          await docRef.update({ stockKg: newStock >= 0 ? newStock : 0 });
          console.log(`✅ หัก stock ของ ${pid}: ${current} → ${newStock >= 0 ? newStock : 0}`);
        }
      }
    }

    await db.collection('deliveryData').doc(deliveryId).update({
      stockUpdated: true,
      stockUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ อัปเดต stockUpdated: true สำหรับ ${deliveryId}`);

  } catch (err) {
    console.error(`❌ เกิดข้อผิดพลาดในการอัปเดต stock:`, err);
  }
}
