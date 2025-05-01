// src/component/Login/LoginPhone.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const LoginPhone = ({ onLogin, isDarkTheme }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const auth = getAuth();

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

  // Validate phone number format
  const validatePhoneNumber = (number) => {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(number);
  };

  const sendOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('กรุณากรอกเบอร์โทรในรูปแบบ +66xxxxxxxxx');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await window.recaptchaVerifier.verify();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setStep(2);
    } catch (error) {
      console.error('Error sending OTP:', error);
      let errorMessage = 'ไม่สามารถส่งรหัส OTP ได้';
      
      switch (error.code) {
        case 'auth/invalid-phone-number':
          errorMessage = 'เบอร์โทรศัพท์ไม่ถูกต้อง';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'ส่งคำขอบ่อยเกินไป กรุณารอสักครู่';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
      setupRecaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('กรุณากรอกรหัส OTP 6 หลัก');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      const userData = {
        uid: user.uid,
        phone: user.phoneNumber,
        role: 'customer' // Consider fetching role from backend instead
      };
      onLogin(userData);
    } catch (error) {
      console.error('OTP verification failed:', error);
      let errorMessage = 'รหัส OTP ไม่ถูกต้อง';
      
      switch (error.code) {
        case 'auth/invalid-verification-code':
          errorMessage = 'รหัส OTP ไม่ถูกต้อง';
          break;
        case 'auth/code-expired':
          errorMessage = 'รหัส OTP หมดอายุ';
          setStep(1);
          setupRecaptcha();
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkTheme ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <div className="w-full max-w-md p-6 bg-base-100 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-center mb-4">เข้าสู่ระบบด้วยเบอร์โทรศัพท์</h2>
        
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <>
            <input
              type="tel"
              placeholder="กรอกเบอร์โทร เช่น +66912345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="input input-bordered w-full mb-4"
              disabled={isLoading}
            />
            <div id="recaptcha-container" />
            <button
              className="btn btn-primary w-full"
              onClick={sendOTP}
              disabled={isLoading || !phoneNumber}
            >
              {isLoading ? 'กำลังส่ง...' : 'ส่ง OTP'}
            </button>
          </>
        )}
        
        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="กรอกรหัส OTP 6 หลัก"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input input-bordered w-full mb-4"
              disabled={isLoading}
              maxLength={6}
            />
            <button
              className="btn btn-success w-full"
              onClick={verifyOTP}
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยัน OTP'}
            </button>
            <button
              className="btn btn-ghost w-full mt-2"
              onClick={() => {
                setStep(1);
                setOtp('');
                setupRecaptcha();
              }}
              disabled={isLoading}
            >
              กลับไปส่ง OTP ใหม่
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPhone;