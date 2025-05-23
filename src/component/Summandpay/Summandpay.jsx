// SummandPayPage.jsx — รองรับ Theme (Dark/Light) + i18n
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import qrcodeImage from './16883358-396A-4ED4-9AE6-4E5A6729FA4A.jpg';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Button, Container, Typography, TextField, Box, Paper, TableContainer, Table, TableHead,
    TableBody, TableRow, TableCell, Dialog, DialogTitle, DialogContent, DialogActions, useTheme
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { getAuth } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

// Default Leaflet Icon Fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const LocationMarker = ({ position }) => position && <Marker position={position} />;
const LocationSetter = ({ setLatLng, centerLatLng }) => {
    const map = useMap();
    useEffect(() => { if (centerLatLng) map.setView(centerLatLng, map.getZoom()); }, [centerLatLng, map]);
    useMapEvents({ click: (e) => setLatLng(e.latlng) });
    return null;
};

const SummandPayPage = () => {
    const theme = useTheme();
    const { t } = useTranslation();

    const [paymentData, setPaymentData] = useState(null);
    const [deliveryLocation, setDeliveryLocation] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [nameOrder, setNameOrder] = useState('');
    const [paymentProof, setPaymentProof] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [latLng, setLatLng] = useState({ lat: null, lng: null });
    const [currentPosition, setCurrentPosition] = useState(null);
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [userDocId, setUserDocId] = useState(null);
    const [errors, setErrors] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const uid = getAuth().currentUser?.uid;
                if (!uid) return;
                const userQuery = query(collection(db, 'credentials'), where('uid', '==', uid));
                const querySnapshot = await getDocs(userQuery);
                if (!querySnapshot.empty) {
                    const docSnap = querySnapshot.docs[0];
                    const userData = docSnap.data();
                    setUserDocId(docSnap.id);
                    setNameOrder(userData.name || '');
                    const rawPhone = userData.phone || '';
                    const formattedPhone = rawPhone.startsWith('+66') ? '0' + rawPhone.slice(3) : rawPhone;
                    setPhoneNumber(formattedPhone);
                } else {
                    toast.info(t('summary.errors.userNotFound'));
                }
            } catch (error) {
                console.error('Error fetching user info from credentials:', error);
            }
        };
        fetchUserInfo();
    }, [t]);

    useEffect(() => {
        const data = localStorage.getItem('paymentData');
        if (data) setPaymentData(JSON.parse(data));
    }, []);

    const handlePaymentProofChange = (e) => {
        const file = e.target.files[0];
        setPaymentProof(file);
        if (file) {
            setErrors(prev => ({ ...prev, paymentProof: false }));
        }
    };

    const generateTrackingNumber = () => `BP${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const handleSaveInfo = async () => {
        const uid = getAuth().currentUser?.uid;
        if (!uid) {
            toast.error(t('summary.errors.userNotFound'));
            return;
        }
        const newErrors = {
            nameOrder: !nameOrder.trim(),
            deliveryLocation: !deliveryLocation.trim(),
            phoneNumber: !phoneNumber.trim(),
            latLng: !latLng.lat || !latLng.lng,
            paymentProof: !paymentProof,
        };
        setErrors(newErrors);
        if (Object.values(newErrors).some((val) => val)) {
            toast.error(t('summary.errors.incomplete'));
            return;
        }
        if (isSaving) return;
        setIsSaving(true);

        const trackingNumber = generateTrackingNumber();
        setTrackingNumber(trackingNumber);

        let paymentProofUrl = '';
        try {
            const storageRef = ref(storage, `paymentProofs/${paymentProof.name}`);
            await uploadBytes(storageRef, paymentProof);
            paymentProofUrl = await getDownloadURL(storageRef);
        } catch (error) {
            console.error('Error uploading payment proof:', error);
            toast.error(t('summary.errors.uploadFailed'));
            setIsSaving(false);
            return;
        }

        try {
            await addDoc(collection(db, 'deliveryData'), {
                ...paymentData,
                deliveryLocation,
                phoneNumber,
                nameOrder,
                trackingNumber,
                paymentProofUrl,
                status: false,
                paidstatus: false,
                date: new Date(),
                latitude: latLng.lat,
                longitude: latLng.lng,
                uid,
            });
            toast.success(t('summary.success'));
            setIsModalVisible(true);
            localStorage.removeItem('paymentData');
            localStorage.removeItem('cart');
            navigate('/timeline');
        } catch (error) {
            console.error('Error saving data:', error);
            toast.error(t('summary.errors.saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newLatLng = { lat: position.coords.latitude, lng: position.coords.longitude };
                    setLatLng(newLatLng);
                    setCurrentPosition(newLatLng);
                },
                (error) => toast.error('Error retrieving location.')
            );
        } else toast.error('Geolocation is not supported.');
    };

    const updateUserField = async (field, value) => {
        if (userDocId) {
            try {
                const userRef = doc(db, 'credentials', userDocId);
                const normalizedPhone = field === 'phone' && value.startsWith('0') ? '+66' + value.slice(1) : value;
                await updateDoc(userRef, { [field]: normalizedPhone });
            } catch (error) {
                console.error('Error updating user data in credentials:', error);
            }
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4, color: theme.palette.text.primary }}>
            <Typography variant="h4" gutterBottom>{t('summary.title')}</Typography>
            {paymentData ? (
                <Paper elevation={3} sx={{ p: 4, bgcolor: theme.palette.background.paper }}>
                    <Link to="/sidebar">
                        <Button variant="outlined" sx={{ mb: 2 }}>{t('summary.back')}</Button>
                    </Link>
                    <TableContainer sx={{ mb: 4 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('summary.name')}</TableCell>
                                    <TableCell>{t('summary.quantity')}</TableCell>
                                    <TableCell>{t('summary.unitPrice')}</TableCell>
                                    <TableCell>{t('summary.total')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paymentData.cart.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.title}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.price}</TableCell>
                                        <TableCell>{(item.quantity * item.price).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{t('summary.total')}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{paymentData.cart.reduce((sum, item) => sum + Number(item.quantity), 0)}</TableCell>
                                    <TableCell />
                                    <TableCell sx={{ fontWeight: 'bold' }}>{paymentData.cart.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TextField label={t('summary.name')} value={nameOrder} error={errors.nameOrder} helperText={errors.nameOrder ? t('summary.errors.nameRequired') : ''} onChange={(e) => { setNameOrder(e.target.value); setErrors(prev => ({ ...prev, nameOrder: false })); }} fullWidth sx={{ mb: 2 }} />
                    <TextField label={t('summary.deliveryLocation')} value={deliveryLocation} error={errors.deliveryLocation} helperText={errors.deliveryLocation ? t('summary.errors.locationRequired') : ''} onChange={(e) => { setDeliveryLocation(e.target.value); setErrors(prev => ({ ...prev, deliveryLocation: false })); }} fullWidth sx={{ mb: 2 }} />
                    <TextField label={t('summary.phone')} value={phoneNumber} error={errors.phoneNumber} helperText={errors.phoneNumber ? t('summary.errors.phoneRequired') : ''} onChange={(e) => { setPhoneNumber(e.target.value); setErrors(prev => ({ ...prev, phoneNumber: false })); }} fullWidth sx={{ mb: 2 }} />

                    <Button variant="contained" onClick={handleGetCurrentLocation} sx={{ mb: 2 }}>{t('summary.useCurrentLocation')}</Button>

                    <Box sx={{ height: '400px', mb: 4, border: errors.latLng ? '2px solid red' : 'none' }}>
                        <MapContainer center={currentPosition || [13.7563, 100.5018]} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LocationMarker position={latLng} />
                            <LocationSetter setLatLng={setLatLng} centerLatLng={currentPosition} />
                        </MapContainer>
                    </Box>

                    <Typography>{t('summary.uploadProof')}</Typography>
                    <input type="file" onChange={handlePaymentProofChange} />
                    {paymentProof && <Box sx={{ mt: 2 }}><img src={URL.createObjectURL(paymentProof)} alt="Preview" style={{ width: 150, borderRadius: 8 }} /></Box>}
                    {errors.paymentProof && <Typography color="error">{t('summary.errors.attachProof')}</Typography>}

                    <Button variant="contained" color="primary" sx={{ mt: 4 }} fullWidth onClick={handleSaveInfo} disabled={isSaving}>{t('summary.submit')}</Button>
                </Paper>
            ) : (
                <Typography>{t('summary.noData')}</Typography>
            )}

            <Dialog open={isModalVisible} onClose={() => setIsModalVisible(false)}>
                <DialogTitle>{t('summary.confirmed')}</DialogTitle>
                <DialogContent>
                    <Typography>{t('summary.trackingNumber')} {trackingNumber}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setIsModalVisible(false); window.location.reload(); }} variant="contained">{t('common.close')}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isImageModalVisible} onClose={() => setIsImageModalVisible(false)}>
                <DialogContent>
                    <img src={qrcodeImage} alt="QR Code" style={{ width: '100%' }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsImageModalVisible(false)} variant="contained">{t('common.close')}</Button>
                </DialogActions>
            </Dialog>

            <ToastContainer />
        </Container>
    );
};

export default SummandPayPage;
