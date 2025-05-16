import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { th } from 'date-fns/locale';
import { format, parse } from 'date-fns';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Grid, TextField, Button } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { useSnackbar } from 'notistack';




function Sidebar({ isDarkTheme, Popup_W, Success_W, Load_iy, user }) {

  const { enqueueSnackbar } = useSnackbar();


  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  });

  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  });


  const [deliveryData, setDeliveryData] = useState([]);
  const [cardsData, setCardsData] = useState([]);
  const [showPop, setShowPop] = useState(false);
  const [showSac, setShowSac] = useState(false);
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalQuality, setTotalQuality] = useState(0);
  const [cumulativeQuantities, setCumulativeQuantities] = useState({});
  const [moneyReceived, setMoneyReceived] = useState('');
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loadingss, setLoadingss] = useState(true); // Initialize loading state
  const [searchTerm, setSearchTerm] = useState('');
  const [previousLocations, setPreviousLocations] = useState(JSON.parse(localStorage.getItem('previousLocations')) || []);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const suggestionListRef = useRef(null);
  const isAdminside = user?.role === 'admin';
  const iscustomerside = user?.role === 'customer';
  const [isSavingside, setIsSavingside] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 2;



  const navigate = useNavigate();


  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);
  // ✅ Auto slide เปลี่ยนทุก 4 วินาที
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev % totalSlides) + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const slides = [
    {
      id: 1,
      image: 'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
      title: 'ผลไม้สดใหม่ทุกวัน',
      desc: 'สั่งง่าย ส่งไว ถึงมือคุณ',
      buttonText: 'ดูโปรโมชั่น',
      buttonColor: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      id: 2,
      image: 'https://img.daisyui.com/images/stock/photo-1609621838510-5ad474b7d25d.webp',
      title: 'โปรพิเศษเดือนนี้!',
      desc: 'รับส่วนลดทันทีเมื่อสั่งครบ 20000 บาท',
      buttonText: 'ดูรายละเอียด',
      buttonColor: 'bg-green-500 hover:bg-green-600',
    },
  ];



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionListRef.current && !suggestionListRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingss(true); // Set loading to true before starting to fetch data
      try {
        // Define a query to fetch documents where `status` is true
        const q = query(collection(db, 'cardsData'), where('status', '==', true));

        // Execute the query
        const querySnapshot = await getDocs(q);

        // Map the fetched documents to an array of objects
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Update state with the fetched data
        setCardsData(data);
      } catch (e) {
        console.error('Error fetching cards data: ', e);
      } finally {
        setLoadingss(false); // Set loading to false after fetching data
      }
    };

    fetchData();
  }, []);

  const filteredCards = cardsData.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.price.toString().includes(searchTerm) // รวมกรองราคาหากต้องการ
  );

  useEffect(() => {
    const fetchlocateData = async () => {
      setLoadingss(true); // Set loading to true before starting to fetch data
      try {
        const querySnapshot = await getDocs(collection(db, 'allocateData'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const allLocations = data.map(item => item.deliveryLocation);
        const uniqueLocations = [...new Set(allLocations)];

        setPreviousLocations(uniqueLocations);

      } catch (e) {
        console.error('Error fetching cards data: ', e);
      } finally {
        setLoadingss(false); // Set loading to false after fetching data
      }
    };
    fetchlocateData();
  }, []);



  useEffect(() => {
    const fetchDataDate = async () => {
      try {
        const startTimestamp = startDate.getTime();
        const endTimestamp = endDate.getTime();

        const q = query(
          collection(db, 'deliveryData'),
          where('date', '>=', new Date(startTimestamp)),
          where('date', '<=', new Date(endTimestamp))
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Process the fetched data
        const newCumulativeQuantities = data
          .filter(item => item.paidstatus === true)  // กรองเฉพาะรายการที่ paidstatus เป็น true
          .reduce((acc, item) => {
            item.cart.forEach(cartItem => {
              acc[cartItem.id] = (acc[cartItem.id] || 0) + cartItem.quantity;
            });
            return acc;
          }, {});


        let maxTotalIncome = 0;
        data.forEach(item => {
          if (item.paidstatus != false) {
            maxTotalIncome += item.totalPrice;
          }
        });
        let totalQualitySum = 0;
        data.forEach(item => {
          if (item.paidstatus != false) {
            totalQualitySum += item.totalQual;
          }
        });
        setDeliveryData(data);
        setCumulativeQuantities(newCumulativeQuantities);
        setTotalIncome(maxTotalIncome);
        setTotalQuality(totalQualitySum);
      } catch (e) {
        console.error('Error fetching delivery data by date range: ', e);
      }
      finally {
        setLoadingss(false); // Set loading to false after fetching data
      }
    };
    fetchDataDate();
  }, []);

  const fetchDataByDateRange = async () => {
    try {
      const startTimestamp = startDate.getTime();
      const endTimestamp = endDate.getTime();

      const q = query(
        collection(db, 'deliveryData'),
        where('date', '>=', new Date(startTimestamp)),
        where('date', '<=', new Date(endTimestamp))
      );

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Process the fetched data
      const newCumulativeQuantities = data
        .filter(item => item.paidstatus === true) // Filter to include only items with paidstatus = true
        .reduce((acc, item) => {
          item.cart.forEach(cartItem => {
            acc[cartItem.id] = (acc[cartItem.id] || 0) + cartItem.quantity;
          });
          return acc;
        }, {});


      let maxTotalIncome = 0;
      data.forEach(item => {
        if (item.paidstatus != false) {
          maxTotalIncome += item.totalPrice;
        }
      });

      let totalQualitySum = 0;
      data.forEach(item => {
        totalQualitySum += item.totalQual;
      });
      setDeliveryData(data);
      setCumulativeQuantities(newCumulativeQuantities);
      setTotalIncome(maxTotalIncome);
      setTotalQuality(totalQualitySum);
    } catch (e) {
      console.error('Error fetching delivery data by date range: ', e);
    }
  };

  const togPopup = () => {
    setShowPop(true);
    setTimeout(() => {
      setShowPop(false);
    }, 2000); // 3 seconds
  };

  const toggleSac = () => {
    setShowSac(true);
    setTimeout(() => {
      setShowSac(false);
    }, 2000); // 3 seconds
  };

  const totalStyle = {
    color: isDarkTheme ? '#FFFFFF' : '#000000', // ตัวอักษรสีขาวในโหมดมืด สีดำในโหมดสว่าง
    backgroundColor: isDarkTheme ? '#1A1A2E' : '#FFFFFF', // พื้นหลังโหมดมืด/สว่าง
    border: isDarkTheme ? '2px solid #2E2E3A' : '2px solid #E0E0E0', // ขอบสีเข้มในโหมดมืดและสีเทาอ่อนในโหมดสว่าง
    borderRadius: '15px', // ขอบโค้งมน
    boxShadow: isDarkTheme ? '0 6px 12px rgba(0, 0, 0, 0.5)' : '0 6px 12px rgba(0, 0, 0, 0.1)', // เงาเข้มในโหมดมืดและเงาอ่อนในโหมดสว่าง
    transition: 'color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease', // เพิ่มการเปลี่ยนแปลงนุ่มนวลสำหรับเงา
    fontFamily: 'IBM Plex Sans Thai, sans-serif', // ฟอนต์ไทยที่ทันสมัย
    fontSize: '20px', // ขนาดตัวอักษร
    padding: '1rem', // เพิ่ม padding ให้สวยงาม
    margin: '1rem', // เพิ่ม margin เพื่อให้เนื้อหาดูไม่อัดแน่น
  };

  const moStyle = {
    color: isDarkTheme ? '#FFFFFF' : '#000000',
    backgroundColor: isDarkTheme ? '#1A1A2E' : '#FFFFFF',
    border: isDarkTheme ? '2px solid #2E2E3A' : '2px solid #E0E0E0',
    borderRadius: '15px',
    boxShadow: isDarkTheme ? '0 6px 12px rgba(0, 0, 0, 0.5)' : '0 6px 12px rgba(0, 0, 0, 0.1)',
    transition: 'color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
    fontFamily: 'IBM Plex Sans Thai, sans-serif',
    fontSize: '20px',
    padding: '1rem', // ✅ ใช้ padding ภายในแทน
    width: '100%', // ✅ ให้ชิดขอบใน flex ได้พอดี
    boxSizing: 'border-box', // ✅ รวม border และ padding ให้อยู่ใน 100%
  };

  const menuStyle = {
    // backgroundColor: isDarkTheme ? '#1A1A2E' : '#F0F0F0',
    color: isDarkTheme ? '#F0F0F0' : '#F0F0F0',
    transition: 'background-color 0.3s ease',
    fontFamily: 'IBM Plex Sans Thai, sans-serif',
    fontSize: '20px',
  };

  const choStyle = {
    color: '#4CAF50', // สีเขียว
    fontWeight: 'bold',
    fontSize: '24px', // ขนาดของฟอนต์สำหรับจอใหญ่
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '10px',
  };

  const mobileStyle = {
    ...choStyle,
    fontSize: '18px', // ขนาดของฟอนต์สำหรับจอมือถือ
  };

  const containerStyle = {
    color: isDarkTheme ? '#FFFFFF' : '#000000', // ตัวอักษรสีขาวในโหมดมืด สีดำในโหมดสว่าง
    backgroundColor: isDarkTheme ? '#1A1A2E' : '#FFFFFF', // พื้นหลังโหมดมืด/สว่าง
    border: isDarkTheme ? '2px solid #2E2E3A' : '2px solid #E0E0E0', // ขอบสีเข้มในโหมดมืดและสีเทาอ่อนในโหมดสว่าง
    borderRadius: '15px', // ขอบโค้งมน
    boxShadow: isDarkTheme ? '0 6px 12px rgba(0, 0, 0, 0.5)' : '0 6px 12px rgba(0, 0, 0, 0.1)', // เงาเข้มในโหมดมืดและเงาอ่อนในโหมดสว่าง
    transition: 'color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease', // เพิ่มการเปลี่ยนแปลงนุ่มนวลสำหรับเงา
    fontFamily: 'IBM Plex Sans Thai, sans-serif', // ฟอนต์ไทยที่ทันสมัย
    fontSize: '20px', // ขนาดตัวอักษร
    padding: '1rem', // เพิ่ม padding ให้สวยงาม
    margin: '1rem', // เพิ่ม margin เพื่อให้เนื้อหาดูไม่อัดแน่น
  };


  // ตรวจสอบขนาดหน้าจอ 
  const isMobile = window.innerWidth <= 768;

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    let updatedCart;

    if (existingItem) {
      updatedCart = cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      updatedCart = [...cart, { ...item, quantity: 1 }];
    }

    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleDateChange = (date) => {
    if (endDate > startDate) {
      fetchDataByDateRange();
    } else {
      toast.error("ใส่วันที่ให้ถูกต้อง");
    }
  };

  const removeFromCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem.quantity > 1) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ));
    } else {
      setCart(cart.filter(cartItem => cartItem.id !== item.id));
    }
  };

  const clearCart = () => {
    setCart([]);
    setDeliveryLocation('');
    setMoneyReceived('');
    setCart([]);
    localStorage.removeItem('cart');
    localStorage.removeItem('paymentData');
  };

  const submitCart = async () => {

    if (isSavingside) return; // Prevent further execution if already saving

    setIsSavingside(true); // Disable the save button

    if (cart.length < 1) {
      togPopup();
      return; // Exit the function if cart has 1 or 0 items
    }

    const totalPrice = calculateTotalPrice();
    const totalQual = calculateTotalQual();
    console.log('Submitting cart:', cart);
    console.log('Delivery location:', deliveryLocation);
    console.log('Total price:', totalPrice);



    setCumulativeQuantities(prevQuantities => {
      const newQuantities = { ...prevQuantities };
      cart.forEach(item => {
        newQuantities[item.id] = (newQuantities[item.id] || 0) + item.quantity;
      });
      return newQuantities;
    });

    try {
      const deliveryDataSnapshot = await getDocs(collection(db, 'deliveryData'));
      const currentCount = deliveryDataSnapshot.size;
      if (isAdminside) {
        // Admin: Submit data to Firebase
        const deliveryDocRef = await addDoc(collection(db, 'deliveryData'), {
          cart,
          totalPrice,
          totalQual,
          cumulativeQuantities,
          deliveryLocation,
          moneyReceived,
          numberOfCardsSent: currentCount + 1,
          status: false,
          paidstatus: true,
          date: new Date(),
          nameOrder: "แอดมิน"
        });
        const allocateDocRef = await addDoc(collection(db, 'allocateData'), {
          deliveryLocation
        });

        setCart([]);
        setDeliveryLocation('');
        setMoneyReceived('');
        toggleSac();
        localStorage.removeItem('cart');

        console.log('Document written with ID (deliveryData): ', deliveryDocRef.id);
        console.log('Document written with ID (allocateData): ', allocateDocRef.id);
      }

      else {
        // Not an admin: Redirect to payment page with data
        localStorage.setItem('paymentData', JSON.stringify({
          cart,
          totalPrice,
          totalQual,
          cumulativeQuantities,
          deliveryLocation,
          moneyReceived,
          numberOfCardsSent: currentCount + 1,
        }));
        // window.location.href = '/summandpay'; // Redirect to the payment page
        navigate('/summandpay');
      }
    } catch (e) {
      console.error('Error adding document: ', e);
    } finally {
      setIsSaving(false); // Re-enable the save button
    }
  };

  const formatNumber = (number) => parseFloat(number).toFixed(2);

  const calculateTotalQual = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }

  const calculateTotalPrice = () => {
    return (cart.reduce((total, item) => total + item.price * item.quantity, 0));
  }

  const calculateChange = () => {
    const change = parseFloat(moneyReceived) - parseFloat(calculateTotalPrice());
    return formatNumber(change >= 0 ? change : 0);
  };

  const updateLocalStorage = (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
  };

  const incrementQuantity = (item) => {
    const updatedCart = cart.map(cartItem =>
      cartItem.id === item.id
        ? { ...cartItem, quantity: parseFloat((cartItem.quantity + 0.1).toFixed(2)) }
        : cartItem
    );

    setCart(updatedCart);
    updateLocalStorage(updatedCart);
  };

  const decrementQuantity = (item) => {
    const updatedCart = cart.reduce((updatedCart, cartItem) => {
      if (cartItem.id === item.id) {
        const newQuantity = parseFloat(Math.max(cartItem.quantity - 0.1, 0).toFixed(2));
        if (newQuantity > 0) {
          updatedCart.push({ ...cartItem, quantity: newQuantity });
        }
      } else {
        updatedCart.push(cartItem);
      }
      return updatedCart;
    }, []);

    setCart(updatedCart);
    updateLocalStorage(updatedCart);
  };



  const handleImageClick = (card) => {
    const image = document.getElementById(`image-${card.id}`);
    image.classList.add('image-click-effect');

    setTimeout(() => {
      image.classList.remove('image-click-effect');
    }, 500);

    addToCart(card);
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setDeliveryLocation(value);

    const suggestions = previousLocations.filter(location =>
      location.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredLocations(suggestions);
  };

  const handleLocationSuggestionClick = (suggestion) => {
    setDeliveryLocation(suggestion);
    setFilteredLocations([]);
  };


  // Function to go to the next slide
  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === 4 ? 1 : prevSlide + 1));
  };

  // Function to go to the previous slide
  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === 1 ? 4 : prevSlide - 1));
  };

  // Auto-slide every 5 seconds
  useEffect(() => {
    const slideInterval = setInterval(() => {
      nextSlide();
    }, 5000); // 5 seconds
    return () => clearInterval(slideInterval); // Cleanup on unmount
  }, []);




  return loadingss ? (
    <Load_iy />
  ) : (

    <div className="drawer lg:drawer-open">
      {showPop && <Popup_W />}
      {showSac && <Success_W />}

      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content">

        {iscustomerside && (
          <div className="relative w-full h-64 lg:h-96 overflow-hidden rounded-lg shadow-lg border-2 border-gray-300">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className={`absolute w-full h-full transition-opacity duration-1000 ease-in-out ${currentSlide === slide.id ? 'opacity-100 z-20' : 'opacity-0 z-10'
                  }`}
              >
                <img
                  src={slide.image}
                  className="w-full h-full object-cover"
                  alt={`Slide ${slide.id}`}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-start p-6 lg:p-12">
                  <h2 className="text-xl lg:text-4xl font-bold text-white mb-2">{slide.title}</h2>
                  <p className="text-sm lg:text-lg text-white mb-4">{slide.desc}</p>
                  <button className={`${slide.buttonColor} text-white px-4 py-2 rounded-md`}>
                    {slide.buttonText}
                  </button>
                </div>
              </div>
            ))}

            {/* Navigation Buttons - ✅ ปรับขนาดปุ่มและใส่ bg-opacity */}
            <div className="absolute left-3 right-3 top-1/2 flex -translate-y-1/2 transform justify-between z-30">
              <button
                onClick={() =>
                  setCurrentSlide((currentSlide - 2 + totalSlides) % totalSlides + 1)
                }
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 bg-opacity-50 hover:bg-opacity-70 text-white text-xl"
              >
                ❮
              </button>
              <button
                onClick={() => setCurrentSlide((currentSlide % totalSlides) + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 bg-opacity-50 hover:bg-opacity-70 text-white text-xl"
              >
                ❯
              </button>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
              {slides.map((slide) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(slide.id)}
                  className={`w-3 h-3 rounded-full ${currentSlide === slide.id
                    ? 'bg-gray-900'
                    : 'bg-gray-300 hover:bg-gray-500'
                    }`}
                ></button>
              ))}
            </div>
          </div>


        )}

        {isAdminside && (
          <div className="stats shadow flex justify-center mx-2 mt-2 overflow-x-auto h-auto lg:h-40 text-black bg-gray-100 dark:text-white dark:bg-gray-800" style={containerStyle}>
            <div className="stat">
              {isAdminside && (

                <div className="stat-title text-sm lg:text-base" style={menuStyle}>
                  รายได้ทั้งหมด
                  <div className="stat-value text-primary text-xl lg:text-xl">{formatNumber(totalIncome)} บาท</div>
                </div>
              )}


            </div>
            <div className="stat">

              {isAdminside && (

                <div className="stat-title text-sm lg:text-base" style={menuStyle}>
                  น้ำหนักรวม
                  <div className="stat-value text-secondary text-xl lg:text-xl">{totalQuality.toFixed(2)} กิโลกรัม</div>
                  <div className="stat-value text-xl lg:text-xl">
                    ส่งออกแล้วรวม {deliveryData.filter(item => item.paidstatus === true).length} ชุด
                  </div>
                </div>
              )}
            </div>
          </div>


        )}

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {isAdminside && (
              <Grid item xs={12} lg={4}>
                <DateTimePicker
                  label="วัน/เวลาเริ่มต้น"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  ampm={false}
                  inputFormat="yyyy/MM/dd HH:mm"
                  minutesStep={15}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth margin="normal" />
                  )}
                />
              </Grid>
            )}
            {isAdminside && (
              <Grid item xs={12} lg={4}>
                <DateTimePicker
                  label="วัน/เวลาสิ้นสุด"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  ampm={false}
                  inputFormat="yyyy/MM/dd HH:mm"
                  minutesStep={15}
                  minDate={startDate}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth margin="normal" />
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12} lg={4} display="flex" alignItems="center" gap={2}>
              <Button
                variant="contained"
                onClick={() => {
                  handleDateChange();
                  enqueueSnackbar('ค้นหาวันที่สำเร็จ', { variant: 'info' });
                }}
              >
                ค้นหาวันที่
              </Button>
              <TextField
                label="ค้นหาชื่อผักหรือราคา"
                variant="outlined"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>


        <div className="flex flex-col lg:flex-row mt-2 gap-0">
          <div className="w-full">
            <div className="flex flex-wrap justify-start items-start overflow-auto w-full " style={{ maxHeight: "calc(50vh - 100px)" }}>
              {filteredCards.map(card => (
                <div key={card.id} className="w-1/2 lg:w-1/3 p-1">
                  <div className="card glass w-full mb-0">
                    <figure>
                      <img
                        id={`image-${card.id}`}
                        src={card.imageUrl}
                        alt="product"
                        className="w-full h-40 lg:h-48 object-cover"
                        onClick={() => handleImageClick(card)}
                      />
                    </figure>
                    <div className="card-body" style={totalStyle}>
                      <h2 className="card-title text-base lg:text-lg text-center">{card.title}</h2>
                      <div className="stat-title mr-4 text-lg lg:text-base text-center">
                        ราคา {card.price} บาท
                      </div>

                      {isAdminside && (
                        <>
                          <div className="stat-title mr-4 text-sm lg:text-base text-center">
                            รวม {(cumulativeQuantities[card.id] || 0).toFixed(2)} กก.
                          </div>
                          <div className="text-center text-sm text-red-500">
                            {card.stockKg <= 0 ? '❌ สินค้าหมด' : `✅ เหลือ ${card.stockKg} กก.`}
                          </div>
                        </>
                      )}

                      <div className="card-actions justify-center">
                        <button
                          className="btn btn-primary text-sm lg:text-base px-3 lg:px-4 py-1 lg:py-2"
                          onClick={() => addToCart(card)}
                          disabled={card.stockKg <= 0}
                        >
                          {card.stockKg <= 0 ? 'หมดสต๊อก' : 'เพิ่ม'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>
          <div
            className="w-full lg:w-[calc(50%-4px)] bg-gray-200 dark:bg-gray-700 overflow-y-auto"
            style={{

              marginLeft: 0,
              marginRight: 0,
              ...moStyle,
            }}
          >

            <h2 className="text-lg font-bold mb-0">เลือกผลไม้ใส่ตระกร้า</h2>
            <div>
              <ul className="flex justify-between items-center mb-0 font-bold">
                <li className="w-1/5">ชื่อ</li>
                <li className="w-1/5">ราคา</li>
                <li className="w-1/5">กก.</li>
                <li className="w-1/5">รวม</li>
                <li className="w-1/5">เพิ่ม/ลด(ขีด)</li>
              </ul>
              <ul>
                {cart.map((item, index) => (
                  <li key={index} className="mb-2 flex justify-between items-center">
                    <span className="w-1/5">{item.title}</span> {/* Display title */}
                    <span className="w-1/5">{item.price}</span> {/* Display price */}
                    <span className="w-1/5">{item.name} ({item.quantity})</span> {/* Display quantity */}
                    <span className="w-1/5">{(item.price * item.quantity).toFixed(2)}</span> {/* Display total */}
                    <div className="w-1/5 flex">
                      <button className="btn btn-xs btn-secondary mx-1" onClick={() => decrementQuantity(item)}>-</button>
                      <button className="btn btn-xs btn-primary mx-1" onClick={() => incrementQuantity(item)}>+</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>


            <div className="mt-2 flex justify-end font-bold">
              <div style={{ paddingRight: '10px' }}>ราคารวม</div>
              <div  >{formatNumber(calculateTotalPrice())} บาท</div>

            </div>
            {isAdminside && (
              <div className="mt-4 flex justify-end">
                <input type="text" value={moneyReceived} onChange={e => setMoneyReceived(Number(e.target.value))} placeholder="รับเงินมา"
                  className="input input-bordered w-full max-w-xs" style={menuStyle} />
              </div>
            )}
            {isAdminside && (
              <div className="mt-4 flex justify-end">
                <div className="stat-title mr-4">ทอนเงิน</div>
                <div className="stat-value text-primary" style={menuStyle}> {calculateChange()} บาท</div>
              </div>
            )}
            {isAdminside && (
              <div className="mt-4 flex justify-end">
                <div className="relative w-full max-w-xs">
                  <input
                    style={menuStyle}
                    type="text"
                    placeholder="ใส่ทะเบียนรถ/สถานที่ส่ง"
                    value={deliveryLocation}
                    onChange={handleLocationChange}
                    className="input input-bordered w-full bg-gray-800 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {showSuggestions && filteredLocations.length > 0 && (
                    <ul className="absolute top-full left-0 mt-2 w-full bg-gray-700 text-white rounded-md shadow-lg z-10" style={totalStyle} ref={suggestionListRef}>
                      {filteredLocations.map((suggestion, index) => (
                        <li
                          key={index}
                          className="p-2 cursor-pointer hover:bg-gray-600"
                          onClick={() => {
                            handleLocationSuggestionClick(suggestion);
                            setShowSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>


              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button className="btn btn-secondary mr-2" onClick={clearCart}>ล้าง</button>
              <button className="btn btn-primary" onClick={submitCart}>สั่งของ</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}

export default Sidebar;
