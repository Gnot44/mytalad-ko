import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import Papa from 'papaparse'; // Import PapaParse
import { toast, ToastContainer } from 'react-toastify';
import * as XLSX from 'xlsx';

function Condata({ isDarkTheme, Load_iy, user }) {
    const [cardsData, setCardsData] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '', price: '', imageUrl: '', pid: '' });
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'edit', 'delete', or 'add'
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingcon, setLoadingcon] = useState(true);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');
    const [file, setFile] = useState(null);
    const [uploadPercentage, setUploadPercentage] = useState(0);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const allowedExtensions = ['csv']; // Define allowed file extensions
    


    const itemsPerPage = 10;
    const isAdmin = user?.role === 'admin'; // Assuming user object has a role property
    const isUser = user?.role === 'user'; // Assuming user object has

    const ConStyle = {
        color: isDarkTheme ? '#FFFFFF' : '#000000',
        transition: 'color 0.3s ease, background-color 0.3s ease',
        fontFamily: 'IBM Plex Sans Thai, sans-serif',
        fontSize: '16px',
    };

    const MoStyle = {
        color: isDarkTheme ? '#000000' : '#000000',
        transition: 'color 0.3s ease, background-color 0.3s ease',
        fontFamily: 'IBM Plex Sans Thai, sans-serif',
        fontSize: '16px',
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoadingcon(true);
            try {
                const querySnapshot = await getDocs(collection(db, 'cardsData'));
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                data.sort((a, b) => a.pid.localeCompare(b.pid, 'en', { numeric: true }));
                setCardsData(data);
            } catch (e) {
                console.error('Error fetching cards data: ', e);
            } finally {
                setLoadingcon(false);
            }
        };

        fetchData();
    }, []);

    const handleEdit = (id) => {
        setEditingId(id);
        const card = cardsData.find(card => card.id === id);
        setFormData(card);
        setModalType('edit');
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setEditingId(id);
        setModalType('delete');
        setShowModal(true);
    };

    const handleAdd = () => {
        setFormData({ title: '', description: '', price: '', imageUrl: '', pid: '', status:'true' });
        setModalType('add');
        setShowModal(true);
        setError('');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const checkDuplicates = async () => {
        const { title, pid } = formData;

        // Check for duplicate title
        const titleQuery = query(collection(db, 'cardsData'), where('title', '==', title));
        const titleSnapshot = await getDocs(titleQuery);
        if (!titleSnapshot.empty && (modalType !== 'edit' || titleSnapshot.docs[0].id !== editingId)) {
            return 'มีผักนี้อยู่แล้ว';
        }

        // Check for duplicate pid
        const pidQuery = query(collection(db, 'cardsData'), where('pid', '==', pid));
        const pidSnapshot = await getDocs(pidQuery);
        if (!pidSnapshot.empty && (modalType !== 'edit' || pidSnapshot.docs[0].id !== editingId)) {
            return 'มีรหัสนี้อยู่แล้ว';
        }

        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const duplicateError = await checkDuplicates();
        if (duplicateError) {
            setError(duplicateError);
            return;
        }

        try {
            if (modalType === 'edit') {
                const docRef = doc(db, 'cardsData', editingId);
                await updateDoc(docRef, formData);
            } else if (modalType === 'add') {
                await addDoc(collection(db, 'cardsData'), formData);
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ title: '', description: '', price: '', imageUrl: '', pid: '' });
            // Fetch updated data
            const querySnapshot = await getDocs(collection(db, 'cardsData'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.pid.localeCompare(b.pid, 'en', { numeric: true }));
            setCardsData(data);
        } catch (error) {
            console.error('Error adding or updating document:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (modalType === 'delete' && editingId) {
            const docRef = doc(db, 'cardsData', editingId);
            await deleteDoc(docRef);
            setShowModal(false);
            // Fetch updated data
            const querySnapshot = await getDocs(collection(db, 'cardsData'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.pid.localeCompare(b.pid, 'en', { numeric: true }));
            setCardsData(data);
        }
    };

    const isFormValid = () => {
        const { title, description, price, imageUrl, pid } = formData;
        return title && description && price && imageUrl && pid;
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImageUrl(imageUrl);
    };

    const paginatedData = cardsData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(cardsData.length / itemsPerPage);



    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

            if (!allowedExtensions.includes(fileExtension)) {
                setErrorMessage('Invalid file type. Please upload a CSV file.');
                setFile(null);
                return;
            }

            setFile(selectedFile);
            setUploadPercentage(0);
            setErrorMessage(null);
        }
    };






    const handleFileUpload = () => {
        if (!file) return;
    
        Papa.parse(file, {
            header: true,
            complete: async (results) => {
                const data = results.data;
                const totalRows = data.length;
    
                try {
                    for (let i = 0; i < totalRows; i++) {
                        const row = data[i];
                        const { pid, title } = row;
    
                        // ถ้า title ว่างหรือไม่มีข้อมูล จะข้ามแถวนี้
                        if (!title || !title.trim()) {
                            console.warn(`Skipping row ${i + 1} due to missing or empty 'title'. Row data: `, row);
                            continue;
                        }
    
                       // ตรวจสอบว่า pid มีอยู่แล้วหรือไม่
                    if (pid && pid.trim()) {
                        const pidQuery = query(
                            collection(db, 'cardsData'),
                            where('pid', '==', pid)
                        );

                        const pidSnapshot = await getDocs(pidQuery);

                        if (!pidSnapshot.empty) {
                            const existingDoc = pidSnapshot.docs[0]; // ใช้ document แรกที่เจอ
                            const existingData = existingDoc.data();

                            // ตรวจสอบว่า title ตรงกับใน Firebase หรือไม่
                            if (existingData.title !== title) {
                                console.warn(`Skipping row ${i + 1} because 'pid' '${pid}' exists but 'title' does not match. Row data: `, row);
                                toast.warn(`เลขที่ '${pid}' ใช้กับผักชนิดอื่นไปแล้ว`);
                                continue;
                            }
                        }
                    }
    
                        // ตรวจสอบว่า title มีอยู่แล้วหรือไม่
                        const titleQuery = query(
                            collection(db, 'cardsData'),
                            where('title', '==', title)
                        );
    
                        const titleSnapshot = await getDocs(titleQuery);
    
                        if (!titleSnapshot.empty) {
                            // มี title ที่ซ้ำกันใน Firebase
                            const existingDoc = titleSnapshot.docs[0]; // ใช้ document แรกที่เจอ
                            const docRef = doc(db, 'cardsData', existingDoc.id);
    
                            // กรองฟิลด์ที่ว่างเปล่าก่อนอัปเดต
                            const updatedFields = {};
                            for (const key in row) {
                                if (row[key] && key !== 'pid') { // ไม่อัปเดต pid และฟิลด์ที่ว่าง
                                    updatedFields[key] = row[key];
                                }
                            }
    
                            await updateDoc(docRef, updatedFields);
    
                            console.warn(`Updated row ${i + 1} because 'title' '${title}' already exists. Updated fields: `, updatedFields);
                            toast.success(`รายการ '${title}' อัพเดทเรียบร้อยแล้ว`);
                        } else {
                            // ถ้า title ไม่มีอยู่ใน Firebase เพิ่มข้อมูลใหม่
                            await addDoc(collection(db, 'cardsData'), row);
                            console.log(`Added new row ${i + 1}. Row data: `, row);
                            toast.success(`เพิ่มรายการ '${title}' เรียบร้อยแล้ว`);
                        }
    
                        const progress = Math.round(((i + 1) / totalRows) * 100);
                        setUploadPercentage(progress);
                        console.log(`Upload progress: ${progress}%`);
                    }
    
                    const updatedQuerySnapshot = await getDocs(collection(db, 'cardsData'));
                    const updatedData = updatedQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    updatedData.sort((a, b) => a.pid.localeCompare(b.pid, 'en', { numeric: true }));
                    setCardsData(updatedData);
    
                    toast.success('Upload Complete');
                    setUploadPercentage(100);
    
                    // รีเฟรชหน้าเว็บหลังจาก 1 วินาทีเพื่อให้ UI อัปเดตก่อนโหลดใหม่
                    setTimeout(() => {
                        window.location.reload();
                    }, 5000);
    
                } catch (error) {
                    console.error('Error during file processing:', error);
                    toast.error('An error occurred during file processing. Please try again.');
                }
            },
            error: (error) => {
                console.error('Error parsing CSV file:', error);
                toast.error('An error occurred while parsing the CSV file.');
            }
        });
    };



    const exportToExcel = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'cardsData'));
            let data = querySnapshot.docs.map(doc => doc.data());
    
            if (data.length === 0) {
                console.warn('No data available to export');
                return;
            }
    
            // เรียงลำดับข้อมูลตามคอลัมน์ที่ต้องการ
            data = data.map(item => ({
                pid: item.pid,
                title: item.title,
                description: item.description,
                price: item.price,
                imageUrl: item.imageUrl
            }));
    
            // สร้าง worksheet จาก data
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "VegetablesData");
    
            // สร้างไฟล์ Excel
            const exportFileName = "VegetablesData.xlsx";
            XLSX.writeFile(workbook, exportFileName);
    
            toast.success('ส่งออกข้อมูลสำเร็จแล้ว!');
        } catch (error) {
            console.error('Error exporting data: ', error);
            toast.error('An error occurred while exporting data.');
        }
    };



    const handleStatusToggle = async (id, currentStatus) => {
        try {
            const docRef = doc(db, 'cardsData', id);
            const newStatus = !currentStatus;
    
            await updateDoc(docRef, { status: newStatus });
    
            // Refresh data
            const querySnapshot = await getDocs(collection(db, 'cardsData'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.pid.localeCompare(b.pid, 'en', { numeric: true }));
            setCardsData(data);
    
            toast.success(`สถานะถูกเปลี่ยนเป็น '${newStatus ? 'มี' : 'ไม่มี'}' สำเร็จแล้ว!`);
        } catch (error) {
            console.error('Error toggling status: ', error);
            toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
        }
    };

    
    
    
    
    

    return loadingcon ? (
        <Load_iy />
    ) : (
        <div className="p-6" style={ConStyle}>
    {isAdmin && (
        <>
            <button onClick={handleAdd} className="btn btn-primary mb-4">เพิ่มชนิดผัก</button>

            <div className="app-container">
                <div className="buttons-container" 
                     style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         flexWrap: 'wrap' // Wrap to next line if needed
                     }}>
                    <input type="file" onChange={handleFileChange} className="mb-2" />
                    <button 
                        onClick={handleFileUpload} 
                        className="btn btn-primary mb-4" 
                        disabled={!file}
                        style={{ marginRight: '20px', marginBottom: '10px' }} // Adjust the spacing here
                    >
                        Upload
                    </button>
                    <button 
                        onClick={exportToExcel}
                        className="btn btn-primary mb-4"
                    >
                        Export
                    </button>
                </div>

                {uploadPercentage > 0 && (
                    <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${uploadPercentage}%` }}></div>
                        <span>{uploadPercentage}%</span>
                    </div>
                )}

                {errorMessage && (
                    <div className="error-message">
                        <p>{errorMessage}</p>
                        <button onClick={() => setErrorMessage(null)}>Close</button>
                    </div>
                )}

                <ToastContainer />
            </div>
        </>
    )}
    
    <div className="table-container">
    <table className="table w-full mb-4" style={ConStyle}>
        <thead>
            <tr style={ConStyle}>
                <th>รหัสผัก</th>
                <th>ชื่อผัก</th>
                <th>ข้อมูล</th>
                {(isAdmin || isUser) && <th>ราคา</th>}
                <th>รูปภาพ</th>
                {isAdmin && <th>มี/ไม่มี</th>} {/* New column header for status */}
                {isAdmin && <th>แก้ไข/ลบ ข้อมูล</th>}
            </tr>
        </thead>

        <tbody>
            {paginatedData.map(card => (
                <tr key={card.id}>
                    <td>{card.pid}</td>
                    <td>{card.title}</td>
                    <td>{card.description}</td>
                    {(isAdmin || isUser) && <td>{card.price}</td>}
                    <td>
                        <img
                            src={card.imageUrl}
                            alt={card.title}
                            className="w-16 cursor-pointer"
                            onClick={() => handleImageClick(card.imageUrl)}
                        />
                    </td>
                    <td>
                    {isAdmin && (
                   <button 
                    onClick={() => handleStatusToggle(card.id, card.status)} 
                    className={`btn ${card.status ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                >
                    {card.status ? 'มี' : 'ไม่มี'}
                </button>
                )}

                    </td>
                    {isAdmin && (
                        <td>
                            <button onClick={() => handleEdit(card.id)} className="btn btn-primary mr-2">แก้ไข</button>
                            <button onClick={() => handleDelete(card.id)} className="btn btn-danger">ลบผัก</button>
                        </td>
                    )}
                </tr>
            ))}
        </tbody>
    </table>
