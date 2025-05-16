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
    TableBody, TableRow, TableCell, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { getAuth } from 'firebase/auth';


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

                    // ✅ แปลง +66 เป็น 0
                    const rawPhone = userData.phone || '';
                    const formattedPhone = rawPhone.startsWith('+66') ? '0' + rawPhone.slice(3) : rawPhone;
                    setPhoneNumber(formattedPhone);
                } else {
                    toast.info('ไม่พบข้อมูลผู้ใช้ใน credentials');
                }
            } catch (error) {
                console.error('Error fetching user info from credentials:', error);
            }
        };

        fetchUserInfo();
    }, []);

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
            toast.error('ไม่พบผู้ใช้งาน กรุณาล็อกอิน');
            return;
        }

        // ✅ ตรวจสอบทุกฟิลด์
        const newErrors = {
            nameOrder: !nameOrder.trim(),
            deliveryLocation: !deliveryLocation.trim(),
            phoneNumber: !phoneNumber.trim(),
            latLng: !latLng.lat || !latLng.lng,
            paymentProof: !paymentProof,
        };

        setErrors(newErrors);

        if (Object.values(newErrors).some((val) => val)) {
            toast.error('กรุณากรอกข้อมูลให้ครบ และแนบหลักฐานการโอนครับ');
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
            toast.error('อัปโหลดหลักฐานล้มเหลว');
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
            toast.success('บันทึกข้อมูลสำเร็จ');
            setIsModalVisible(true);
            localStorage.removeItem('paymentData');
            localStorage.removeItem('cart');
            navigate('/timeline');
        } catch (error) {
            console.error('Error saving data:', error);
            toast.error('บันทึกข้อมูลล้มเหลว');
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
                (error) => toast.error('Error retrieving location.'),
            );
        } else toast.error('Geolocation is not supported.');
    };

    const updateUserField = async (field, value) => {
        if (userDocId) {
            try {
                const userRef = doc(db, 'credentials', userDocId);

                if (field === 'phone') {
                    // ✅ แปลง 0... เป็น +66...
                    const normalizedPhone = value.startsWith('0') ? '+66' + value.slice(1) : value;
                    await updateDoc(userRef, { [field]: normalizedPhone });
                } else {
                    await updateDoc(userRef, { [field]: value });
                }
            } catch (error) {
                console.error('Error updating user data in credentials:', error);
            }
        }
    };


    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>สรุปรายการ</Typography>
            {paymentData ? (
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Link to="/sidebar">
                        <Button variant="outlined" sx={{ mb: 2 }}>
                            ย้อนกลับ
                        </Button>
                    </Link>
                    <TableContainer sx={{ mb: 4 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ชื่อ</TableCell>
                                    <TableCell>จำนวน-กก.</TableCell>
                                    <TableCell>ราคา/หน่วย</TableCell>
                                    <TableCell>รวม-บาท</TableCell>
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
                                {/* ✅ บรรทัดรวม */}
                                <TableRow sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>รวม</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                        {paymentData.cart.reduce((sum, item) => sum + Number(item.quantity), 0)}
                                    </TableCell>
                                    <TableCell />
                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                        {paymentData.cart.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TextField
                        label="ชื่อ"
                        value={nameOrder}
                        error={errors.nameOrder}
                        helperText={errors.nameOrder ? 'กรุณากรอกชื่อ' : ''}
                        onChange={(e) => { setNameOrder(e.target.value); setErrors(prev => ({ ...prev, nameOrder: false })); }}
                        fullWidth sx={{ mb: 2 }}
                    />

                    <TextField
                        label="สถานที่จัดส่ง/ทะเบียนรถ"
                        value={deliveryLocation}
                        error={errors.deliveryLocation}
                        helperText={errors.deliveryLocation ? 'กรุณากรอกสถานที่จัดส่ง' : ''}
                        onChange={(e) => { setDeliveryLocation(e.target.value); setErrors(prev => ({ ...prev, deliveryLocation: false })); }}
                        fullWidth sx={{ mb: 2 }}
                    />

                    <TextField
                        label="เบอร์โทรศัพท์"
                        value={phoneNumber}
                        error={errors.phoneNumber}
                        helperText={errors.phoneNumber ? 'กรุณากรอกเบอร์โทรศัพท์' : ''}
                        onChange={(e) => { setPhoneNumber(e.target.value); setErrors(prev => ({ ...prev, phoneNumber: false })); }}
                        fullWidth sx={{ mb: 2 }}
                    />

                    <Button variant="contained" onClick={handleGetCurrentLocation} sx={{ mb: 2 }}>
                        ใช้ตำแหน่งปัจจุบัน
                    </Button>

                    <Box sx={{ height: '400px', mb: 4, border: errors.latLng ? '2px solid red' : 'none' }}>
                        <MapContainer center={currentPosition || [13.7563, 100.5018]} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LocationMarker position={latLng} />
                            <LocationSetter setLatLng={setLatLng} centerLatLng={currentPosition} />
                        </MapContainer>
                    </Box>

                    <Typography>แนบหลักฐานการโอนเงิน:</Typography>
                    <input type="file" onChange={handlePaymentProofChange} />
                    {paymentProof && (
                        <Box sx={{ mt: 2 }}>
                            <img src={URL.createObjectURL(paymentProof)} alt="Preview" style={{ width: 150, borderRadius: 8 }} />
                        </Box>
                    )}
                    {errors.paymentProof && <Typography color="error">กรุณาแนบหลักฐาน</Typography>}

                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ mt: 4 }}
                        fullWidth
                        onClick={handleSaveInfo}
                        disabled={isSaving}
                    >
                        ยืนยันข้อมูล
                    </Button>

                </Paper>
            ) : (
                <Typography>ยังไม่มีรายการ กรุณาไปที่หน้าแรกเพื่อสั่งซื้อ</Typography>
            )}

            <Dialog open={isModalVisible} onClose={() => setIsModalVisible(false)}>
                <DialogTitle>ยืนยันแล้ว</DialogTitle>
                <DialogContent>
                    <Typography>หมายเลขติดตาม: {trackingNumber}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setIsModalVisible(false); window.location.reload(); }} variant="contained">ปิด</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isImageModalVisible} onClose={() => setIsImageModalVisible(false)}>
                <DialogContent>
                    <img src={qrcodeImage} alt="QR Code" style={{ width: '100%' }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsImageModalVisible(false)} variant="contained">ปิด</Button>
                </DialogActions>
            </Dialog>

            <ToastContainer />
        </Container>
    );
};

export default SummandPayPage;
