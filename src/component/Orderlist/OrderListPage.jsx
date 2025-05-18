// ✅ OrderListPage.jsx — รองรับ i18n + รับ startDate, endDate, shouldFetch + reset loop
import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { getAuth } from 'firebase/auth';
import {
  Container, Card, CardContent, CardActions, Typography, Button,
  Collapse, Box, Pagination, Divider, Chip, Skeleton
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const OrderListPage = ({ title, customFilter = {}, startDate, endDate, shouldFetch, onFetched }) => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const itemsPerPage = 10;

  const fetchUserOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const uid = getAuth().currentUser?.uid;
      if (!uid) {
        setError(t('order.error.noUser'));
        setLoading(false);
        return;
      }

      const conditions = [where('uid', '==', uid)];
      Object.entries(customFilter).forEach(([field, value]) => {
        conditions.push(where(field, '==', value));
      });

      if (startDate) {
        conditions.push(where('date', '>=', Timestamp.fromDate(new Date(startDate))));
      }
      if (endDate) {
        conditions.push(where('date', '<=', Timestamp.fromDate(new Date(endDate))));
      }

      const q = query(collection(db, 'deliveryData'), ...conditions);
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    } catch (e) {
      setError(t('order.error.fetchFail'));
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shouldFetch) {
      fetchUserOrders().finally(() => {
        onFetched?.(); // ✅ Reset flag after fetching
      });
    }
  }, [shouldFetch]);

  const handleExpandClick = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handlePageChange = (_, value) => {
    setPage(value);
    setExpandedId(null);
  };

  const getOrderStatusText = (order) => {
    if (!order.paidstatus) return t('order.status.waiting');
    if (order.paidstatus && !order.status) return t('order.status.confirmed');
    if (order.paidstatus && order.status) return t('order.status.delivered');
    return '';
  };

  const getOrderStatusColor = (order) => {
    if (!order.paidstatus) return 'warning';
    if (order.paidstatus && !order.status) return 'info';
    if (order.paidstatus && order.status) return 'success';
    return 'default';
  };

  const paginatedOrders = orders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {title && (
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
      )}

      {loading && (
        <Box textAlign="center" mt={4}>
          <Skeleton variant="text" width={200} height={30} />
          <Skeleton variant="rectangular" width="100%" height={300} sx={{ mt: 2 }} />
        </Box>
      )}

      {error && <Typography color="error" textAlign="center">{error}</Typography>}

      {!loading && orders.length === 0 && (
        <Typography textAlign="center" color="textSecondary" sx={{ mt: 4 }}>{t('order.empty')}</Typography>
      )}

      {paginatedOrders.map((order) => (
        <Card key={order.id} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight="bold">{t('order.trackingNumber')}: {order.trackingNumber}</Typography>
              <Chip label={getOrderStatusText(order)} color={getOrderStatusColor(order)} variant="filled" />
            </Box>
          </CardContent>

          <CardActions>
            <Button size="small" variant="outlined" onClick={() => handleExpandClick(order.id)}>
              {expandedId === order.id ? t('order.hideDetail') : t('order.viewDetail')}
            </Button>
          </CardActions>

          <Collapse in={expandedId === order.id} timeout="auto" unmountOnExit>
            <Divider />
            <Box p={2}>
              {order.cart && order.cart.map((item) => (
                <Box key={item.id} mb={1}>
                  <Typography>• {item.title} - {item.quantity} {t('order.kg')} x {item.price} {t('order.baht')} = {(item.quantity * item.price).toFixed(2)} {t('order.baht')}</Typography>
                </Box>
              ))}
              {order.totalPrice && (
                <Box mt={2}>
                  <Typography>
                    {t('order.totalPrice')}: {order.totalPrice.toFixed(2)} {t('order.baht')}
                  </Typography>
                </Box>
              )}

              {order.paymentProofUrl && (
                <Box mt={2}>
                  <Typography>{t('order.paymentProof')}:</Typography>
                  <Box component="img" src={order.paymentProofUrl} alt="Payment Proof" sx={{ width: 150, borderRadius: 1, mt: 1 }} />
                </Box>
              )}
              {order.imageUrl && (
                <Box mt={2}>
                  <Typography>{t('order.deliveryProof')}:</Typography>
                  <Box component="img" src={order.imageUrl} alt="Delivery Proof" sx={{ width: 150, borderRadius: 1, mt: 1 }} />
                </Box>
              )}
            </Box>
          </Collapse>
        </Card>
      ))}

      {orders.length > itemsPerPage && (
        <Box mt={4} display="flex" justifyContent="center">
          <Pagination
            count={Math.ceil(orders.length / itemsPerPage)}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Container>
  );
};

export default OrderListPage;
