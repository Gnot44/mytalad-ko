import React, { useState } from 'react';
import profileImage from './0044E069-2400-48B0-99D5-3FF33FC3228B.jpg';
import { Link } from 'react-router-dom';
import iavatar from './3941A5C4-CA39-4544-86E3-963E55BD4D1A.png';

const Navbar = ({ isDarkTheme, toggleTheme, currentDateTime, deliveryCount,
  onLogout,user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isAdminnav = user?.role === 'admin'; // Assuming user object has a role property
  const isUsernav = user?.role === 'user'; // Assuming user object has
  const isCustnav = user?.role === 'customer'; // Assuming user object has a role property

  const navStyle = {
    backgroundColor: isDarkTheme ? '#1A1A2E' : '#E0F2F1',
    transition: 'background-color 0.3s ease',
    fontFamily: 'Baskervville SC, serif',
    justifyContent: 'space-between',
    padding: '10px',
  };

  const LogStyle = {
    backgroundColor: isDarkTheme ? '#1A1A2E' : '#E0F2F1',
    color: isDarkTheme ? '#FFFFFF' : '#000000',
    transition: 'background-color 0.3s ease',
    fontFamily: 'Baskervville SC, serif',
    justifyContent: 'space-between',
    padding: '10px',
  };

  const frontStyle = {
    color: isDarkTheme ? '#FFFFFF' : '#000000',
    transition: 'color 0.3s ease',
    fontFamily: 'IBM Plex Sans Thai, sans-serif',
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? <mark key={index}>{part}</mark> : part
    );
  };

  const ThemeToggle = () => (
    <label className="swap swap-rotate flex items-center">
      <input
        type="checkbox"
        checked={isDarkTheme}
        onChange={toggleTheme}
        className="hidden"
      />
      <span className="toggle-label ml-2 cursor-pointer" style={frontStyle}>
        {isDarkTheme ? '🌙' : '☀️'}
      </span>
    </label>
  );

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="navbar bg-blue-500 flex flex-col md:flex-row items-center" style={navStyle}>
  <div className="flex items-center w-full md:w-auto mb-2 md:mb-0">
    <div className="w-10 h-10 rounded-full overflow-hidden mr-2" onClick={handleImageClick}>
      <img
        alt="Profile"
        src={profileImage}
        className="w-full h-full object-cover cursor-pointer"
      />
    </div>
    {(isAdminnav || isCustnav) && (
      <a className="btn btn-ghost text-white text-xl hover:bg-blue-400" style={frontStyle}>
        <Link to="/sidebar">หน้าแรก</Link>
      </a>
    )}
    {isCustnav && (
      <a className="btn btn-ghost text-white text-xl hover:bg-blue-400" style={frontStyle}>
        <Link to="/summandpay">สรุป</Link>
      </a>
    )}
    {isAdminnav && (
      <a className="btn btn-ghost text-white text-xl hover:bg-blue-400" style={frontStyle}>
        <Link to="/ordersump">ออเดอร์</Link>
      </a>
    )}
    {isCustnav && (
      <a className="btn btn-ghost text-white text-xl hover:bg-blue-400" style={frontStyle}>
        <Link to="/timeline">เช็คสถานะ</Link>
      </a>
    )}
    {user ? (
      <>
        {(isAdminnav || isUsernav) && (
          <a className="btn btn-ghost text-white text-xl hover:bg-blue-400" style={frontStyle}>
            <Link to="/contact">ส่ง</Link>
          </a>
        )}
        {(isAdminnav || isUsernav) && (
          <a className="btn btn-ghost text-white text-xl hover:bg-blue-400" style={frontStyle}>
            <Link to="/condata">รวมผัก</Link>
          </a>
        )}
      </>
    ) : null}
  </div>
  <div className="flex items-center">
    <div className="datetime ml-2 text-white" style={frontStyle}>
      {currentDateTime.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} {' '}
      {currentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </div>
    {user ? (
      <>
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle text-white hover:bg-blue-400">
            {(isAdminnav || isUsernav) && (
              <div className="indicator">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="badge badge-sm indicator-item">{deliveryCount}</span>
              </div>
            )}
          </div>
          {(isAdminnav || isUsernav) && (
            <div
              tabIndex={0}
              className="card card-compact dropdown-content bg-blue-300 text-white z-[1] mt-3 w-full sm:w-52 shadow-lg p-4 mx-2 sm:mx-0">
              <div className="card-body">
                <span className="text-lg font-bold">{deliveryCount} ที่ยังไม่ได้ส่ง</span>
                <span className="text-info">Subtotal: $99</span>
                <div className="card-actions">
                  <button className="btn btn-primary btn-block mt-2 bg-blue-400 hover:bg-blue-500">View cart</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    ) : null}
    
    <ThemeToggle />
    {user ? (
     <div className="relative z-10" style={navStyle}>
     <ul className="menu menu-horizontal px-1">
       <li>
         <details>
           <summary className="cursor-pointer">
             <img
               src={iavatar || 'default-avatar.png'}
               alt="Profile"
               className="w-8 h-8 rounded-full"
             />
           </summary>
   
           <ul className="dropdown-content mt-1 p-2 bg-[#E6F7F8] text-black shadow rounded-box w-24" style={LogStyle}>
             <li>
               <a className="dropdown-item hover:bg-[#D1EEF0]">Profile</a>
             </li>
             <li onClick={onLogout}>
               <a className="dropdown-item hover:bg-[#D1EEF0]">Logout</a>
             </li>
           </ul>
   
         </details>
       </li>
     </ul>
   </div>
   

    ) : null}
  </div>
  {isModalOpen && (
    <div className="modal modal-open">
      <div className="modal-box bg-blue-500 text-white">
        <img alt="Profile Large" src={profileImage} className="w-full h-full object-cover" />
        <div className="modal-action">
          <button className="btn bg-blue-400 hover:bg-blue-500" onClick={handleCloseModal}>ปิด</button>
        </div>
      </div>
    </div>
  )}
</div>

  );
};

export default Navbar;
