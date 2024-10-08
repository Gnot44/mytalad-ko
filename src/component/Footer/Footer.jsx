import React, { useState } from 'react';

function Footer({ isDarkTheme, Popup_W }) {
  const [showPopup, setShowPopup] = useState(false);

  const TtalStyle = {
    color: isDarkTheme ? '#FFFFFF' : '#000000',
    backgroundColor: isDarkTheme ? '#1A1A2E' : '#F0F0F0',
    transition: 'color 0.3s ease, backgroundColor 0.3s ease',
    fontSize: '20px'
  };

  const togglePopup = () => {
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 1000); // 3 seconds
  };

  return (
    <footer className="bg-gradient-to-r from-white to-gray-100 shadow-lg fixed bottom-0 w-full border-t">
      <div className="flex justify-around items-center p-3">
        {/* Home Button */}
        <a href="/" className="flex flex-col items-center group">
          <div className="p-2 bg-red-100 rounded-full shadow-md group-hover:bg-red-500 transition duration-300 ease-in-out">
            <img src="/icons/home-icon.svg" alt="Home" className="w-6 h-6" />
          </div>
          <span className="text-sm text-gray-500 group-hover:text-red-500 transition duration-300">หน้าแรก</span>
        </a>

        {/* Promotions Button */}
        <a href="/promotions" className="flex flex-col items-center group">
          <div className="p-2 bg-green-100 rounded-full shadow-md group-hover:bg-green-500 transition duration-300 ease-in-out">
            <img src="/icons/promotion-icon.svg" alt="Promotions" className="w-6 h-6" />
          </div>
          <span className="text-sm text-gray-500 group-hover:text-green-500 transition duration-300">โปรโมชั่น</span>
        </a>

        {/* Points Button */}
        <a href="/points" className="flex flex-col items-center group">
          <div className="p-2 bg-yellow-100 rounded-full shadow-md group-hover:bg-yellow-500 transition duration-300 ease-in-out">
            <img src="/icons/points-icon.svg" alt="Points" className="w-6 h-6" />
          </div>
          <span className="text-sm text-gray-500 group-hover:text-yellow-500 transition duration-300">คะแนน</span>
        </a>

        {/* Profile Button */}
        <a href="/profile" className="flex flex-col items-center group">
          <div className="p-2 bg-blue-100 rounded-full shadow-md group-hover:bg-blue-500 transition duration-300 ease-in-out">
            <img src="/icons/profile-icon.svg" alt="Profile" className="w-6 h-6" />
          </div>
          <span className="text-sm text-gray-500 group-hover:text-blue-500 transition duration-300">ข้อมูลของฉัน</span>
        </a>
      </div>
    </footer>
  );
}

export default Footer;
