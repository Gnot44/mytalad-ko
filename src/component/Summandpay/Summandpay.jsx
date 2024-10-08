import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import qrcodeImage from './16883358-396A-4ED4-9AE6-4E5A6729FA4A.jpg';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast, ToastContainer } from 'react-toastify';

// Fix default marker icon issue with leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const LocationMarker = ({ position }) => {
    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const LocationSetter = ({ setLatLng, centerLatLng }) => {
    const map = useMap();
    useEffect(() => {
        if (centerLatLng) {
            map.setView(centerLatLng, map.getZoom());
        }
    }, [centerLatLng, map]);
    
    const mapEvents = useMapEvents({
        click(e) {
            setLatLng(e.latlng);
        },
    });
    
    return null;
};


const SummandPayPage = () => {
    const [paymentData, setPaymentData] = useState(null);
    const [deliveryLocation, setDeliveryLocation] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [nameOrder, setNameOrder] = useState('');
    const [paymentProof, setPaymentProof] = useState(null);
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [documentData, setDocumentData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [latLng, setLatLng] = useState({ lat: null, lng: null });
    const [currentPosition, setCurrentPosition] = useState(null);

    const handleClickMap = (e) => {
        setLatLng({ lat: e.latlng.lat, lng: e.latlng.lng });
    };

    useEffect(() => {
        const data = localStorage.getItem('paymentData');
        if (data) {
            const parsedData = JSON.parse(data);
            setPaymentData(parsedData);
            setNameOrder(parsedData.nameOrder || '');
            setDeliveryLocation(parsedData.deliveryLocation || '');
            setPhoneNumber(parsedData.phoneNumber || '');
        }
    }, []);

    const handleNameOrder = (e) => {
        const newNameOrder = e.target.value;
        setNameOrder(newNameOrder);
        localStorage.setItem('nameOrder', newNameOrder);
    };

    const handleLocationChange = (e) => {
        const newLocation = e.target.value;
        setDeliveryLocation(newLocation);
        localStorage.setItem('deliveryLocation', newLocation);
        setShowPaymentDetails(newLocation);
    };

    const handlePhoneNumberChange = (e) => {
        const value = e.target.value;
        if (/^\d{0,10}$/.test(value)) {
            const newPhoneNumber = e.target.value;
            setPhoneNumber(newPhoneNumber);
            localStorage.setItem('phoneNumber', newPhoneNumber);
            setShowPaymentDetails(newPhoneNumber);
        }
    };

    useEffect(() => {
        const savedNameOrder = localStorage.getItem('nameOrder');
        const savedLocation = localStorage.getItem('deliveryLocation');
        const savedPhoneNumber = localStorage.getItem('phoneNumber');

        if (savedNameOrder) setNameOrder(savedNameOrder);
        if (savedLocation) setDeliveryLocation(savedLocation);
        if (savedPhoneNumber) setPhoneNumber(savedPhoneNumber);
    }, []);

    const handlePaymentProofChange = (e) => setPaymentProof(e.target.files[0]);

    const generateTrackingNumber = () => {
        const randomNum = Math.floor(1000000000 + Math.random() * 9000000000); // Generate random 10-digit number
        return `BP${randomNum}`;
    };

    const handleSaveInfo = async () => {
       // Check if latLng or phoneNumber is null or undefined
    if (!latLng || !currentPosition) {
        toast.error('ปักหมุดในแผนที่ด้วยครับ');
        return;
    }
        if (isSaving) return; // Prevent further execution if already saving

        setIsSaving(true); // Disable the save button
        const trackingNumber = generateTrackingNumber();
        setTrackingNumber(trackingNumber); // Store the tracking number in state
        const updatedData = { ...paymentData, deliveryLocation, phoneNumber, nameOrder, trackingNumber, latLng };
        setPaymentData(updatedData);
        localStorage.setItem('paymentData', JSON.stringify(updatedData));

        let paymentProofUrl = '';
        if (paymentProof) {
            try {
                const storageRef = ref(storage, `paymentProofs/${paymentProof.name}`);
                await uploadBytes(storageRef, paymentProof);
                paymentProofUrl = await getDownloadURL(storageRef);
            } catch (error) {
                console.error('Error uploading payment proof:', error);
            }
        }

        try {
            if (latLng.lat !== undefined && latLng.lng !== undefined){
            await addDoc(collection(db, 'deliveryData'), {
                cart: paymentData.cart,
                totalPrice: paymentData.totalPrice,
                totalQual: paymentData.totalQual,
                cumulativeQuantities: paymentData.cumulativeQuantities,
                deliveryLocation,
                numberOfCardsSent: paymentData.numberOfCardsSent,
                nameOrder,
                phoneNumber,
                paymentProofUrl,
                trackingNumber, // Save the tracking number
                status: false,
                paidstatus: false,
                date: new Date(),
                latitude: latLng.lat,
                longitude: latLng.lng,
            });
            console.log("Data saved successfully");
        } else {
            console.error("LatLng is not defined");
        }
            localStorage.removeItem('paymentData');
            localStorage.removeItem('cart');
            setIsModalVisible(true);
            console.log("LatLng data:", latLng);
            
        } catch (error) {
            console.error('Error saving data:', error);
        } finally {
            setIsSaving(false); // Re-enable the save button
        }
    };

    const closeModal = () => {
        setIsModalVisible(false);
        localStorage.removeItem('paymentData');
        localStorage.removeItem('cart');
        window.location.reload();
    };

    const closeImageModal = () => setIsImageModalVisible(false);

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newLatLng = { lat: latitude, lng: longitude };
                    setLatLng(newLatLng);
                    setCurrentPosition(newLatLng);
                    console.log('Current position:', newLatLng); // Log current position
    
                    // Move the map to the current location
                    const map = document.querySelector('.leaflet-container').__leaflet_map__;
                    map.setView(newLatLng, 13); // You can adjust the zoom level as needed
                },
                (error) => {
                    console.error('Error retrieving location:', error);
                    alert('Error retrieving location. Please check your settings.');
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    };
    const isFormValid = deliveryLocation.trim() !== '' && /^\d{10}$/.test(phoneNumber) && paymentProof;


    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 relative">
    <h2 className="text-2xl sm:text-3xl font-bold mb-6">สรุปรายการ</h2>
    {paymentData ? (
        <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-lg shadow-lg relative">
            <Link to="/sidebar">
                <button className="absolute top-1 right-6 text-sm px-3 py-1 bg-gray-200 text-gray-700 border border-gray-300 rounded hover:bg-gray-300">
                    ย้อนกลับ
                </button>
            </Link>
            <div className="overflow-x-auto mt-8">
                <table className="table-auto w-full mb-6">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="py-3 px-4 text-left">ชื่อ</th>
                            <th className="py-3 px-4 text-left">จำนวน-กก.</th>
                            <th className="py-3 px-4 text-left">ราคา/หน่วย</th>
                            <th className="py-3 px-4 text-left">รวม-บาท</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paymentData.cart.map((item) => (
                            <tr key={item.id} className="border-t">
                                <td className="py-3 px-4">{item.title}</td>
                                <td className="py-3 px-4">{item.quantity}</td>
                                <td className="py-3 px-4">{item.price}</td>
                                <td className="py-3 px-4">{(item.quantity * item.price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ToastContainer />
            <div className="text-left">
                <p className="text-lg font-semibold mb-4">ยอดรวม: {(paymentData.totalPrice).toFixed(2)} บาท</p>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">ชื่อ:</label>
                    <input
                        type="text"
                        value={nameOrder}
                        onChange={handleNameOrder}
                        className="input input-bordered w-full mt-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">สถานที่จัดส่ง/ทะเบียนรถ:</label>
                    <input
                        type="text"
                        value={deliveryLocation}
                        onChange={handleLocationChange}
                        className="input input-bordered w-full mt-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>

                <div className="mb-4 relative">
                    <button
                        onClick={handleGetCurrentLocation}
                        className="mr-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        เรียกสถานที่ปัจจุบัน
                    </button>
                    <MapContainer center={currentPosition || [13.7563, 100.5018]} zoom={13} style={{ height: '400px', width: '100%', zIndex: 0 }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <LocationMarker position={latLng} />
                        <LocationSetter setLatLng={setLatLng} centerLatLng={currentPosition} />
                    </MapContainer>
                </div>

                <div className="mb-4 text-left">
                    <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์:</label>
                    <input
                        type="text"
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        className="input input-bordered w-full mt-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="กรุณากรอกเบอร์โทรศัพท์"
                    />
                </div>

                <div className="mb-4">
                    <p className="text-lg font-semibold mb-2">กรุณาชำระเงินตาม ยอดรวม ที่:</p>
                    <p>เลขบัญชี: 092834008908</p>
                    <p>ชื่อบัญชี: นาย ทวีพล บอกประโคน</p>
                    <div className="mt-2 cursor-pointer" onClick={() => setIsImageModalVisible(true)}>
                        <img src={qrcodeImage} alt="QR Code" className="w-32 h-32 mx-auto rounded-lg shadow-md" />
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">แนบหลักฐานการโอนเงิน:</label>
                        <input
                            type="file"
                            onChange={handlePaymentProofChange}
                            className="mt-2"
                        />
                    </div>
                </div>

                <div className="text-orange-500">***ตรวจสอบข้อมูลให้ถูกต้องก่อนกดยืนยัน</div>
                <button
                    className={`btn btn-primary w-full py-3 mt-4 ${isFormValid ? '' : 'opacity-50 cursor-not-allowed'}`}
                    onClick={handleSaveInfo}
                    disabled={!isFormValid}
                >
                    ยืนยันข้อมูล
                </button>
            </div>
        </div>
    ) : (
        <p className="text-lg">ยังไม่มีรายการไปที่หน้าแรกเพื่อสั่งของเลย...</p>
    )}

    {/* Modal for Save Info */}
    {isModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70 z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-2xl font-bold mb-4 text-center text-green-600">
                    ยืนยันแล้วรอพี่เบิร์ดตรวจสอบ!
                </h3>
                <p className="text-lg mb-2 text-center">
                    <span className="font-semibold text-blue-600">หมายเลขติดตาม:</span>
                    <span className="font-bold text-blue-800">{trackingNumber}</span>
                </p>
                <p className="text-sm mb-4 text-center text-gray-600">
                    ***โปรดบันทึกหมายเลขติดตาม เพื่อเช็ค
                </p>
                <div className="flex justify-center">
                    <button
                        className="btn btn-primary w-full py-3 mt-4"
                        onClick={closeModal}
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    )}

    {/* Modal for QR Code Image */}
    {isImageModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative z-60">
                <img src={qrcodeImage} alt="QR Code" className="w-full" />  
                <button
                    className="btn btn-primary w-full py-2 mt-4"
                    onClick={closeImageModal}
                >
                    ปิด
                </button>
            </div>
        </div>
    )}
</div>

    );
};

export default SummandPayPage;
