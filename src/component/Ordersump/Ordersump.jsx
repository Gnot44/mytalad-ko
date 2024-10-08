import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { th } from 'date-fns/locale';
import Modal from 'react-modal';
import { format, parse } from 'date-fns';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// Set up the modal root element
Modal.setAppElement('#root');

function Ordersump() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [sortColumn, setSortColumn] = useState(''); // Column to sort by
    const [sortDirection, setSortDirection] = useState('asc'); // Sorting direction
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Calculate the index range for the current page
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);

    // Handle page changes
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Calculate total pages
    const totalPages = Math.ceil(orders.length / itemsPerPage);

    const [startDateor, setStartDateor] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      });
      
      const [endDateor, setEndDateor] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      });

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                // Create a date range for the selected date
                const startOfDay = startDateor.getTime();
                const endOfDay = endDateor.getTime();
                
                const q = query(
                    collection(db, 'deliveryData'),
                    where('date', '>=', new Date(startOfDay)),
                    where('date', '<=', new Date(endOfDay))
                  );
                const querySnapshot = await getDocs(q);
                const ordersData = querySnapshot.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                }));
                setOrders(ordersData);
            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const fetchDataByDate = async () => {
        try {  // Create a date range for the selected date
            const startOfDay = startDateor.getTime();
            const endOfDay = endDateor.getTime();
            
            const q = query(
                collection(db, 'deliveryData'),
                where('date', '>=', new Date(startOfDay)),
                where('date', '<=', new Date(endOfDay))
              );
            const querySnapshot = await getDocs(q);
            const ordersData = querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));
            setOrders(ordersData);
        } catch (error) {
            console.error("Error fetching data: ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEndDateChange = (date) => {
        if (endDateor > startDateor) {
            fetchDataByDate();
        } else {
            toast.error("ใส่วันที่ให้ถูกต้อง");
        }
      };
    

    const handleToggleApproval = async (orderId, currentStatus) => {
        const orderRef = doc(db, 'deliveryData', orderId);
        await updateDoc(orderRef, { paidstatus: !currentStatus });

        // Update the state locally to reflect the change
        setOrders((prevOrders) =>
            prevOrders.map((order) =>
                order.id === orderId ? { ...order, paidstatus: !currentStatus } : order
            )
        );
    };

    const openModal = (imageUrl) => {
        setSelectedImage(imageUrl);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    const sortOrders = (column) => {
        const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(direction);
    
        const sortedOrders = [...orders].sort((a, b) => {
            if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
            if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    
        // Assuming you have a state or some method to update orders
        setOrders(sortedOrders);
    };
    
    const formatDatesum = (timestamp) => {
        const date = new Date(timestamp.seconds * 1000);
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
      
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      };
    

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6 px-4 md:px-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">สรุปออเดอร์</h2>
            


    <div className="flex flex-col lg:flex-row mt-4" >
   
      <div className="w-full lg:w-1/3 p-4">
        <label htmlFor="start-date" className="block text-sm font-medium mb-1">วัน/เวลาเริ่มต้น:</label>
        <DatePicker
          id="start-date"
          locale={th}
          selected={startDateor}
          onChange={(date) => setStartDateor(date)}
          showTimeSelect
          dateFormat="yyyy/MM/dd HH:mm"
          timeFormat="HH:mm"
          timeIntervals={15}
          className="input input-bordered w-full mb-4"
          placeholderText="Start Date and Time"
          renderCustomHeader={({ date, changeMonth }) => (
            <div className="flex justify-between items-center">
              <button onClick={() => changeMonth(date.getMonth() - 1)} className="focus:outline-none mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span>{format(date, 'MMMM yyyy', { locale: th })}</span>
              <button onClick={() => changeMonth(date.getMonth() + 1)} className="focus:outline-none ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        />
      </div>
    
      <div className="w-full lg:w-1/3 p-4">
        <label htmlFor="end-date" className="block text-sm font-medium mb-1">วัน/เวลาสิ้นสุด:</label>
        <DatePicker
          id="end-date"
          locale={th}
          selected={endDateor}
          onChange={(date) => setEndDateor(date)}
          showTimeSelect
          dateFormat="yyyy/MM/dd HH:mm"
          timeFormat="HH:mm"
          timeIntervals={15}
          minDate={startDateor}
          className="input input-bordered w-full mb-4"
          placeholderText="End Date and Time"
          renderCustomHeader={({ date, changeMonth }) => (
            <div className="flex justify-between items-center">
              <button onClick={() => changeMonth(date.getMonth() - 1)} className="focus:outline-none mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span>{format(date, 'MMMM yyyy', { locale: th })}</span>
              <button onClick={() => changeMonth(date.getMonth() + 1)} className="focus:outline-none ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        />
      </div>
   

<div className="w-auto lg:w-1/3 p-4 flex items-center gap-4">
  <button className="btn btn-primary" onClick={handleEndDateChange}>
    ค้นหาวันที่
  </button>
  <ToastContainer />
</div>
      </div>

            {orders.length > 0 ? (
                <div className="w-full max-w-4xl bg-white p-4 md:p-6 rounded-lg shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="table-auto w-full mb-6">
                            <thead className="bg-gray-200">
                                <tr>
                                
                                <th
                        className="py-3 px-2 md:px-4 text-left cursor-pointer"
                        onClick={() => sortOrders('date')}
                        >
                        เวลา {sortColumn === 'date' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>


                    <th
                        className="py-3 px-2 md:px-4 text-left cursor-pointer"
                        onClick={() => sortOrders('nameOrder')}
                        >
                        ชื่อ {sortColumn === 'nameOrder' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                                    <th className="py-3 px-2 md:px-4 text-left">จำนวน</th>
                                    <th className="py-3 px-2 md:px-4 text-left">ราคา</th>
                                    <th
                                        className="py-3 px-2 md:px-4 text-left cursor-pointer"
                                        onClick={() => sortOrders('totalPrice')}
                                    >
                                        ราคารวม {sortColumn === 'totalPrice' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                    </th>
                                    <th
                                        className="py-3 px-2 md:px-4 text-left cursor-pointer"
                                        onClick={() => sortOrders('deliveryLocation')}
                                    >
                                        สถานที่จัดส่ง {sortColumn === 'deliveryLocation' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                    </th>
                                    <th className="py-3 px-2 md:px-4 text-left">เบอร์โทรศัพท์</th>
                                    
                                    <th
            className="py-3 px-2 md:px-4 text-left cursor-pointer"
            onClick={() => sortOrders('paymentProofUrl')}
        >
            หลักฐานการโอน {sortColumn === 'paymentProofUrl' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
        </th>
                                    <th
                                        className="py-3 px-2 md:px-4 text-left cursor-pointer"
                                        onClick={() => sortOrders('paidstatus')}
                                    >
                                        การอนุมัติ {sortColumn === 'paidstatus' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                    </th>


                                    <th className="py-3 px-2 md:px-4 text-left">เลขออเดอร์</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentOrders.map((order) => (
                                    <tr key={order.id} className="border-t">
                                        <td className="py-3 px-2 md:px-4">{formatDatesum(order.date)}</td>
                                        <td className="py-3 px-2 md:px-4">{order.nameOrder}</td>
                                        <td className="py-3 px-2 md:px-4">
                                            {order.cart.map((item) => (
                                                <div key={item.id}>
                                                    {item.quantity} x {item.title}
                                                </div>
                                            ))}
                                        </td>
                                        <td className="py-3 px-2 md:px-4">
                                            {order.cart.map((item) => (
                                                <div key={item.id}>{item.price}</div>
                                            ))}
                                        </td>
                                        <td className="py-3 px-2 md:px-4">{order.totalPrice.toFixed(2)}</td>
                                        <td className="py-3 px-2 md:px-4">{order.deliveryLocation}</td>
                                        <td className="py-3 px-2 md:px-4">{order.phoneNumber}</td>
                                        <td className="py-3 px-2 md:px-4">
                                            {order.paymentProofUrl ? (
                                                <img
                                                    src={order.paymentProofUrl}
                                                    alt="Payment Proof"
                                                    className="cursor-pointer w-16 h-16 md:w-24 md:h-24 object-cover"
                                                    onClick={() => openModal(order.paymentProofUrl)}
                                                />
                                            ) : (
                                                'ไม่มี'
                                            )}
                                        </td>
                                        <td className="py-3 px-2 md:px-4">
                                            <button
                                                className={`btn ${order.paidstatus ? 'btn-danger' : 'btn-success'} w-full`}
                                                onClick={() => handleToggleApproval(order.id, order.paidstatus)}
                                            >
                                                {order.paidstatus ? 'ยกเลิกการอนุมัติ' : 'อนุมัติ'}
                                            </button>
                                        </td>
                                        <td className="py-3 px-2 md:px-4">{order.trackingNumber}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center">
                            <button
                                className="btn btn-secondary"
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                &laquo; ถอยกลับ
                            </button>
                            <span>หน้า {currentPage} ทั้งหมด {totalPages}</span>
                            <button
                                className="btn btn-secondary"
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                ถัดไป &raquo;
                            </button>
                        </div>
                    </div>
                </div>



            ) : (
                <p className="text-lg">ยังไม่มี Order...</p>
            )}

            {/* Modal for displaying larger image */}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                contentLabel="Image Modal"
                className="fixed inset-0 flex items-center justify-center"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
            >
                <div className="relative bg-white p-4 md:p-6 rounded-lg max-w-full max-h-full">
                    <button
                        className="absolute top-2 right-2 text-xl font-bold"
                        onClick={closeModal}
                    >
                        &times;
                    </button>
                    <img
                        src={selectedImage}
                        alt="Larger view"
                        className="max-w-full max-h-screen object-contain"
                    />
                </div>
            </Modal>
        </div>
    );
};

export default Ordersump;
