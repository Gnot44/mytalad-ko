const functions = require('firebase-functions/v2');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const db = admin.firestore();

exports.loginWithName = functions.https.onCall({ region: 'us-central1' }, async (requestData) => {
  try {
    console.log('Received data :', requestData.data);

    const { name, password } = requestData.data || {};

    if (!name || !password) {
      console.error('Missing name or password', { name, password });
      throw new functions.https.HttpsError('invalid-argument', 'กรุณาระบุชื่อผู้ใช้หรือเบอร์โทร และรหัสผ่าน');
    }

    console.log('Login attempt for:', name);

    let snapshot;

    // ✅ ตรวจว่ากรอกเบอร์หรือชื่อผู้ใช้
    if (/^0[689]\d{8}$/.test(name.trim())) {
      const phoneFormatted = '+66' + name.trim().slice(1);
      console.log('Interpreted as phone number. Converted to:', phoneFormatted);
      snapshot = await db.collection('credentials').where('phone', '==', phoneFormatted).limit(1).get();
    } else {
      snapshot = await db.collection('credentials').where('username', '==', name.trim()).limit(1).get();
    }

    if (snapshot.empty) {
      console.error('User not found with given name or phone:', name);
      throw new functions.https.HttpsError('not-found', 'ไม่พบชื่อผู้ใช้หรือเบอร์โทรนี้');
    }

    const userData = snapshot.docs[0].data();
    console.log('User data from Firestore:', JSON.stringify(userData));

    if (!userData.uid) {
      console.error('UID missing in userData:', userData);
      throw new functions.https.HttpsError('failed-precondition', 'ข้อมูลผู้ใช้ผิดพลาด ไม่มี UID');
    }

    const isMatch = await bcrypt.compare(password, userData.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.error('Incorrect password for:', name);
      throw new functions.https.HttpsError('unauthenticated', 'รหัสผ่านไม่ถูกต้อง');
    }

    const userRecord = await admin.auth().getUser(userData.uid);
    console.log('Firebase Auth user exists:', userRecord.uid);

    const customToken = await admin.auth().createCustomToken(userData.uid);

    console.log('Login success. Token created for:', name);

    return {
      token: customToken,
      role: userData.role || 'user',
      issuedAt: Date.now(),
      message: 'เข้าสู่ระบบสำเร็จ'
    };

  } catch (error) {
    console.error('LoginWithName error (wrapped catch):', error.message);
    console.error('Stack:', error.stack);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    } else {
      throw new functions.https.HttpsError('internal', `เกิดข้อผิดพลาดภายในระบบ: ${error.message}`);
    }
  }
});
