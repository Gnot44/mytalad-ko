import { useState, useEffect } from 'react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Box,
  Link as MuiLink,
} from '@mui/material';

const LoginPhone = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState('');

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const savedName = localStorage.getItem('savedName');
    const savedPassword = localStorage.getItem('savedPassword');
    if (savedName && savedPassword) {
      setName(savedName);
      setPassword(savedPassword);
      setRemember(true);
    }
  }, []);

  const normalizeNameOrPhone = (input) => {
  return input.trim(); // ✅ ไม่ต้องแปลงอะไร ฝั่ง server handle เอง
};


  // ✅ Real-time Validate input
  const validateNameInput = (value) => {
    if (!value.trim()) {
      setNameError('กรุณากรอกชื่อผู้ใช้หรือเบอร์โทร');
    } else if (/^\d+$/.test(value) && !/^0[689]\d{8}$/.test(value)) {
      setNameError('เบอร์โทรไม่ถูกต้อง ควรเป็น 0XXXXXXXXX');
    } else {
      setNameError('');
    }
  };

  const handleLogin = async () => {
    validateNameInput(name);

    if (!name.trim() || !password.trim() || nameError) {
      enqueueSnackbar('กรุณากรอกข้อมูลให้ถูกต้อง', { variant: 'error' });
      return;
    }

    const loginName = normalizeNameOrPhone(name);

    try {
      setLoading(true);

      const loginFunc = httpsCallable(functions, 'loginWithName');
      const response = await loginFunc({
        name: loginName,
        password: password.trim()
      });

      const { token, role, issuedAt } = response.data || {};

      if (!token || !role) {
        throw new Error('ไม่สามารถรับข้อมูลผู้ใช้หรือ Token ได้ กรุณาติดต่อผู้ดูแลระบบ');
      }

      await signInWithCustomToken(getAuth(), token);

      if (remember) {
        localStorage.setItem('savedName', name.trim());
        localStorage.setItem('savedPassword', password.trim());
      } else {
        localStorage.removeItem('savedName');
        localStorage.removeItem('savedPassword');
      }

      enqueueSnackbar('เข้าสู่ระบบสำเร็จ', { variant: 'success' });

      onLogin({ token, role, issuedAt: issuedAt || Date.now() });

    } catch (err) {
      console.error('Login error:', err);

      switch (err.code) {
        case 'functions/invalid-argument':
        case 'functions/not-found':
        case 'functions/unauthenticated':
        case 'functions/failed-precondition':
          enqueueSnackbar(err.message, { variant: 'error' });
          break;
        default:
          enqueueSnackbar(err.message || 'เกิดข้อผิดพลาด ไม่สามารถเข้าสู่ระบบได้', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f4f6f8',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Card sx={{ width: 400, p: 3, boxShadow: 4, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom>
            เข้าสู่ระบบ
          </Typography>
          <TextField
            label="ชื่อผู้ใช้ หรือ เบอร์โทร (0XXXXXXXXX)"
            variant="outlined"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              validateNameInput(e.target.value);
            }}
            error={!!nameError}
            // helperText={nameError || 'ตัวอย่าง: 0964105303 หรือ username123'}
          />
          <TextField
            label="รหัสผ่าน"
            variant="outlined"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormControlLabel
            control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
            label="จำชื่อผู้ใช้และรหัสผ่าน"
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleLogin}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'เข้าสู่ระบบ'}
          </Button>

          <Button
            variant="text"
            fullWidth
            onClick={() => navigate('/resetpassword')}
            sx={{ mt: 1 }}
          >
            ลืมรหัสผ่าน?
          </Button>

          <Typography variant="body2" align="center" sx={{ mt: 3 }}>
            ยังไม่มีบัญชี?{' '}
            <MuiLink component="button" variant="body2" onClick={() => navigate('/register')} sx={{ fontWeight: 'bold' }}>
              สมัครสมาชิก
            </MuiLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPhone;
