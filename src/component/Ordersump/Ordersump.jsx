// Ordersump.jsx - Clean Full View with Approval Actions and Toggleable Charts

import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TableSortLabel, Pagination, TextField, Collapse
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

function Ordersump() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const endOfDay = new Date();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'asc' });
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
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleSearch = () => {
    if (endDate > startDate) {
      fetchOrders();
    } else {
      toast.error("กรุณาเลือกวันที่ให้ถูกต้อง");
    }
  };

  const handleToggleApproval = async (orderId, currentStatus) => {
    await updateDoc(doc(db, 'deliveryData', orderId), { paidstatus: !currentStatus });
    setOrders((prev) =>
      prev.map((order) => order.id === orderId ? { ...order, paidstatus: !currentStatus } : order)
    );
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
        <Typography variant="h4" gutterBottom>สรุปออเดอร์</Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <DateTimePicker label="วัน/เวลาเริ่มต้น" value={startDate} onChange={(newValue) => setStartDate(newValue)} renderInput={(params) => <TextField {...params} />} />
          <DateTimePicker label="วัน/เวลาสิ้นสุด" value={endDate} onChange={(newValue) => setEndDate(newValue)} minDate={startDate} renderInput={(params) => <TextField {...params} />} />
          <Button variant="contained" color="primary" onClick={handleSearch}>ค้นหาวันที่</Button>
          <Button variant="outlined" onClick={() => setShowCharts(!showCharts)}>{showCharts ? 'ซ่อนกราฟ' : 'แสดงกราฟ'}</Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>เวลา</TableCell>
                <TableCell>ชื่อ</TableCell>
                <TableCell>ราคารวม</TableCell>
                <TableCell>สถานที่จัดส่ง</TableCell>
                <TableCell>การอนุมัติ</TableCell>
                <TableCell>หลักฐาน</TableCell>
                <TableCell>เบอร์โทร</TableCell>
                <TableCell>เลขออเดอร์</TableCell>
                <TableCell>รายละเอียด</TableCell>
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
                      {order.paidstatus ? 'ยกเลิก' : 'อนุมัติ'}
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
                    <Button variant="outlined" onClick={() => { setSelectedOrderDetail(order); setDetailOpen(true); }}>ดูรายละเอียด</Button>
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
            <Typography variant="h6" sx={{ mb: 2 }}>📊 สรุปยอดรวมราคาทั้งหมด</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'อนุมัติแล้ว', value: calculateApprovedSum() },
                    { name: 'ยังไม่อนุมัติ', value: calculateUnapprovedSum() }
                  ]}
                  cx="50%" cy="50%" outerRadius={100}
                  dataKey="value"
                  label
                >
                  <Cell fill="#4caf50" />
                  <Cell fill="#ff9800" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>📦 สรุปจำนวนออเดอร์</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'อนุมัติแล้ว', value: countApprovedOrders() },
                    { name: 'ยังไม่อนุมัติ', value: countUnapprovedOrders() }
                  ]}
                  cx="50%" cy="50%" outerRadius={100}
                  dataKey="value"
                  label
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
          <DialogTitle>หลักฐานการโอน</DialogTitle>
          <DialogContent>
            <img src={selectedImage} alt="Proof" style={{ width: '100%' }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalOpen(false)}>ปิด</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>รายละเอียดออเดอร์</DialogTitle>
          <DialogContent dividers>
            {selectedOrderDetail?.cart?.map((item, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                <Typography><strong>ชื่อสินค้า:</strong> {item.title}</Typography>
                <Typography><strong>รหัสสินค้า:</strong> {item.pid}</Typography>
                <Typography><strong>จำนวน:</strong> {item.quantity}</Typography>
                <Typography><strong>ราคา:</strong> {item.price}</Typography>
                <Typography><strong>รวม:</strong> {(item.price * item.quantity).toFixed(2)}</Typography>
                <Typography><strong>คำอธิบาย:</strong> {item.description}</Typography>
                {item.imageUrl && <img src={item.imageUrl} alt={item.title} style={{ width: '100px', marginTop: 8 }} />}
              </Box>
            ))}
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Typography variant="h6">
                ✅ ราคารวมทั้งออเดอร์: {selectedOrderDetail ? calculateCartTotal(selectedOrderDetail.cart).toFixed(2) : 0} บาท
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailOpen(false)}>ปิด</Button>
          </DialogActions>
        </Dialog>

        <ToastContainer />
      </Box>
    </LocalizationProvider>
  );
}

export default Ordersump;
