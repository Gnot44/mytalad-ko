import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Pagination, TextField, Collapse
} from '@mui/material';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { format } from 'date-fns';
import thLocale from 'date-fns/locale/th';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

function Ordersump() {
  const { t } = useTranslation();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const endOfDay = new Date();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [startDate, setStartDate] = useState(startOfDay);
  const [endDate, setEndDate] = useState(endOfDay);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);

  const [showCharts, setShowCharts] = useState(false);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'deliveryData'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleSearch = () => {
    if (endDate > startDate) {
      fetchOrders();
    } else {
      toast.error(t('ordersump.error.dateInvalid'));
    }
  };

  const handleToggleApproval = async (orderId, currentStatus) => {
    await updateDoc(doc(db, 'deliveryData', orderId), { paidstatus: !currentStatus });
    setOrders((prev) => prev.map((order) => order.id === orderId ? { ...order, paidstatus: !currentStatus } : order));
  };

  const formatDatesum = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return format(date, 'dd/MM/yy HH:mm');
  };

  const calculateApprovedSum = () => orders.filter(o => o.paidstatus).reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const calculateUnapprovedSum = () => orders.filter(o => !o.paidstatus).reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const countApprovedOrders = () => orders.filter(o => o.paidstatus).length;
  const countUnapprovedOrders = () => orders.filter(o => !o.paidstatus).length;
  const calculateCartTotal = (cart) => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={thLocale}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>{t('ordersump.title')}</Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <DateTimePicker label={t('ordersump.startDate')} value={startDate} onChange={setStartDate} renderInput={(params) => <TextField {...params} />} />
          <DateTimePicker label={t('ordersump.endDate')} value={endDate} onChange={setEndDate} minDate={startDate} renderInput={(params) => <TextField {...params} />} />
          <Button variant="contained" onClick={handleSearch}>{t('ordersump.search')}</Button>
          <Button variant="outlined" onClick={() => setShowCharts(!showCharts)}>
            {showCharts ? t('ordersump.hideCharts') : t('ordersump.toggleCharts')}
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('ordersump.table.time')}</TableCell>
                <TableCell>{t('ordersump.table.name')}</TableCell>
                <TableCell>{t('ordersump.table.totalPrice')}</TableCell>
                <TableCell>{t('ordersump.table.location')}</TableCell>
                <TableCell>{t('ordersump.table.approval')}</TableCell>
                <TableCell>{t('ordersump.table.proof')}</TableCell>
                <TableCell>{t('ordersump.table.phone')}</TableCell>
                <TableCell>{t('ordersump.table.tracking')}</TableCell>
                <TableCell>{t('ordersump.table.details')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{formatDatesum(order.date)}</TableCell>
                  <TableCell>{order.nameOrder}</TableCell>
                  <TableCell>{order.totalPrice?.toFixed(2)}</TableCell>
                  <TableCell>{order.deliveryLocation}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color={order.paidstatus ? 'error' : 'success'}
                      onClick={() => handleToggleApproval(order.id, order.paidstatus)}
                    >
                      {order.paidstatus ? t('ordersump.buttons.cancel') : t('ordersump.buttons.approve')}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {order.paymentProofUrl ? (
                      <img
                        src={order.paymentProofUrl}
                        alt="proof"
                        style={{ width: 60, height: 60, objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => { setSelectedImage(order.paymentProofUrl); setModalOpen(true); }}
                      />
                    ) : 'ไม่มี'}
                  </TableCell>
                  <TableCell>{order.phoneNumber}</TableCell>
                  <TableCell>{order.trackingNumber}</TableCell>
                  <TableCell>
                    <Button variant="outlined" onClick={() => { setSelectedOrderDetail(order); setDetailOpen(true); }}>
                      {t('ordersump.buttons.viewDetails')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <Pagination count={Math.ceil(orders.length / itemsPerPage)} page={currentPage} onChange={(e, page) => setCurrentPage(page)} color="primary" />
          </Box>
        </TableContainer>

        <Collapse in={showCharts}>
          <Box sx={{ my: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{t('ordersump.chart.summaryTitle')}</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: t('ordersump.chart.approved'), value: calculateApprovedSum() },
                    { name: t('ordersump.chart.unapproved'), value: calculateUnapprovedSum() }
                  ]}
                  cx="50%" cy="50%" outerRadius={100} dataKey="value" label
                >
                  <Cell fill="#4caf50" />
                  <Cell fill="#ff9800" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>{t('ordersump.chart.orderTitle')}</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: t('ordersump.chart.approved'), value: countApprovedOrders() },
                    { name: t('ordersump.chart.unapproved'), value: countUnapprovedOrders() }
                  ]}
                  cx="50%" cy="50%" outerRadius={100} dataKey="value" label
                >
                  <Cell fill="#2196f3" />
                  <Cell fill="#f44336" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Collapse>

        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="lg">
          <DialogTitle>{t('ordersump.dialog.proofTitle')}</DialogTitle>
          <DialogContent>
            <img src={selectedImage} alt="Proof" style={{ width: '100%' }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>{t('ordersump.buttons.close')}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{t('ordersump.dialog.orderDetailTitle')}</DialogTitle>
          <DialogContent dividers>
            {selectedOrderDetail?.cart?.map((item, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                <Typography><strong>{t('ordersump.dialog.product')}:</strong> {item.title}</Typography>
                <Typography><strong>{t('ordersump.dialog.code')}:</strong> {item.pid}</Typography>
                <Typography><strong>{t('ordersump.dialog.qty')}:</strong> {item.quantity}</Typography>
                <Typography><strong>{t('ordersump.dialog.price')}:</strong> {item.price}</Typography>
                <Typography><strong>{t('ordersump.dialog.total')}:</strong> {(item.price * item.quantity).toFixed(2)}</Typography>
                <Typography><strong>{t('ordersump.dialog.desc')}:</strong> {item.description}</Typography>
                {item.imageUrl && <img src={item.imageUrl} alt={item.title} style={{ width: '100px', marginTop: 8 }} />}
              </Box>
            ))}
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Typography variant="h6">
                {t('ordersump.dialog.orderTotal')}: {selectedOrderDetail ? calculateCartTotal(selectedOrderDetail.cart).toFixed(2) : 0} บาท
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailOpen(false)}>{t('ordersump.buttons.close')}</Button>
          </DialogActions>
        </Dialog>

        <ToastContainer />
      </Box>
    </LocalizationProvider>
  );
}

export default Ordersump;