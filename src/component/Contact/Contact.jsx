// Contact.jsx — ใช้ MUI Theme อย่างถูกต้อง พร้อมแก้ UI บนมือถือ + scroll + i18n
import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import 'react-datepicker/dist/react-datepicker.css';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import thLocale from 'date-fns/locale/th';
import { TextField, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Contact = ({ updateDeliveryCount, Load_iy }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDarkTheme = theme.palette.mode === 'dark';

  const [deliveryData, setDeliveryData] = useState([]);
  const [successList, setSuccessList] = useState([]);
  const [isContentVisible, setIsContentVisible] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState({});
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'deliveryData'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filteredData = data.filter(item => {
          const itemDate = new Date(item.date.seconds * 1000);
          return itemDate.toDateString() === selectedDate.toDateString();
        });
        setDeliveryData(filteredData.filter(item => !item.status));
        setSuccessList(filteredData.filter(item => item.status));
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    updateDeliveryCount(deliveryData.length);
  }, [deliveryData, updateDeliveryCount]);

  const handleConfirm = async (index) => {
    const confirmedItem = deliveryData[index];
    if (confirmedItem?.paidstatus) {
      const docRef = doc(db, 'deliveryData', confirmedItem.id);
      await updateDoc(docRef, { status: true });
      setSuccessList(prev => [...prev, confirmedItem]);
      setDeliveryData(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleBackConfirm = async (index) => {
    const item = successList[index];
    const docRef = doc(db, 'deliveryData', item.id);
    await updateDoc(docRef, { status: false });
    setDeliveryData(prev => [...prev, item]);
    setSuccessList(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (event, itemId) => {
    const file = event.target.files[0];
    if (file) {
      const storageRef = ref(storage, `deliveryImages/${itemId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      const docRef = doc(db, 'deliveryData', itemId);
      await updateDoc(docRef, { imageUrl });
      setDeliveryData(prev => prev.map(i => i.id === itemId ? { ...i, imageUrl } : i));
      setSuccessList(prev => prev.map(i => i.id === itemId ? { ...i, imageUrl } : i));
    }
  };

  const allStyle = {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.default,
    transition: 'color 0.3s ease, background-color 0.3s ease',
    fontFamily: 'IBM Plex Sans Thai, sans-serif',
    fontSize: '16px',
  };

  const SucStyle = {
    backgroundColor: '#90EE90',
    color: '#000',
    fontFamily: 'IBM Plex Sans Thai, sans-serif',
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return `${date.toLocaleDateString('th-TH')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return loading ? <Load_iy /> : (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-2 overflow-y-scroll scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-gray-500" style={{ maxHeight: 'calc(100vh - 100px)' }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={thLocale}>
            <DatePicker
              label={t('contact.selectDate')}
              value={selectedDate}
              onChange={setSelectedDate}
              slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
            />
          </LocalizationProvider>
          <h2 className="font-bold">{t('contact.pending')} : {deliveryData.length}</h2>
          {deliveryData.map((d, i) => (
            <div key={i} className="card glass mb-4" style={allStyle}>
              <div className="card-body">
                <h3 className="card-title">{t('contact.set')} {d.numberOfCardsSent} - {formatDate(d.date)}</h3>
                <p>{t('contact.name')}: {d.nameOrder}</p>
                <p>{t('contact.location')}: {d.deliveryLocation}</p>
                <p>{t('contact.total')}: {d.totalPrice.toFixed(2)} {t('contact.baht')}</p>
                <ul>{d.cart.map((item, j) => <li key={j}>{item.title}: {item.quantity} {t('contact.kg')}</li>)}</ul>
                {d.imageUrl && <img src={d.imageUrl} className="w-32 h-32 object-cover rounded-md mt-2" onClick={() => setModalImage(d.imageUrl)} />}
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, d.id)} />
                <button className="btn btn-primary mt-2" disabled={!d.paidstatus} onClick={() => handleConfirm(i)}>{t('contact.markDelivered')}</button>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full md:w-1/2 p-2 overflow-y-scroll scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-gray-500" style={{ ...allStyle, backgroundColor: theme.palette.background.paper, maxHeight: 'calc(100vh - 100px)' }}>
          <h2 className="font-bold">{t('contact.delivered')} : {successList.length}</h2>
          <button className="btn btn-secondary mb-2" onClick={() => setIsContentVisible(prev => !prev)}>
            {isContentVisible ? t('contact.hideContent') : t('contact.showContent')}
          </button>
          {successList.map((d, i) => (
            <div key={i} className="card glass mb-4" style={SucStyle}>
              <div className="card-body">
                <h3 className="card-title">{t('contact.set')} {d.numberOfCardsSent} - {formatDate(d.date)}</h3>
                <p>{t('contact.name')}: {d.nameOrder}</p>
                <p>{t('contact.location')}: {d.deliveryLocation}</p>
                {isContentVisible && <>
                  <p>{t('contact.total')}: {d.totalPrice.toFixed(2)} {t('contact.baht')}</p>
                  <ul>{d.cart.map((item, j) => <li key={j}>{item.title}: {item.quantity} {t('contact.kg')}</li>)}</ul>
                  {d.imageUrl && <img src={d.imageUrl} className="w-32 h-32 object-cover rounded-md mt-2" onClick={() => setModalImage(d.imageUrl)} />}
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, d.id)} />
                </>}
                <button className="btn btn-primary mt-2" onClick={() => handleBackConfirm(i)}>{t('contact.undo')}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setModalImage(null)}>
          <div className="relative">
            <img src={modalImage} className="max-w-screen-sm max-h-screen object-contain" />
            <button className="absolute top-2 right-2 bg-white p-2 rounded-full">✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
