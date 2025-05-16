import { useState, useCallback, useEffect } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import bcrypt from "bcryptjs";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Grid,
  Snackbar,
} from "@mui/material";

const RegisterPhone = ({ onRegister }) => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const auth = getAuth();
  const navigate = useNavigate();

  const setupRecaptcha = useCallback(() => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => setError(""),
      "expired-callback": () => {
        setError("reCAPTCHA หมดอายุ กรุณาลองใหม่");
      },
    });
  }, [auth]);

  useEffect(() => {
    setupRecaptcha();
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, [setupRecaptcha]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const sendOTP = async () => {
    if (!phone || !/^0[1-9]\d{8}$/.test(phone)) {
      setError("กรุณากรอกเบอร์โทรให้ถูกต้อง (เช่น 08xxxxxxxx)");
      return;
    }
    setLoading(true);
    setError("");
    const fullPhone = "+66" + phone.slice(1);
    try {
      const phoneSnapshot = await getDocs(collection(db, "credentials"));
      const phoneExists = phoneSnapshot.docs.some(doc => doc.data().phone === fullPhone);
      if (phoneExists) {
        setError("เบอร์โทรนี้ถูกใช้งานแล้ว");
        setLoading(false);
        return;
      }
      await window.recaptchaVerifier.verify();
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setCooldown(60);
    } catch (error) {
      console.error("ส่ง OTP ไม่สำเร็จ:", error);
      setError("เบอร์โทรไม่ถูกต้องหรือ reCAPTCHA ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || !confirmationResult) {
      setError("กรุณากรอก OTP");
      return;
    }
    setLoading(true);
    try {
      const creds = await getDocs(collection(db, "credentials"));
      const emailExists = creds.docs.some(doc => doc.data().email === email && email !== "");
      const nameExists = creds.docs.some(doc => doc.data().name === name);
      const usernameExists = creds.docs.some(doc => doc.data().username === username);
      if (emailExists) {
        setError("อีเมลนี้มีในระบบแล้ว");
        setLoading(false);
        return;
      }
      if (nameExists) {
        setError("ชื่อนี้มีในระบบแล้ว");
        setLoading(false);
        return;
      }
      if (usernameExists) {
        setError("Username นี้มีในระบบแล้ว");
        setLoading(false);
        return;
      }
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      const hashedPassword = await bcrypt.hash(password, 10);
      await setDoc(doc(db, "credentials", user.uid), {
        uid: user.uid,
        name,
        username,
        email,
        phone: user.phoneNumber,
        password: hashedPassword,
        role: "customer",
        createdAt: new Date(),
      });
      const userData = {
        uid: user.uid,
        phone: user.phoneNumber,
        role: "customer",
        name,
        email,
        username,
      };
      onRegister(userData);
      setSnackbarOpen(true); // เปิด snackbar
      setTimeout(() => navigate("/login"), 1500); // Navigate ไป login หลัง snackbar แสดง
    } catch (error) {
      console.error("OTP ไม่ถูกต้อง:", error);
      setError("OTP ไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
      <CardContent>
        {/* Header with title and back button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">ลงทะเบียน</Typography>
          <Button variant="text" color="secondary" onClick={() => navigate("/login")}>
            กลับ Login
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField label="ชื่อ-นามสกุล" fullWidth value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} disabled={loading} />
        <TextField label="ชื่อเพื่อเข้าใช้งานระบบ(แนะนำเป็น ภาษาอังกฤษ)" fullWidth value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2 }} disabled={loading} />
        <TextField label="อีเมล (ไม่จำเป็น)" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} disabled={loading} />
        <TextField label="รหัสผ่าน" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} disabled={loading} />
        <TextField label="เบอร์โทร (เช่น 0891234567)" fullWidth value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} sx={{ mb: 2 }} disabled={loading} />

        <Button variant="contained" color="primary" fullWidth onClick={sendOTP} disabled={loading || cooldown > 0 || !name || !username || !password || !phone} sx={{ mb: 2 }}>
          {loading ? <CircularProgress size={24} /> : cooldown > 0 ? `ส่ง OTP อีกครั้งใน ${cooldown} วินาที` : "ส่ง OTP"}
        </Button>

        {confirmationResult && (
          <>
            <TextField label="กรอกรหัส OTP" fullWidth value={otp} onChange={(e) => setOtp(e.target.value)} sx={{ mt: 2, mb: 2 }} disabled={loading} />
            <Button variant="contained" color="success" fullWidth onClick={verifyOTP} disabled={loading || !otp} sx={{ mb: 2 }}>
              {loading ? <CircularProgress size={24} /> : "ยืนยัน & ลงทะเบียน"}
            </Button>
          </>
        )}

        <Box id="recaptcha-container" sx={{ mt: 2 }} />
      </CardContent>

      {/* Snackbar Success */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={1500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          ลงทะเบียนสำเร็จ กำลังกลับไปหน้า Login...
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default RegisterPhone;
