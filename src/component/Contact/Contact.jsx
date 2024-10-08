import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, storage } from '../../firebase'; // Import storage from firebase
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { th } from 'date-fns/locale';
import { format } from 'date-fns';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Contact = ({ isDarkTheme, updateDeliveryCount, Load_iy }) => {
  const [deliveryData, setDeliveryData] = useState([]);
  const [successList, setSuccessList] = useState([]);
  const [isContentVisible, setIsContentVisible] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState({});
  const [modalImage, setModalImage] = useState(null); // State for modal image

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

        const notSentData = filteredData.filter(item => !item.status);
        const sentData = filteredData.filter(item => item.status);

        setDeliveryData(notSentData);
        setSuccessList(sentData);
      } catch (error) {
        console.error("Error fetching data: ", error);
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
    if (confirmedItem && confirmedItem.paidstatus) {
      const docRef = doc(db, 'deliveryData', confirmedItem.id);
      await updateDoc(docRef, { status: true });

      const newSuccessList = [...successList, confirmedItem];
      setSuccessList(newSuccessList);

      const newDeliveryData = deliveryData.filter((_, idx) => idx !== index);
      setDeliveryData(newDeliveryData);
    }
  };

  const handleBackConfirm = async (index) => {
    const itemToMoveBack = successList[index];
    if (itemToMoveBack) {
      const docRef = doc(db, 'deliveryData', itemToMoveBack.id);
      await updateDoc(docRef, { status: false });

      const newDeliveryData = [...deliveryData, itemToMoveBack];
      setDeliveryData(newDeliveryData);

      const newSuccessList = successList.filter((_, idx) => idx !== index);
      setSuccessList(newSuccessList);
    }
  };

  const handleImageUpload = async (event, itemId) => {
    const file = event.target.files[0];
    if (file) {
      const storageRef = ref(storage, `deliveryImages/${itemId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      const docRef = doc(db, 'deliveryData', itemId);
      await updateDoc(docRef, { imageUrl });

      // Update local state
      setDeliveryData(deliveryData.map(item => 
        item.id === itemId ? { ...item, imageUrl } : item
      ));
      setSuccessList(successList.map(item => 
        item.id === itemId ? { ...item, imageUrl } : item
      ));
    }
  };

  const handleFileChange = (event, itemId) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImage(prev => ({ ...prev, [itemId]: url }));
      handleImageUpload(event, itemId);
    }
  };

  const handleImageClick = (imageUrl) => {
    setModalImage(imageUrl); // Set the image URL for the modal
  };

  const closeModal = () => {
    setModalImage(null); // Clear the image URL to close the modal
  };

  const toggleContentVisibility = () => {
    setIsContentVisible(!isContentVisible);
  };

  const allStyle = {
    color: isDarkTheme ? '#FFFFFF' : '#000000',
    backgroundColor: isDarkTheme ? '#1A1A2E' : '#F0F0F0',
    transition: 'color 0.3s ease, background-color 0.3s ease',
    fontFamily: 'IBM Plex Sans Thai, sans-serif',
    fontSize: '16px',
  };

  const labelStyle = {
    color: isDarkTheme ? '#FFFFFF' : '#000000',
    transition: 'color 0.3s ease, background-color 0.3s ease',
    fontFamily: 'IBM Plex Sans Thai, sans-serif',
    fontSize: '16px',
  };

  const SucStyle = {
    color: isDarkTheme ? '#000000' : '#000000',
    backgroundColor: isDarkTheme ? '#90EE90' : '#90EE90',
    transition: 'color 0.3s ease, background-color 0.3s ease',
    fontFamily: 'IBM Plex Sans Thai, sans-serif',
    fontSize: '16px',
  };

  const smallTextStyle = {
    fontSize: '14px',
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
  
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return loading ? (
    <Load_iy />
  ) : (
    <div className="flex flex-col h-screen">
      <div className="flex flex-col md:flex-row h-full">
        {/* Delivery Data Section */}
        <div className="flex-1 p-2 overflow-auto" style={{ maxHeight: "calc(100vh - 100px)" }}>
          <h1 className="text-lg font-bold mb-4" style={allStyle}>
            {/* Date Picker Section */}
            <label className="block mb-2">เลือกวันที่ :
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="dd/MM/yyyy"
                locale={th} // Apply Thai localization
                className={`input input-bordered w-full md:w-auto ${selectedDate ? 'selected-text-color' : ''}`}
                renderCustomHeader={({ date, changeMonth, changeYear }) => (
                  <div>
                    <button onClick={() => changeMonth(date.getMonth() - 1)} className="focus:outline-none mr-5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span>{format(date, 'MMMM yyyy', { locale: th })}</span>
                    <button onClick={() => changeMonth(date.getMonth() + 1)} className="focus:outline-none ml-5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              />
            </label>
            ยังไม่ได้ส่ง : {deliveryData.length}
          </h1>
          {deliveryData.map((data, index) => (
            data && (
              <div key={index} className="w-full p-2">
                <div className="card glass mx-auto mb-4" style={allStyle}>
                  <div className="card-body">
                    <h2 className="card-title" style={{ margin: 0 }}>เลขที่ {data.numberOfCardsSent} ,<span className="card-title" style={{ ...smallTextStyle, margin: 0 }}>
                      {formatDate(data.date)}
                    </span></h2>
                    <h3 className="card-title">ชื่อ: {data.nameOrder}</h3>
                    <h2 className="card-title">สถานที่ส่ง: {data.deliveryLocation}</h2>
                    <div className="card-title">ราคารวม: {data.totalPrice.toFixed(2)} บาท</div>
                    <ul>
                      {data.cart.map((item, idx) => (
                        <li key={idx}>
                          {idx + 1}. {item.title}: {item.quantity} กก.
                        </li>
                      ))}
                    </ul>
                      {/* Display latitude and longitude with a button to open Google Maps */}
          {data.latitude && data.longitude && (
            <div className="card-title mt-4">
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`, '_blank')}
                className="btn btn-primary"
              >
                ลิงค์ไปแผนที่
              </button>
            </div>
          )}
                    {data.imageUrl && (
            <div className="card-image cursor-pointer mb-4" onClick={() => handleImageClick(data.imageUrl)}>
              <img src={data.imageUrl} alt="Delivery" className="w-32 h-32 object-cover rounded-md shadow-md" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, data.id)}
            className="input input-bordered w-full max-w-xs mt-2"
          />
  
                    <div className="card-actions justify-end">
                    <button
  className={`btn ${data.paidstatus ? 'btn-primary' : 'btn-disabled'}`} // Add btn-primary class for paidstatus = true, btn-disabled otherwise
  onClick={() => handleConfirm(index)}
  disabled={!data.paidstatus} // Disable button if paidstatus is false
