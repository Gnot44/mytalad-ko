// eslint-disable-next-line no-unused-vars 
import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Navbar from "./component/Navbar/Navbar";
import Sidebar from './component/Sidebar/Sidebar';
import Footer from './component/Footer/Footer';
import Contact from './component/Contact/Contact';
import Condata from './component/Condata/Condata';
import { useNavigate } from 'react-router-dom';
import Summandpay from './component/Summandpay/Summandpay';
import Ordersump from './component/Ordersump/Ordersump';
import Timeline from './component/Timeline/Timeline';
import LoginPhone from './component/Loginphone/Loginphone';
import RegisterPhone from './component/Registerphone/Registerphone';
import OrderHistoryPage from './component/Orderhistory/OrderHistoryPage';
import { Backdrop, CircularProgress, Typography, Box, Alert, AlertTitle } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ResetPasswordPhone from './component/Resetpassw/ResetPasswordPhone';


const ProtectedRoute = ({ user, roles, children }) => {
  if (!user) {
    return <Navigate to="/login" />;
  }
  // eslint-disable-next-line react/prop-types
  if (roles && roles.length && !roles.includes(user.role)) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(
    JSON.parse(localStorage.getItem('isDarkTheme')) || false
  );

  const [deliveryCount, setDeliveryCount] = useState(0);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user')) || null
  );
  const navigate = useNavigate();

  const location = useLocation();

  // ✅ ป้องกันไม่ให้ redirect ถ้าอยู่หน้า public (เช่น login, register)
  useEffect(() => {
  const publicPaths = ['/login', '/register', '/resetpassword'];
  if (!user && !publicPaths.includes(location.pathname)) {
    navigate('/login');
  }
}, [user, navigate, location]);


  // useEffect(() => {
  //   if (!user) {
  //     navigate('/login');
  //   }
  // }, [user, navigate]);

  const toggleTheme = () => {
    setIsDarkTheme(prevIsDarkTheme => !prevIsDarkTheme);
  };

  // const handleLogin = (user) => {
  //   setUser(user);
  //   localStorage.setItem('user', JSON.stringify(user));
  // };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    // ✅ Optional: Redirect ตาม role
    if (userData.role === 'admin') {
      navigate('/ordersump');
    } else if (userData.role === 'customer') {
      navigate('/sidebar');
    } else {
      navigate('/contact');
    }
  };


  const handleRegister = (userData) => {
    console.log('User registered:', userData);
    // สามารถอัปเดต state global ที่นี่ถ้าต้องการ
    // เช่น setUser(userData); ถ้ามี state ผู้ใช้
    // แต่ไม่จำเป็นต้อง alert หรือ navigate ที่นี่แล้ว
  };

  // const handleRegister = (userData) => {
  //   setUser(userData);
  //   localStorage.setItem('user', JSON.stringify(userData));
  //   navigate(userData.role === 'admin' ? '/ordersump' : '/contact');
  // };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);



  useEffect(() => {
    localStorage.setItem('isDarkTheme', JSON.stringify(isDarkTheme));
  }, [isDarkTheme]);

  
  const SuccessAlert = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      zIndex: (theme) => theme.zIndex.snackbar + 999,
      mt: 2,
    }}
  >
    <Alert
      severity="success"
      icon={<CheckCircleOutlineIcon fontSize="inherit" />}
      sx={{ width: '90%', maxWidth: 500 }}
    >
      <AlertTitle>สำเร็จ</AlertTitle>
      ยืนยันรายการเรียบร้อยแล้ว
    </Alert>
  </Box>
);

  const ErrorAlert = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      zIndex: (theme) => theme.zIndex.snackbar + 999,
      mt: 2,
    }}
  >
    <Alert
      severity="error"
      icon={<ErrorOutlineIcon fontSize="inherit" />}
      sx={{ width: '90%', maxWidth: 500 }}
    >
      <AlertTitle>ข้อผิดพลาด</AlertTitle>
      รายการยังไม่ถูกเลือก
    </Alert>
  </Box>
);

  const Loadiy = ({ open = true }) => (
  <Backdrop
    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 999 }}
    open={open}
  >
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <CircularProgress color="inherit" sx={{ mb: 2 }} />
      <Typography variant="h6">Loading...</Typography>
    </Box>
  </Backdrop>
);

  const hideFooterPaths = ['/login', '/register'];
const shouldShowFooter = !hideFooterPaths.includes(location.pathname);


  return (
    <div style={{ backgroundColor: isDarkTheme ? '#2D2A55' : '#FFFFFF', minHeight: '100vh', transition: 'background-color 0.3s ease' }}>
      <Navbar
        isDarkTheme={isDarkTheme}
        toggleTheme={toggleTheme}
        currentDateTime={currentDateTime}
        deliveryCount={deliveryCount}
        onLogout={handleLogout} // Pass the logout function to Navbar
        user={user} // Pass user to Navbar
      />
       <main style={{ flex: '1 0 auto', paddingBottom: '40px' }}> {/* ✅ ให้ main ยืดอัตโนมัติ */}
        <Routes>
          <Route path="/register" element={<RegisterPhone onRegister={handleRegister} />} />
          <Route path="/login" element={<LoginPhone isDarkTheme={isDarkTheme} onLogin={handleLogin} />} />
          <Route path="/resetpassword" element={<ResetPasswordPhone />} />


          <Route path="/contact" element={
            <ProtectedRoute user={user} roles={['user', 'admin']}>
              <Contact isDarkTheme={isDarkTheme} updateDeliveryCount={setDeliveryCount} Load_iy={Loadiy} />
            </ProtectedRoute>
          } />
          <Route path="/sidebar" element={
            <ProtectedRoute user={user} roles={['admin', 'customer']}>
              <Sidebar isDarkTheme={isDarkTheme} Popup_W={ErrorAlert} Success_W={SuccessAlert} Load_iy={Loadiy} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/condata" element={
            <ProtectedRoute user={user} roles={['customer', 'user', 'admin']}>
              <Condata isDarkTheme={isDarkTheme} Load_iy={Loadiy} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/summandpay" element={
            <ProtectedRoute user={user} roles={['customer']}>
              <Summandpay isDarkTheme={isDarkTheme} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/order-history" element={
            <ProtectedRoute user={user} roles={['customer']}>
              <OrderHistoryPage isDarkTheme={isDarkTheme} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/ordersump" element={
            <ProtectedRoute user={user} roles={['admin']}>
              <Ordersump isDarkTheme={isDarkTheme} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/timeline" element={
            <ProtectedRoute user={user} roles={['customer']}>
              <Timeline isDarkTheme={isDarkTheme} user={user} />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to={user ? "/sidebar" : "/login"} />} />
        </Routes>
      </main>
      {shouldShowFooter && (
  <Footer isDarkTheme={isDarkTheme} Popup_W={ErrorAlert} style={{ flexShrink: 0 }} />
)}
    </div>
  );
}
