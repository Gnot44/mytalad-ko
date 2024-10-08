import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import 'react-datepicker/dist/react-datepicker.css';

const Timeline = ({ isDarkTheme }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [status, setStatus] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');

  const openModal = (imageUrl) => {
    setModalImage(imageUrl);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImage('');
  };

  const handleSearchChange = (e) => {
    setOrderNumber(e.target.value);
  };

  const isValidOrderNumber = (number) => {
    const regex = /^BP\d{10}$/; // "BP" followed by exactly 10 digits
    return regex.test(number);
  };

  const handleSearchClick = () => {
    if (!isValidOrderNumber(orderNumber)) {
      return;
    }

    const fetchStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(db, 'deliveryData'), where('trackingNumber', '==', orderNumber));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setStatus('ไม่พบข้อมูล');
          setOrderDetails(null);
        } else {
          const data = querySnapshot.docs.map(doc => doc.data())[0];
          setOrderDetails(data);
          if (!data.paidstatus) {
            setStatus('รอการตรวจสอบ');
          } else if (data.paidstatus && !data.status) {
            setStatus('ยืนยันข้อมูลแล้ว รอจัดส่ง');
          } else if (data.paidstatus && data.status) {
            setStatus('จัดส่งสำเร็จแล้ว');
          }
        }
      } catch (e) {
        setError('เกิดข้อผิดพลาดในการค้นหา');
        console.error('Error fetching order status:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  };

  const isSearchDisabled = !isValidOrderNumber(orderNumber);

  return (
    <div className={`flex flex-col items-center w-full p-6 ${isDarkTheme ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="w-full max-w-lg mb-8">
        <div className="flex flex-col space-y-4">
        <input
            type="text"
            placeholder="ค้นหาเลขที่ ออเดอร์ครับ"
            className="input input-bordered w-full p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 text-black"
            value={orderNumber}
            onChange={handleSearchChange}
/>

          <button
            className={`btn ${isSearchDisabled ? 'btn-disabled' : 'btn-primary'} mt-4 flex items-center justify-center px-4 py-2 rounded-lg text-white shadow-md ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            onClick={handleSearchClick}
            disabled={isSearchDisabled}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : (
              'ค้นหา'
            )}
          </button>
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto px-6 py-8">
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {status && (
          <div className="w-full max-w-xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0 lg:space-x-8">
              {['รอการตรวจสอบ', 'ยืนยันข้อมูลแล้ว รอจัดส่ง', 'จัดส่งสำเร็จแล้ว'].map((step) => (
                <div key={step} className={`flex items-center space-x-3 ${status === step ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-12 h-12 border-4 rounded-full flex items-center justify-center transition-colors duration-300 ${status === step ? 'bg-green-600 text-white' : 'bg-white border-gray-300'}`}>
                    {status === step && (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M12.293 5.293a1 1 0 0 1 1.414 1.414l-6 6a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 1.414-1.414L7 11.586l5.293-5.293z"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-lg font-semibold">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {orderDetails && (
        <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">สรุปรายการ</h2>
          {orderDetails.cart ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">รายการ</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">จำนวน</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">ราคา/หน่วย</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">ราคารวม</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderDetails.cart.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-100 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} กก.</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.price} บาท</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(item.quantity * item.price).toFixed(2)} บาท</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                <tr>
  <td colSpan="3" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">ยอดรวม :</td>
  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
    {orderDetails.cart.reduce((total, item) => total + (item.quantity * item.price), 0).toFixed(2)} บาท
  </td>
</tr>

                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">หลักฐานการโอน :</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {orderDetails.paymentProofUrl ? (
                        <img
                          src={orderDetails.paymentProofUrl}
                          alt="Payment Proof"
                          className="cursor-pointer w-16 h-16 object-cover rounded-lg shadow-md"
                          onClick={() => openModal(orderDetails.paymentProofUrl)}
                        />
                      ) : (
                        'ไม่มี'
                      )}
                    </td>
                  </tr>

                  {orderDetails.status && (
  <tr>
    <td colSpan="3" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">หลักฐานการส่งของ :</td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {orderDetails.imageUrl ? (
        <img
          src={orderDetails.imageUrl}
          alt="Delivery Proof"
          className="cursor-pointer w-16 h-16 object-cover rounded-lg shadow-md"
          onClick={() => openModal(orderDetails.imageUrl)}
        />
      ) : (
        'ไม่มี'
      )}
    </td>
  </tr>
)}



                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500">ไม่มีข้อมูลรายการ</p>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white p-6 rounded-lg max-w-lg mx-auto shadow-lg">
            <img src={modalImage} alt="Payment Proof" className="w-full h-auto object-cover rounded-lg" />
            <button
              onClick={closeModal}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg shadow"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
