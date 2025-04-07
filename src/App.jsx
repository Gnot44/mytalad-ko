// eslint-disable-next-line no-unused-vars 
import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Navbar from "./component/Navbar/Navbar";
import Sidebar from './component/Sidebar/Sidebar';
import Footer from './component/Footer/Footer';
import Contact from './component/Contact/Contact';
import Condata from './component/Condata/Condata';
import Login from './component/Login/Login';
import { useNavigate } from 'react-router-dom';
import Summandpay from './component/Summandpay/Summandpay';
import Ordersump from './component/Ordersump/Ordersump';
import Timeline from './component/Timeline/Timeline';

const ProtectedRoute = ({ user, roles, children }) => {
  if (!user) {
    return <Navigate to="/login" />;
  }
  // eslint-disable-next-line react/prop-types
  if (roles && roles.length && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const toggleTheme = () => {
    setIsDarkTheme(prevIsDarkTheme => !prevIsDarkTheme);
  };

  const handleLogin = (user) => {
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

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
    <div
      role="alert"
      className="alert alert-success"
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        margin: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '8px',
        backgroundColor: '#c3e6cb',
        color: '#000000',
        border: '1px solid #c3e6cb',
        borderRadius: '4px',
        zIndex: '9999',
        width: '90%',
        maxWidth: '500px',
      }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>ยืนยันรายการเรียบร้อยแล้ว</span>
    </div>
  );

  const ErrorAlert = () => (
    <div
      role="alert"
      className="alert alert-error"
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        margin: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '8px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        zIndex: '9999',
        width: '90%',
        maxWidth: '500px',
      }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span style={{ marginTop: '8px' }}>รายการยังไม่ถูกเลือก</span>
    </div>
  );

  const Loadiy = () => (
    <div
      className="loading-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: '',
        zIndex: '9999'
      }}
    >
      <progress className="progress w-56" style={{ marginBottom: '16px' }}></progress>
      <p>Loading...</p>
    </div>
  );

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
      <main>
        <Routes>
          <Route path="/login" element={<Login isDarkTheme={isDarkTheme} onLogin={handleLogin} />} />
          <Route path="/contact" element={
            <ProtectedRoute user={user} roles={['user', 'admin']}>
              <Contact isDarkTheme={isDarkTheme} updateDeliveryCount={setDeliveryCount} Load_iy={Loadiy} />
            </ProtectedRoute>
          } />
          <Route path="/sidebar" element={
            <ProtectedRoute user={user} roles={['admin','customer']}>
              <Sidebar isDarkTheme={isDarkTheme} Popup_W={ErrorAlert} Success_W={SuccessAlert} Load_iy={Loadiy} user={user}/>
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
          <Route path="/unauthorized" element={<div>ไม่มีข้อมูลแสดง</div>} />
          <Route path="/" element={<Navigate to={user ? "/contact" : "/login"} />} />
        </Routes>
      </main>
      <Footer isDarkTheme={isDarkTheme} Popup_W={ErrorAlert} />
    </div>
  );
}
