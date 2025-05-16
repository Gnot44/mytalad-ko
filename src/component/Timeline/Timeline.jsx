import React from 'react';
import { Button, Stack, Typography, Box, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import OrderListPage from '../Orderlist/OrderListPage';

const Timeline = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mx: 4, my: 4 }}>
      {/* Block 1 - รอการยืนยัน พร้อมปุ่มอยู่ขวา */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">รอการยืนยัน</Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/order-history')}>
          ดูประวัติการสั่งซื้อ
        </Button>
      </Stack>

      <OrderListPage
        title=""
        customFilter={{ status: false, paidstatus: false }}
      />

      <Divider sx={{ my: 4 }} />

      {/* Block 2 - ยืนยันแล้ว รอจัดส่ง */}
      <Typography variant="h5" sx={{ mb: 2 }}>ยืนยันแล้ว รอจัดส่ง</Typography>
      <OrderListPage
        title=""
        customFilter={{ status: false, paidstatus: true }}
      />
    </Box>
  );
};

export default Timeline;
