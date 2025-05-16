import React from 'react';
import { Button, Stack, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import OrderListPage from '../Orderlist/OrderListPage';

const OrderHistoryPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mx: 4, my: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold">
          ประวัติการสั่งซื้อ
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/timeline')}>
          ถอยกลับ
        </Button>
      </Stack>

      {/* รายการจัดส่งสำเร็จแล้ว */}
      <OrderListPage
        title=""
        customFilter={{ status: true, paidstatus: true }}
      />
    </Box>
  );
};

export default OrderHistoryPage;