>
  ส่งเสร็จ
</button>

                    </div>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>

        {/* Success List Section */}
        <div className="flex-1 p-2 bg-gray-200 dark:bg-gray-700 overflow-auto" style={{ maxHeight: "calc(100vh - 100px)", ...allStyle }}>
          <h1 className="text-lg font-bold mb-4">ส่งเสร็จแล้ว : {successList.length}</h1>

          <button className="btn btn-secondary mb-4" onClick={toggleContentVisibility}>
            {isContentVisible ? 'ซ่อนเนื้อหา' : 'แสดงเนื้อหา'}
          </button>
          
          <ul>
            {successList.map((data, index) => (
              data && (
                <li key={index} className="mb-2">
                  <div className="card glass mx-auto" style={SucStyle}>
                    <div className="card-body">
                      <h2 className="card-title" style={{ margin: 0 }}>ชุดที่ {data.numberOfCardsSent} ,<span className="card-title" style={{ ...smallTextStyle, margin: 0 }}>
                        {formatDate(data.date)}
                      </span></h2>
                      <h3 className="card-title">ชื่อ: {data.nameOrder}</h3>
                      <h2 className="card-title">สถานที่ส่ง: {data.deliveryLocation}</h2>

                      {isContentVisible && (
                        <>
                          <div className="card-title">ราคารวม: {data.totalPrice.toFixed(2)} บาท</div>
                          <ul>
                            {data.cart.map((item, idx) => (
                              <li key={idx}>
                                {idx + 1}. {item.title}: {item.quantity} กก.
                              </li>
                            ))}
                          </ul>
                           {/* Display latitude and longitude with a button to open Google Maps */}
          {data.latitude && data.longitude && (
            <div className="card-title mt-4">
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`, '_blank')}
                className="btn btn-primary"
              >
                ลิงค์ไปแผนที่
              </button>
            </div>
          )}
                        
                        {data.imageUrl && (
            <div className="card-image cursor-pointer mb-4" onClick={() => handleImageClick(data.imageUrl)}>
              <img src={data.imageUrl} alt="Delivery" className="w-32 h-32 object-cover rounded-md shadow-md" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, data.id)}
            className="input input-bordered w-full max-w-xs mt-2"
          />
          </>
        )}
                      <div className="card-actions justify-end">
                        <button className="btn btn-primary" onClick={() => handleBackConfirm(index)}>กลับ</button>
                      </div>
                    </div>
                  </div>
                </li>
              )
            ))}
          </ul>
        </div>
      </div>
      {/* Modal for displaying large image */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="relative">
            <img src={modalImage} alt="Large" className="max-w-screen-sm max-h-screen object-contain" />
            <button 
              className="absolute top-2 right-2 bg-white p-2 rounded-full text-black"
              onClick={closeModal}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
    


  );
};

export default Contact;
