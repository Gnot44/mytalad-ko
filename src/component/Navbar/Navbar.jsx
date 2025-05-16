import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Menu, MenuItem, Avatar, Badge, Tooltip, Switch, Box, Drawer, List, ListItem, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { Link } from 'react-router-dom';
import profileImage from './3941A5C4-CA39-4544-86E3-963E55BD4D1A.png';

const Navbar = ({ isDarkTheme, toggleTheme, currentDateTime, deliveryCount, onLogout, user }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isUser = user?.role === 'user';
  const isCustomer = user?.role === 'customer';

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const menuItems = [
    { label: 'หน้าแรก', path: '/sidebar', show: isAdmin || isCustomer },
    { label: 'สรุป', path: '/summandpay', show: isCustomer },
    { label: 'ออเดอร์', path: '/ordersump', show: isAdmin },
    { label: 'เช็คสถานะ', path: '/timeline', show: isCustomer },
    { label: 'ส่ง', path: '/contact', show: isAdmin || isUser },
    { label: 'รวมผัก', path: '/condata', show: isAdmin || isUser },
  ].filter(item => item.show);

  return (
    <AppBar position="static" color="default" sx={{
      bgcolor: isDarkTheme ? '#1A1A2E' : '#FFFFFF', color: isDarkTheme ? '#FFFFFF' : '#000000',  // ✅ เพิ่มตรงนี้
      boxShadow: 3
    }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', }}>
        {/* Left Section */}
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
           {user && (
            <>
            <IconButton onClick={() => setDrawerOpen(true)} color="inherit">
              <MenuIcon />
            </IconButton>
          </>
          )}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {currentDateTime.toLocaleDateString('en-GB')} {currentDateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Typography>
        </Box>

        {/* Right Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {(isAdmin || isUser) && (
            <Tooltip title="รายการที่ยังไม่ได้ส่ง">
              <IconButton color="inherit">
                <Badge badgeContent={deliveryCount} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="เปลี่ยนธีม">
            <Switch
              checked={isDarkTheme}
              onChange={toggleTheme}
              icon={<LightModeIcon />}
              checkedIcon={<DarkModeIcon />}
            />
          </Tooltip>

          {user && (
            <>
              <Tooltip title="เมนูผู้ใช้">
                <IconButton onClick={handleMenuOpen} size="small">
                  <Avatar src={profileImage} />
                </IconButton>
              </Tooltip>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleMenuClose}>โปรไฟล์</MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); onLogout(); }}>ออกจากระบบ</MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>

      {/* Drawer Menu */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: isDarkTheme ? '#1A1A2E' : '#FFFFFF',
            color: isDarkTheme ? '#FFFFFF' : '#000000',
          }
        }}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setDrawerOpen(false)}
        >
          <List>
            {menuItems.map((item, index) => (
              <ListItem
                button
                key={index}
                component={Link}
                to={item.path}
                sx={{
                  '&:hover': {
                    bgcolor: isDarkTheme ? '#2D2A55' : '#f0f0f0',
                  },
                  color: isDarkTheme ? '#FFFFFF' : '#000000',
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    sx: { color: isDarkTheme ? '#FFFFFF' : '#000000' }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
