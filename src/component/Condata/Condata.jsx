import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, IconButton, Pagination, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function Condata({ user }) {
    const [cardsData, setCardsData] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '', price: '', imageUrl: '', pid: '', stockKg: '', status: true });
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingcon, setLoadingcon] = useState(true);
    const [imageFile, setImageFile] = useState(null);

    const itemsPerPage = 10;
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const q = collection(db, 'cardsData');
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.pid.localeCompare(b.pid, 'en', { numeric: true }));
            setCardsData(data);
            setLoadingcon(false);
        }, (error) => {
            console.error('Error fetching cards data: ', error);
            setLoadingcon(false);
        });
        return () => unsubscribe();
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
        setFormData({ title: '', description: '', price: '', imageUrl: '', pid: '', stockKg: '', status: true });
        setModalType('add');
        setShowModal(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const checkDuplicates = async () => {
        const pid = String(formData.pid).trim();
        const title = String(formData.title).trim();

        if (!pid || !title) return "กรุณากรอก รหัส และ ชื่อ ให้ครบถ้วน";

        const pidQuery = query(collection(db, 'cardsData'), where('pid', '==', pid));
        const pidSnapshot = await getDocs(pidQuery);
        if (!pidSnapshot.empty) {
            const duplicate = pidSnapshot.docs.find(doc => doc.id !== editingId);
            if (duplicate) return 'รหัสผักซ้ำกับรายการอื่น';
        }

        const titleQuery = query(collection(db, 'cardsData'), where('title', '==', title));
        const titleSnapshot = await getDocs(titleQuery);
        if (!titleSnapshot.empty) {
            const duplicate = titleSnapshot.docs.find(doc => doc.id !== editingId);
            if (duplicate) return 'ชื่อผักซ้ำกับรายการอื่น';
        }

        return '';
    };

    const uploadImage = async () => {
        if (!imageFile) return '';
        const imageRef = ref(storage, `cardsData/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        const url = await getDownloadURL(imageRef);
        return url;
    };

    const handleSubmit = async () => {
        try {
            const duplicateError = await checkDuplicates();
            if (duplicateError) {
                setErrorMessage(duplicateError);
                return;
            }

            let imageUrl = formData.imageUrl;
            if (imageFile) {
                imageUrl = await uploadImage();
            }

            const dataToSave = { ...formData, imageUrl };

            if (modalType === 'edit') {
                await updateDoc(doc(db, 'cardsData', editingId), dataToSave);
            } else if (modalType === 'add') {
                await addDoc(collection(db, 'cardsData'), dataToSave);
            }

            setShowModal(false);
            setEditingId(null);
            setImageFile(null);
        } catch (error) {
            setErrorMessage('เกิดข้อผิดพลาด');
            console.error(error);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteDoc(doc(db, 'cardsData', editingId));
            setShowModal(false);
        } catch (error) {
            setErrorMessage('เกิดข้อผิดพลาดในการลบ');
            console.error(error);
        }
    };

    const handleStatusToggle = async (id, currentStatus) => {
        try {
            await updateDoc(doc(db, 'cardsData', id), { status: !currentStatus });
        } catch (error) {
            setErrorMessage('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
            console.error(error);
        }
    };

    const exportAllCardsDataToExcel = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'cardsData'));
            if (snapshot.empty) {
                setErrorMessage("ไม่มีข้อมูลในระบบ");
                return;
            }

            const data = snapshot.docs.map(doc => {
                const d = doc.data();
                return { pid: d.pid || '', title: d.title || '', price: d.price || '', stockKg: d.stockKg || '' };
            });

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'cardsData');
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
            saveAs(blob, 'cardsData_export.xlsx');
        } catch (error) {
            console.error("Export Error:", error);
            setErrorMessage("เกิดข้อผิดพลาดในการดึงข้อมูลหรือสร้างไฟล์");
        }
    };

    const importExcelAndUpdateCardsData = (file) => {
        if (!file) {
            setErrorMessage("กรุณาเลือกไฟล์ Excel");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (!jsonData.length) {
                    setErrorMessage("ไฟล์ไม่ถูกต้องหรือไม่มีข้อมูล");
                    return;
                }

                const updates = [];
                for (const row of jsonData) {
                    const pid = String(row.pid).trim();
                    const title = String(row.title || "").trim();
                    const price = Number(row.price);
                    const stockKg = Number(row.stockKg);
                    if (!pid || !title || isNaN(price) || isNaN(stockKg)) continue;

                    const pidQuery = query(collection(db, 'cardsData'), where('pid', '==', pid));
                    const pidSnapshot = await getDocs(pidQuery);
                    if (!pidSnapshot.empty) {
                        const docRef = pidSnapshot.docs[0].ref;
                        updates.push(updateDoc(docRef, { title, price, stockKg }));
                    }
                }

                if (updates.length) {
                    await Promise.all(updates);
                    setErrorMessage(`อัพเดทข้อมูลสำเร็จ (${updates.length} รายการ)`);
                } else {
                    setErrorMessage("ไม่พบ pid ที่ตรงกับฐานข้อมูล");
                }
            } catch (error) {
                console.error("Import Error:", error);
                setErrorMessage("เกิดข้อผิดพลาดในการนำเข้า");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const paginatedData = cardsData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(cardsData.length / itemsPerPage);

    return loadingcon ? <CircularProgress /> : (
        <div style={{ padding: '20px' }}>
            {isAdmin && (
                <>
                    <Button variant="contained" color="primary" onClick={handleAdd} sx={{ mb: 2, mr: 2 }}>เพิ่มผัก</Button>
                    <Button variant="outlined" onClick={exportAllCardsDataToExcel} sx={{ mb: 2, mr: 2 }}>
                        ส่งออก excel
                    </Button>
                    <Button variant="outlined" component="label" sx={{ mb: 2 }}>
                        นำเข้า Excel
                        <input type="file" accept=".xlsx" hidden onChange={(e) => importExcelAndUpdateCardsData(e.target.files[0])} />
                    </Button>
                </>
            )}
            <TableContainer component={Paper} sx={{ my: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>รหัส</TableCell>
                            <TableCell>ชื่อ</TableCell>
                            <TableCell>รายละเอียด</TableCell>
                            <TableCell>ราคา</TableCell>
                            <TableCell>สต๊อก (กก.)</TableCell>
                            <TableCell>รูปภาพ</TableCell>
                            <TableCell>สถานะ</TableCell>
                            {isAdmin && <TableCell>จัดการ</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.map((card) => (
                            <TableRow key={card.id}>
                                <TableCell>{card.pid}</TableCell>
                                <TableCell>{card.title}</TableCell>
                                <TableCell>{card.description}</TableCell>
                                <TableCell>{card.price}</TableCell>
                                <TableCell>{card.stockKg ?? '-'}</TableCell>
                                <TableCell><img src={card.imageUrl} alt={card.title} style={{ width: 50 }} /></TableCell>
                                <TableCell>
                                    <Button variant={card.status ? 'contained' : 'outlined'} color={card.status ? 'success' : 'error'} onClick={() => handleStatusToggle(card.id, card.status)}>
                                        {card.status ? 'มี' : 'ไม่มี'}
                                    </Button>
                                </TableCell>
                                {isAdmin && (
                                    <TableCell>
                                        <Button variant="contained" onClick={() => handleEdit(card.id)} sx={{ mr: 1 }}>แก้ไข</Button>
                                        <Button variant="contained" color="error" onClick={() => handleDelete(card.id)}>ลบ</Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Pagination count={totalPages} page={currentPage} onChange={(e, value) => setCurrentPage(value)} sx={{ mt: 2 }} />

            <Dialog open={showModal} onClose={() => setShowModal(false)}>
                <DialogTitle>{modalType === 'edit' ? 'แก้ไข' : modalType === 'delete' ? 'ลบ' : 'เพิ่ม'}</DialogTitle>
                <DialogContent>
                    {modalType === 'delete' ? (
                        <p>คุณต้องการลบหรือไม่?</p>
                    ) : (
                        <>
                            <TextField fullWidth label="รหัสผัก" name="pid" value={formData.pid} onChange={handleChange} margin="normal" type="number" />
                            <TextField fullWidth label="ชื่อผัก" name="title" value={formData.title} onChange={handleChange} margin="normal" />
                            <TextField fullWidth label="รายละเอียด" name="description" value={formData.description} onChange={handleChange} margin="normal" />
                            <TextField fullWidth label="ราคา" name="price" value={formData.price} onChange={handleChange} margin="normal" type="number" />
                            <TextField fullWidth label="สต๊อก (กก.)" name="stockKg" value={formData.stockKg} onChange={handleChange} margin="normal" type="number" inputProps={{ step: "0.1", min: "0" }} />
                            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ marginTop: '16px' }} />
                            {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" style={{ width: 100, marginTop: '10px' }} />}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowModal(false)}>ยกเลิก</Button>
                    {modalType === 'delete' ? (
                        <Button color="error" onClick={handleConfirmDelete}>ลบ</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={!formData.title || !formData.description || !formData.price || !formData.pid || !formData.stockKg}>บันทึก</Button>
                    )}
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!errorMessage}
                autoHideDuration={4000}
                onClose={() => setErrorMessage(null)}
                message={errorMessage}
                action={<IconButton size="small" color="inherit" onClick={() => setErrorMessage(null)}><CloseIcon fontSize="small" /></IconButton>}
            />
        </div>
    );
}

export default Condata;
