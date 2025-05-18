// Navbar.jsx — ปรับปุ่มภาษาให้ใช้ไอคอนธงจาก flag-icons แบบ toggle ปุ่มเดียว
import React, { useState } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Menu, MenuItem, Avatar, Badge, Tooltip,
  Switch, Box, Drawer, List, ListItem, ListItemText
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import profileImage from './3941A5C4-CA39-4544-86E3-963E55BD4D1A.png';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import 'flag-icons/css/flag-icons.min.css'; // ✅ import flag-icons

const Navbar = ({ toggleTheme, currentDateTime, deliveryCount, onLogout, user }) => {
  const { t } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);
  const handleLangToggle = () => {
    const newLang = language === 'th' ? 'en' : 'th';
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
  };
  const flagClass = language === 'th' ? 'fi fi-th' : 'fi fi-gb';

  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const isAdmin = user?.role === 'admin';
  const isUser = user?.role === 'user';
  const isCustomer = user?.role === 'customer';

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const menuItems = [
    { label: t('home'), path: '/sidebar', show: isAdmin || isCustomer },
    { label: t('summaryy'), path: '/summandpay', show: isCustomer },
    { label: t('orders'), path: '/ordersump', show: isAdmin },
    { label: t('status'), path: '/timeline', show: isCustomer },
    { label: t('delivery'), path: '/contact', show: isAdmin || isUser },
    { label: t('aggregate'), path: '/condata', show: isAdmin || isUser },
  ].filter(item => item.show);


  return (
    <AppBar position="static" color="default" sx={{
      bgcolor: theme.palette.background.default,
      color: theme.palette.text.primary,
      boxShadow: 3
    }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {user && (
            <IconButton onClick={() => setDrawerOpen(true)} color="inherit">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {currentDateTime.toLocaleDateString('en-GB')} {currentDateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Typography>
        </Box>

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

          {/* ✅ ปุ่มเดียว toggle ภาษาแบบธง */}
          <Tooltip title="เปลี่ยนภาษา">
            <IconButton onClick={handleLangToggle}>
              <span className={flagClass} style={{ fontSize: '1.5rem' }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="เปลี่ยนธีม">
            <Switch
              checked={isDark}
              onChange={toggleTheme}
              icon={<LightModeIcon />}
              checkedIcon={<DarkModeIcon />}
            />
          </Tooltip>

          {user && (
            <>
             <Tooltip title={t('changeTheme')}>
                <IconButton onClick={handleMenuOpen} size="small">
                  <Avatar src={profileImage} />
                </IconButton>
              </Tooltip>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
               <MenuItem onClick={handleMenuClose}>{t('profile')}</MenuItem>
<MenuItem onClick={() => { handleMenuClose(); onLogout(); }}>{t('logout')}</MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.default,
            color: theme.palette.text.primary,
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
                  '&:hover': { bgcolor: theme.palette.action.hover },
                  color: theme.palette.text.primary,
                }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ sx: { color: theme.palette.text.primary } }}
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
