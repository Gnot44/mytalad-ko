// LoginPhone.jsx — Final สวยงาม ไม่บังหัว แสดงชื่อร้านในกล่อง Login
import { useState, useEffect } from 'react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Card, CardContent, TextField, Button, Typography,
  Checkbox, FormControlLabel, CircularProgress, Box, Link as MuiLink,
  Avatar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import BackgroundImage from './nampic.png';
import ProfileImage from './S__52944902.jpg';
import SpaIcon from '@mui/icons-material/Spa'; // ไอคอนผักแบบใบไม้

const LoginPhone = ({ onLogin }) => {
  const theme = useTheme();
  const { t } = useTranslation();
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

  const normalizeNameOrPhone = (input) => input.trim();

  const validateNameInput = (value) => {
    if (!value.trim()) {
      setNameError(t('login.error.required'));
    } else if (/^\d+$/.test(value) && !/^0[689]\d{8}$/.test(value)) {
      setNameError(t('login.error.invalid_phone'));
    } else {
      setNameError('');
    }
  };

  const handleLogin = async () => {
    validateNameInput(name);
    if (!name.trim() || !password.trim() || nameError) {
      enqueueSnackbar(t('login.error.invalid_form'), { variant: 'error' });
      return;
    }

    const loginName = normalizeNameOrPhone(name);

    try {
      setLoading(true);
      const loginFunc = httpsCallable(functions, 'loginWithName');
      const response = await loginFunc({ name: loginName, password: password.trim() });
      const { token, role, issuedAt } = response.data || {};

      if (!token || !role) throw new Error(t('login.error.no_token'));

      await signInWithCustomToken(getAuth(), token);

      if (remember) {
        localStorage.setItem('savedName', name.trim());
        localStorage.setItem('savedPassword', password.trim());
      } else {
        localStorage.removeItem('savedName');
        localStorage.removeItem('savedPassword');
      }

      enqueueSnackbar(t('login.success'), { variant: 'success' });
      onLogin({ token, role, issuedAt: issuedAt || Date.now() });

    } catch (err) {
      console.error('Login error:', err);
      enqueueSnackbar(err.message || t('login.error.generic'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url(${BackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
        pt: 6
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 3,
          bgcolor: theme.palette.background.paper,
          boxShadow: 6,
          borderRadius: 3
        }}
      >
        <CardContent>
          {/* ✅ ชื่อร้านบนสุดในกล่อง login */}
          <Box textAlign="center" mb={2}>
           <Typography
  variant="h6"
  fontWeight="bold"
  color="success.main"
  sx={{
    borderBottom: '2px solid',
    display: 'inline-block',
    pb: 0.5,
  }}
>
  🥬 {t('login.shopTitle')}
</Typography>
          </Box>

          {/* ✅ Avatar */}
          <Box display="flex" justifyContent="center" mb={2}>
            <Avatar
              src={ProfileImage}
              sx={{ width: 72, height: 72, border: '3px solid #4caf50', borderRadius: 2 }}
              variant="rounded"
            />
          </Box>

          <Typography variant="h5" align="center" gutterBottom>
            {t('login.title')}
          </Typography>

          <TextField
            label={t('login.username_or_phone')}
            variant="outlined"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              validateNameInput(e.target.value);
            }}
            error={!!nameError}
            helperText={nameError}
          />
          <TextField
            label={t('login.password')}
            variant="outlined"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormControlLabel
            control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
            label={t('login.remember')}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleLogin}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : t('login.login_button')}
          </Button>

          <Button
            variant="text"
            fullWidth
            onClick={() => navigate('/resetpassword')}
            sx={{ mt: 1 }}
          >
            {t('login.forgot_password')}
          </Button>

          <Typography variant="body2" align="center" sx={{ mt: 3 }}>
            {t('login.no_account')}{' '}
            <MuiLink component="button" variant="body2" onClick={() => navigate('/register')} sx={{ fontWeight: 'bold' }}>
              {t('login.register_now')}
            </MuiLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPhone;