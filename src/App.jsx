// App.jsx — ใช้ MUI ThemeProvider แทน isDarkTheme
import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Backdrop,
  CircularProgress,
  Typography,
  Box,
  Alert,
  AlertTitle
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Navbar from "./component/Navbar/Navbar";
import Sidebar from './component/Sidebar/Sidebar';
import Footer from './component/Footer/Footer';
import Contact from './component/Contact/Contact';
import Condata from './component/Condata/Condata';
import Summandpay from './component/Summandpay/Summandpay';
import Ordersump from './component/Ordersump/Ordersump';
import Timeline from './component/Timeline/Timeline';
import LoginPhone from './component/Loginphone/Loginphone';
import RegisterPhone from './component/Registerphone/Registerphone';
import OrderHistoryPage from './component/Orderhistory/OrderHistoryPage';
import ResetPasswordPhone from './component/Resetpassw/ResetPasswordPhone';
import './i18n'; // ⬅️ เพิ่มบรรทัดนี้ก่อน App render


const ProtectedRoute = ({ user, roles, children }) => {
  if (!user) return <Navigate to="/login" />;
  if (roles && roles.length && !roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
};

export default function App() {
  const [mode, setMode] = useState(localStorage.getItem('muiThemeMode') || 'light');
  const theme = createTheme({ palette: { mode } });
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('muiThemeMode', newMode);
  };

  const [deliveryCount, setDeliveryCount] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const publicPaths = ['/login', '/register', '/resetpassword'];
    if (!user && !publicPaths.includes(location.pathname)) {
      navigate('/login');
    }
  }, [user, navigate, location]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.role === 'admin') navigate('/ordersump');
    else if (userData.role === 'customer') navigate('/sidebar');
    else navigate('/contact');
  };

  const handleRegister = (userData) => {
    console.log('User registered:', userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const SuccessAlert = () => (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: (theme) => theme.zIndex.snackbar + 999, mt: 2 }}>
      <Alert severity="success" icon={<CheckCircleOutlineIcon fontSize="inherit" />} sx={{ width: '90%', maxWidth: 500 }}>
        <AlertTitle>สำเร็จ</AlertTitle>
        ยืนยันรายการเรียบร้อยแล้ว
      </Alert>
    </Box>
  );

  const ErrorAlert = () => (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: (theme) => theme.zIndex.snackbar + 999, mt: 2 }}>
      <Alert severity="error" icon={<ErrorOutlineIcon fontSize="inherit" />} sx={{ width: '90%', maxWidth: 500 }}>
        <AlertTitle>ข้อผิดพลาด</AlertTitle>
        รายการยังไม่ถูกเลือก
      </Alert>
    </Box>
  );

  const Loadiy = ({ open = true }) => (
    <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 999 }} open={open}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress color="inherit" sx={{ mb: 2 }} />
        <Typography variant="h6">Loading...</Typography>
      </Box>
    </Backdrop>
  );

  const hideFooterPaths = ['/login', '/register'];
  const shouldShowFooter = !hideFooterPaths.includes(location.pathname);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ minHeight: '100vh' }}>
        <Navbar
          toggleTheme={toggleTheme}
          currentDateTime={currentDateTime}
          deliveryCount={deliveryCount}
          onLogout={handleLogout}
          user={user}
        />
        <main style={{ flex: '1 0 auto', paddingBottom: '40px' }}>
          <Routes>
            <Route path="/register" element={<RegisterPhone onRegister={handleRegister} />} />
            <Route path="/login" element={<LoginPhone onLogin={handleLogin} />} />
            <Route path="/resetpassword" element={<ResetPasswordPhone />} />

            <Route path="/contact" element={<ProtectedRoute user={user} roles={['user', 'admin']}><Contact updateDeliveryCount={setDeliveryCount} Load_iy={Loadiy} /></ProtectedRoute>} />
            <Route path="/sidebar" element={<ProtectedRoute user={user} roles={['admin', 'customer']}><Sidebar Popup_W={ErrorAlert} Success_W={SuccessAlert} Load_iy={Loadiy} user={user} /></ProtectedRoute>} />
            <Route path="/condata" element={<ProtectedRoute user={user} roles={['customer', 'user', 'admin']}><Condata Load_iy={Loadiy} user={user} /></ProtectedRoute>} />
            <Route path="/summandpay" element={<ProtectedRoute user={user} roles={['customer']}><Summandpay user={user} /></ProtectedRoute>} />
            <Route path="/order-history" element={<ProtectedRoute user={user} roles={['customer']}><OrderHistoryPage user={user} /></ProtectedRoute>} />
            <Route path="/ordersump" element={<ProtectedRoute user={user} roles={['admin']}><Ordersump user={user} /></ProtectedRoute>} />
            <Route path="/timeline" element={<ProtectedRoute user={user} roles={['customer']}><Timeline user={user} /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to={user ? "/sidebar" : "/login"} />} />
          </Routes>
        </main>
        {shouldShowFooter && <Footer Popup_W={ErrorAlert} />}
      </div>
    </ThemeProvider>
  );
}
