import React, { useState, useEffect } from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';

function Footer() {
  const [value, setValue] = useState(0);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData?.role) {
        setRole(userData.role);
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      setRole(null);
    }
  }, []);

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
      >
        <BottomNavigationAction label="" icon={<HomeIcon />} onClick={() => navigate('/sidebar')} />

        {/* เฉพาะ role customer เท่านั้น */}
        {role === 'customer' && (
          <>
            <BottomNavigationAction label="Tasks" icon={<AssignmentIcon />} onClick={() => navigate('/summandpay')} />
            <BottomNavigationAction label="Delivery" icon={<DeliveryDiningIcon />} onClick={() => navigate('/timeline')} />
          </>
        )}

        <BottomNavigationAction label="" icon={<PersonIcon />} />
      </BottomNavigation>
    </Paper>
  );
}

export default Footer;
