import { useState, useCallback, useEffect } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import bcrypt from "bcryptjs";
import { useNavigate } from "react-router-dom";
import {
  Card, CardContent, TextField, Button, Typography,
  CircularProgress, Alert, Box, Snackbar
} from "@mui/material";
import { useTranslation } from "react-i18next";

const RegisterPhone = ({ onRegister }) => {
  const { t } = useTranslation();
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
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const auth = getAuth();
  const navigate = useNavigate();

  const setupRecaptcha = useCallback(() => {
    if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => setError(""),
      "expired-callback": () => setError(t("register.errors.captchaExpired"))
    });
  }, [auth, t]);

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
      setError(t("register.errors.invalidPhone"));
      return;
    }
    setLoading(true);
    setError("");
    const fullPhone = "+66" + phone.slice(1);
    try {
      const phoneSnapshot = await getDocs(collection(db, "credentials"));
      const phoneExists = phoneSnapshot.docs.some(doc => doc.data().phone === fullPhone);
      if (phoneExists) {
        setError(t("register.errors.duplicatePhone"));
        setLoading(false);
        return;
      }
      await window.recaptchaVerifier.verify();
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setCooldown(30);
    } catch (error) {
      console.error("ส่ง OTP ไม่สำเร็จ:", error);
      setError(t("register.errors.invalidPhone"));
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || !confirmationResult) {
      setError(t("register.otp"));
      return;
    }
    setLoading(true);
    try {
      const creds = await getDocs(collection(db, "credentials"));
      if (email && creds.docs.some(doc => doc.data().email === email)) {
        setError(t("register.errors.duplicateEmail"));
        setLoading(false);
        return;
      }
      if (creds.docs.some(doc => doc.data().name === name)) {
        setError(t("register.errors.duplicateName"));
        setLoading(false);
        return;
      }
      if (creds.docs.some(doc => doc.data().username === username)) {
        setError(t("register.errors.duplicateUsername"));
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

      onRegister({
        uid: user.uid,
        phone: user.phoneNumber,
        role: "customer",
        name,
        email,
        username,
      });

      setSnackbarOpen(true);
      setTimeout(() => navigate("/login"), 1500);

    } catch (error) {
      console.error("OTP ไม่ถูกต้อง:", error);
      setError(t("register.errors.otpInvalid"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5">{t("register.title")}</Typography>
          <Button variant="text" color="secondary" onClick={() => navigate("/login")}>
            {t("register.backToLogin")}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField label={t("register.name")} fullWidth value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} disabled={loading} />
        <TextField label={t("register.username")} fullWidth value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2 }} disabled={loading} />
        <TextField label={t("register.email")} type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} disabled={loading} />
        <TextField label={t("register.password")} type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} disabled={loading} />
        <TextField label={t("register.phone")} fullWidth value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} sx={{ mb: 2 }} disabled={loading} />

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={sendOTP}
          disabled={loading || cooldown > 0 || !name || !username || !password || !phone}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> :
            cooldown > 0 ? t("register.resendOTPIn", { seconds: cooldown }) : t("register.sendOTP")}
        </Button>

        {confirmationResult && (
          <>
            <TextField label={t("register.otp")} fullWidth value={otp} onChange={(e) => setOtp(e.target.value)} sx={{ mt: 2, mb: 2 }} disabled={loading} />
            <Button variant="contained" color="success" fullWidth onClick={verifyOTP} disabled={loading || !otp} sx={{ mb: 2 }}>
              {loading ? <CircularProgress size={24} /> : t("register.verifyAndRegister")}
            </Button>
          </>
        )}

        <Box id="recaptcha-container" sx={{ mt: 2 }} />
      </CardContent>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={1500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {t("register.successMessage")}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default RegisterPhone;
