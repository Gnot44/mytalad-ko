import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const Login = ({ onLogin, isDarkTheme }) => {
  const [username, setUsername] = useState('customer');
  const [password, setPassword] = useState('');
  const [credentials, setCredentials] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCredentials = async () => {
      const querySnapshot = await getDocs(collection(db, "credentials"));
      const creds = {};
      querySnapshot.forEach((doc) => {
        creds[doc.data().username] = doc.data().password;
      });
      setCredentials(creds);
    };
    fetchCredentials();
  }, []);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if the user is a customer
    if (username === 'customer') {
      const user = { username, role: 'customer' };
      onLogin(user);
      navigate('/sidebar'); // Redirect to a customer-specific page
    } else if (credentials[username] && credentials[username] === password) {
      const userRole = username === 'admin' ? 'admin' : 'user';
      const user = { username, role: userRole };
      onLogin(user);
      navigate(userRole === 'admin' ? '/sidebar' : '/contact');
    } else {
      setErrorMessage('ชื่อผู้ใช้/รหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkTheme ? 'bg-gray-800' : 'bg-gradient-to-r from-blue-50 to-green-50'} px-6 py-8`}>
  <div className="text-center mb-8">
    <h1 className={`text-3xl md:text-5xl font-extrabold ${isDarkTheme ? 'text-yellow-300' : 'text-blue-800'} mb-4 flex items-center justify-center`}>
      <span className="mr-4 text-4xl">🥬</span>ยินดีต้อนรับสู่ร้านขายผักออนไลน์ ตลาดประโคนชัย
    </h1>
    <h2 className={`text-2xl md:text-4xl font-bold ${isDarkTheme ? 'text-yellow-200' : 'text-blue-700'}`}>
      <span className="mr-4 text-3xl">🥦</span>ร้าน บ.เบิร์ดดผักสด
    </h2>
  </div>
  <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-200">
    <h3 className="text-2xl md:text-3xl font-semibold mb-6 text-center text-gray-800">เข้าสู่ระบบ</h3>
    <form onSubmit={handleSubmit}>
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้ใช้</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="input input-bordered w-full border-blue-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`input input-bordered w-full border-blue-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 ${username === 'customer' ? 'hidden' : ''}`}
          // Hide password field if username is 'customer'
          disabled={username === 'customer'}
        />
      </div>
      {errorMessage && (
        <div className="mb-4 text-red-500 text-center">
          {errorMessage}
        </div>
      )}
      <button
        type="submit"
        className="btn btn-primary w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        เข้าร้านค้าเลย
      </button>
    </form>
  </div>
</div>

  
  );
};

export default Login;
