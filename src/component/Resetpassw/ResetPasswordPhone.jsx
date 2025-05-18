// ResetPasswordPhone.jsx — รองรับ i18n + รองรับ MUI Theme
import { useState, useEffect, useCallback } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { collection, getDocs, updateDoc, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import bcrypt from "bcryptjs";
import { useNavigate } from "react-router-dom";
import {
  Card, CardContent, TextField, Button, Typography,
  CircularProgress, Alert, Box, useTheme
} from "@mui/material";
import { useTranslation } from "react-i18next";

const ResetPasswordPhone = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

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
    if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => setError(""),
      "expired-callback": () => setError(t("reset.errors.captchaExpired")),
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

  const sendOTP = async () => {
    setError("");
    if (!username.trim() || !phone || !/^0[1-9]\d{8}$/.test(phone)) {
      setError(t("reset.errors.invalidForm"));
      return;
    }

    setLoading(true);
    try {
      const fullPhone = "+66" + phone.slice(1);
      const credsQuery = query(collection(db, "credentials"), where("username", "==", username.trim()));
      const credsSnapshot = await getDocs(credsQuery);

      if (credsSnapshot.empty) {
        setError(t("reset.errors.userNotFound"));
        setLoading(false);
        return;
      }

      const userDoc = credsSnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.phone !== fullPhone) {
        setError(t("reset.errors.phoneMismatch"));
        setLoading(false);
        return;
      }

      await window.recaptchaVerifier.verify();
      const result = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
    } catch (error) {
      console.error("ส่ง OTP ไม่สำเร็จ:", error);
      setError(t("reset.errors.otpSendFail"));
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setError("");
    if (!otp || !newPassword || !confirmPassword) {
      setError(t("reset.errors.missingFields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("reset.errors.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const userPhone = result.user.phoneNumber;
      const credsQuery = query(collection(db, "credentials"), where("phone", "==", userPhone));
      const credsSnapshot = await getDocs(credsQuery);

      if (credsSnapshot.empty) {
        setError(t("reset.errors.phoneNotFound"));
        setLoading(false);
        return;
      }

      const userDoc = credsSnapshot.docs[0];
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await updateDoc(userDoc.ref, { password: hashedPassword });

      navigate("/login");
    } catch (error) {
      console.error("OTP ไม่ถูกต้อง:", error);
      setError(t("reset.errors.otpInvalid"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      bgcolor: theme.palette.background.default,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <Card sx={{
        width: 400,
        p: 3,
        bgcolor: theme.palette.background.paper,
        boxShadow: 4,
        borderRadius: 2,
      }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom>
            {t("reset.title")}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField label={t("reset.username")} fullWidth margin="normal" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} />
          <TextField label={t("reset.phone")} fullWidth margin="normal" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} disabled={loading} />

          {!confirmationResult && (
            <Button variant="contained" color="primary" fullWidth onClick={sendOTP} disabled={loading || !username || !phone} sx={{ mt: 2 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : t("reset.sendOTP")}
            </Button>
          )}

          {confirmationResult && (
            <>
              <TextField label={t("reset.otp")} fullWidth margin="normal" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={loading} />
              <TextField label={t("reset.newPassword")} type="password" fullWidth margin="normal" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={loading} />
              <TextField label={t("reset.confirmPassword")} type="password" fullWidth margin="normal" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} />
              <Button variant="contained" color="success" fullWidth onClick={verifyOTP} disabled={loading || !otp || !newPassword || !confirmPassword} sx={{ mt: 2 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : t("reset.verify")}
              </Button>
            </>
          )}

          <Button variant="text" fullWidth onClick={() => navigate('/login')} sx={{ mt: 2 }}>
            {t("reset.backToLogin")}
          </Button>
        </CardContent>
      </Card>
      <Box id="recaptcha-container" sx={{ display: "none" }} />
    </Box>
  );
};

export default ResetPasswordPhone;