</div>

<div className="pagination-controls">
    {Array.from({ length: totalPages }, (_, index) => (
        <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            className={`btn ${currentPage === index + 1 ? 'btn-active' : ''} mx-1`}
        >
            {index + 1}
        </button>
    ))}
</div>



{showModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                {modalType === 'edit' ? 'แก้ไข' : modalType === 'delete' ? 'ลบผัก' : 'เพิ่มผัก'}
            </h2>

            {modalType !== 'delete' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <label className="block">
    <span className="text-gray-700">รหัสผัก:</span>
    <input
        type="number"
        name="pid"
        value={formData.pid}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-black"
    />
</label>


                    <label className="block">
                        <span className="text-gray-700">ชื่อผัก:</span>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50  text-black"
                        />
                    </label>

                    <label className="block">
                        <span className="text-gray-700">รายละเอียด:</span>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50  text-black"
                        />
                    </label>

                    <label className="block">
                        <span className="text-gray-700">ราคา:</span>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50  text-black"
                        />
                    </label>

                    <label className="block">
                        <span className="text-gray-700">รูปภาพ:</span>
                        <input
                            type="text"
                            name="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50  text-black"
                        />
                    </label>

                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowModal(false)}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!isFormValid()}
                        >
                            {modalType === 'edit' ? 'บันทึก' : 'บันทึก'}
                        </button>
                    </div>
                </form>
            )}

            {modalType === 'delete' && (
                <div className="text-center">
                    <p className="text-lg mb-4">คุณต้องการลบผักนี้หรือไม่?</p>
                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={handleConfirmDelete}
                            className="btn btn-danger"
                        >
                            ใช่
                        </button>
                        <button
                            onClick={() => setShowModal(false)}
                            className="btn btn-secondary"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
                ✖
            </button>
        </div>
    </div>
)}




    {selectedImageUrl && (
        <div className="modal modal-open" style={MoStyle}>
            <div className="modal-box">
                <img src={selectedImageUrl} alt="Large View" className="w-full" />
                <div className="modal-action">
                    <button className="btn" onClick={() => setSelectedImageUrl('')}>ปิด</button>
                </div>
            </div>
        </div>
    )}
</div>

    );
}

export default Condata;
