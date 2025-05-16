import { useState, useEffect, useCallback } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { collection, getDocs, updateDoc, query, where } from "firebase/firestore";
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
} from "@mui/material";

const ResetPasswordPhone = () => {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const sendOTP = async () => {
    setError("");
    if (!username.trim() || !phone || !/^0[1-9]\d{8}$/.test(phone)) {
      setError("กรุณากรอกชื่อผู้ใช้และเบอร์โทรให้ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = "+66" + phone.slice(1);
      const credsQuery = query(collection(db, "credentials"), where("username", "==", username.trim()));
      const credsSnapshot = await getDocs(credsQuery);

      if (credsSnapshot.empty) {
        setError("ไม่พบชื่อผู้ใช้นี้ในระบบ");
        setLoading(false);
        return;
      }

      const userDoc = credsSnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.phone !== fullPhone) {
        setError("เบอร์โทรไม่ตรงกับข้อมูลในระบบ");
        setLoading(false);
        return;
      }

      await window.recaptchaVerifier.verify();
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
    } catch (error) {
      console.error("ส่ง OTP ไม่สำเร็จ:", error);
      setError("ส่ง OTP ไม่สำเร็จ กรุณาตรวจสอบเบอร์โทรหรือ reCAPTCHA");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setError("");
    if (!otp || !newPassword || !confirmPassword) {
      setError("กรุณากรอก OTP และรหัสผ่านใหม่ให้ครบ");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่ทั้ง 2 ช่องไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const userPhone = result.user.phoneNumber;
      const credsQuery = query(collection(db, "credentials"), where("phone", "==", userPhone));
      const credsSnapshot = await getDocs(credsQuery);

      if (credsSnapshot.empty) {
        setError("ไม่พบผู้ใช้งานจากเบอร์นี้");
        setLoading(false);
        return;
      }

      const userDoc = credsSnapshot.docs[0];
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await updateDoc(userDoc.ref, { password: hashedPassword });

      navigate("/login");
    } catch (error) {
      console.error("OTP ไม่ถูกต้อง:", error);
      setError("OTP ไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Card sx={{ width: 400, p: 3, boxShadow: 4, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom>
            ลืมรหัสผ่าน
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField label="ชื่อผู้ใช้" fullWidth margin="normal" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} />
          <TextField label="เบอร์โทร (เช่น 0891234567)" fullWidth margin="normal" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} disabled={loading} />

          {!confirmationResult && (
            <Button variant="contained" color="primary" fullWidth onClick={sendOTP} disabled={loading || !username || !phone} sx={{ mt: 2 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : "ส่ง OTP"}
            </Button>
          )}

          {confirmationResult && (
            <>
              <TextField label="กรอกรหัส OTP" fullWidth margin="normal" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={loading} />
              <TextField label="รหัสผ่านใหม่" type="password" fullWidth margin="normal" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={loading} />
              <TextField label="ยืนยันรหัสผ่านใหม่" type="password" fullWidth margin="normal" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} />
              <Button variant="contained" color="success" fullWidth onClick={verifyOTP} disabled={loading || !otp || !newPassword || !confirmPassword} sx={{ mt: 2 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "ยืนยัน OTP และเปลี่ยนรหัสผ่าน"}
              </Button>
            </>
          )}

          <Button variant="text" fullWidth onClick={() => navigate('/login')} sx={{ mt: 2 }}>
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </CardContent>
      </Card>

      {/* recaptcha container (Invisible) */}
      <Box id="recaptcha-container" sx={{ display: "none" }} />
    </Box>
  );
};

export default ResetPasswordPhone;
