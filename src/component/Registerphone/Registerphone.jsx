import { useState, useCallback, useEffect } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase'; 
import bcrypt from "bcryptjs";
import { useNavigate } from 'react-router-dom';

const RegisterPhone = ({ onRegister }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
   const navigate = useNavigate();


  // Initialize reCAPTCHA verifier
    const setupRecaptcha = useCallback(() => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          setError('');
        },
        'expired-callback': () => {
          setError('reCAPTCHA หมดอายุ กรุณาลองใหม่');
        }
      });
    }, [auth]);
  
    useEffect(() => {
      setupRecaptcha();
      
      // Cleanup on component unmount
      return () => {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      };
    }, [setupRecaptcha]);

  // Send OTP function
  const sendOTP = async () => {
    if (!phone || phone.length < 9) {
      setError('กรุณากรอกเบอร์โทรที่ถูกต้อง');
      return;
    }

    setLoading(true);
    // setupRecaptcha();
    setError('');

    try {
      await window.recaptchaVerifier.verify();
            const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      // const appVerifier = await window.recaptchaVerifier.verify();
      // const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      // setError('');
      alert("ส่ง OTP แล้ว");
    } catch (error) {
      console.error("ส่ง OTP ไม่สำเร็จ:", error);
      setError("เบอร์โทรไม่ถูกต้องหรือ reCAPTCHA ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and register
  const verifyOTP = async () => {
    if (!otp || !confirmationResult) {
      setError('กรุณากรอก OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      const hashedPassword = await bcrypt.hash(password, 10);

      await setDoc(doc(db, "credentials", user.uid), {
        uid: user.uid,
        name,
        email,
        phone: user.phoneNumber,
        password: hashedPassword,
        role: "customer",
        createdAt: new Date()
      });

      alert("ลงทะเบียนสำเร็จ");
      // สร้าง object ผู้ใช้เพื่อส่งไปยัง handleRegister
    const userData = {
      uid: user.uid,
      phone: user.phoneNumber,
      role: "customer",
      name,
      email
    };

    alert("ลงทะเบียนสำเร็จ");
    onRegister(userData); // ส่งข้อมูลผู้ใช้ไปยังฟังก์ชันจัดการ
    navigate('/login'); // ย้ายการ navigate มาที่นี่แทน
    } catch (error) {
      console.error("OTP ไม่ถูกต้อง:", error);
      setError("OTP ไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  // // Cleanup reCAPTCHA on component unmount
  // useEffect(() => {
  //   return () => {
  //     if (window.recaptchaVerifier) {
  //       window.recaptchaVerifier.clear();
  //     }
  //   };
  // }, []);

  return (
    <div className="p-4 space-y-3">
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <input 
        type="text" 
        placeholder="ชื่อ" 
        value={name} 
        onChange={e => setName(e.target.value)} 
        className="input input-bordered w-full" 
        disabled={loading}
      />
      
      <input 
        type="email" 
        placeholder="อีเมล (ไม่จำเป็น)" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
        className="input input-bordered w-full" 
        disabled={loading}
      />
      
      <input 
        type="password" 
        placeholder="รหัสผ่าน" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
        className="input input-bordered w-full" 
        disabled={loading}
      />
      
      <input 
        type="text" 
        placeholder="เบอร์โทร (ไม่ต้องใส่ 0)" 
        value={phone} 
        onChange={e => setPhone(e.target.value)} 
        className="input input-bordered w-full" 
        disabled={loading}
      />
      
      <button 
        onClick={sendOTP} 
        className="btn btn-primary w-full"
        disabled={loading || !name || !password || !phone}
      >
        {loading ? 'กำลังส่ง...' : 'ส่ง OTP'}
      </button>

      {confirmationResult && (
        <>
          <input 
            type="text" 
            placeholder="กรอกรหัส OTP" 
            value={otp} 
            onChange={e => setOtp(e.target.value)} 
            className="input input-bordered w-full" 
            disabled={loading}
          />
          
          <button 
            onClick={verifyOTP} 
            className="btn btn-success w-full"
            disabled={loading || !otp}
          >
            {loading ? 'กำลังยืนยัน...' : 'ยืนยัน OTP และลงทะเบียน'}
          </button>
        </>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default RegisterPhone;