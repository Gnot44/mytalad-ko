// ✅ Timeline.jsx — แสดง 2 สถานะในหน้าเดียว ใช้ช่วงวันที่เดียวร่วมกัน
import React, { useState } from 'react';
import { Button, Stack, Typography, Box, Divider, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import OrderListPage from '../Orderlist/OrderListPage';
import { useTranslation } from 'react-i18next';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const Timeline = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const today = new Date();
   const todayStart = new Date(today.setHours(0, 0, 0, 0)); // 00:00
   const todayEnd = new Date();
   todayEnd.setHours(23, 59, 59, 999); // 23:59:59.999
 
   const [startDate, setStartDate] = useState(todayStart);
   const [endDate, setEndDate] = useState(todayEnd);
  const [shouldFetch, setShouldFetch] = useState(true);

  return (
    <Box sx={{ mx: 4, my: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">{t('timeline.title')}</Typography>
        <Button variant="contained" onClick={() => navigate('/order-history')}>
          {t('timeline.viewHistory')}
        </Button>
      </Stack>

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <DatePicker label={t('order.filter.startDate')} value={startDate} onChange={setStartDate} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <DatePicker label={t('order.filter.endDate')} value={endDate} onChange={setEndDate} />
          </Grid>
          <Grid item xs={12} sm={4} display="flex" alignItems="center">
            <Button fullWidth variant="contained" onClick={() => setShouldFetch(true)}>
              {t('order.filter.search')}
            </Button>
          </Grid>
        </Grid>
      </LocalizationProvider>

      {/* Block 1 - รอการยืนยัน */}
      <Typography variant="h6" sx={{ mb: 1 }}>{t('timeline.pending')}</Typography>
      <OrderListPage
        title=""
        customFilter={{ status: false, paidstatus: false }}
        startDate={startDate}
        endDate={endDate}
        shouldFetch={shouldFetch}
        onFetched={() => setShouldFetch(false)}
      />

      <Divider sx={{ my: 4 }} />

      {/* Block 2 - ยืนยันแล้ว */}
      <Typography variant="h6" sx={{ mb: 1 }}>{t('timeline.confirmedPendingDelivery')}</Typography>
      <OrderListPage
        title=""
        customFilter={{ status: false, paidstatus: true }}
        startDate={startDate}
        endDate={endDate}
        shouldFetch={shouldFetch}
        onFetched={() => setShouldFetch(false)}
      />
    </Box>
  );
};

export default Timeline;
