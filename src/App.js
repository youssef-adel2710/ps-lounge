import React, { useState, useEffect, useRef } from 'react';
import { Clock, Settings, DollarSign, Printer, X, Plus, Trash2, Edit2, Upload, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { database } from './firebase';
import { ref, set, get, onValue, update, remove } from 'firebase/database';

const PSLoungeManager = () => {
        const [isAuthenticated, setIsAuthenticated] = useState(false);
        const [isManager, setIsManager] = useState(false);
        const [showSettings, setShowSettings] = useState(false);
        const [showTotals, setShowTotals] = useState(false);
        const [showInventory, setShowInventory] = useState(false);
        const [selectedPS, setSelectedPS] = useState(null);
        const [passwordInput, setPasswordInput] = useState('');
        const [showPasswordError, setShowPasswordError] = useState(false);
        const [customAlertSound, setCustomAlertSound] = useState(null);
        const [loading, setLoading] = useState(true);
        const audioRef = useRef(null);

        const ADMIN_PASSWORD = '86857881';
        const MANAGER_PASSWORD = 'mk86857881';

        const [prices, setPrices] = useState({ singlePlayer: 30, multiPlayer: 45 });
        const [drinks, setDrinks] = useState([
            { id: 1, name: 'اندومي كبير', price: 15, costPrice: 0, stock: 0 },
            { id: 2, name: 'اندومي صغير', price: 10, costPrice: 0, stock: 0 },
            { id: 3, name: 'بسكويت معمول', price: 15, costPrice: 0, stock: 0 },
            { id: 4, name: 'بسكويت بلبن', price: 15, costPrice: 0, stock: 0 },
            { id: 5, name: 'بيبسي', price: 20, costPrice: 0, stock: 0 },
            { id: 6, name: 'فيوري', price: 20, costPrice: 0, stock: 0 },
            { id: 7, name: 'استنج', price: 20, costPrice: 0, stock: 0 },
            { id: 8, name: 'تويست', price: 20, costPrice: 0, stock: 0 },
            { id: 9, name: 'سبرايت', price: 20, costPrice: 0, stock: 0 },
            { id: 10, name: 'فانتا', price: 20, costPrice: 0, stock: 0 },
            { id: 11, name: 'شويبس', price: 20, costPrice: 0, stock: 0 },
            { id: 12, name: 'فيروز', price: 20, costPrice: 0, stock: 0 },
            { id: 13, name: 'مايه صغيرة', price: 5, costPrice: 0, stock: 0 },
            { id: 14, name: 'شاي', price: 10, costPrice: 0, stock: 0 },
            { id: 15, name: 'قهوة تركي', price: 15, costPrice: 0, stock: 0 },
            { id: 16, name: 'قهوة فرنساوي', price: 25, costPrice: 0, stock: 0 },
            { id: 17, name: 'كوفي بريك', price: 15, costPrice: 0, stock: 0 },
            { id: 18, name: 'كوفي ميكس', price: 15, costPrice: 0, stock: 0 },
            { id: 19, name: 'نسكافية', price: 15, costPrice: 0, stock: 0 },
            { id: 20, name: 'ينسون', price: 10, costPrice: 0, stock: 0 },
            { id: 21, name: 'شاي نعناع', price: 10, costPrice: 0, stock: 0 },
            { id: 22, name: 'قرفة بالزنجبيل', price: 10, costPrice: 0, stock: 0 },
        ]);

        const [inventoryPurchases, setInventoryPurchases] = useState([]);
        const [lowStockThreshold, setLowStockThreshold] = useState(5);

        const [playStations, setPlayStations] = useState([
            { id: 1, name: 'PS1', status: 'idle', session: null, totalTimeToday: 0 },
            { id: 2, name: 'PS2', status: 'idle', session: null, totalTimeToday: 0 },
            { id: 3, name: 'PS3', status: 'idle', session: null, totalTimeToday: 0 },
            { id: 4, name: 'PS4', status: 'idle', session: null, totalTimeToday: 0 }
        ]);
        const [dailyRevenue, setDailyRevenue] = useState({ date: new Date().toDateString(), ps: 0, drinks: 0 });
        const [drinksSoldToday, setDrinksSoldToday] = useState({});
        const [standaloneDrinkSale, setStandaloneDrinkSale] = useState([]);

        // Load data from Firebase on mount
        useEffect(() => {
            loadDataFromFirebase();
        }, []);

        // Save to Firebase whenever data changes
        useEffect(() => {
            if (!loading) {
                saveToFirebase();
            }
        }, [prices, drinks, playStations, dailyRevenue, drinksSoldToday, standaloneDrinkSale, inventoryPurchases, lowStockThreshold]);

        const loadDataFromFirebase = async() => {
            try {
                const dataRef = ref(database, 'psLoungeData');
                const snapshot = await get(dataRef);

                if (snapshot.exists()) {
                    const data = snapshot.val();

                    if (data.prices) setPrices(data.prices);
                    if (data.drinks) setDrinks(data.drinks);
                    if (data.playStations) setPlayStations(data.playStations);
                    if (data.dailyRevenue) setDailyRevenue(data.dailyRevenue);
                    if (data.drinksSoldToday) setDrinksSoldToday(data.drinksSoldToday);
                    if (data.standaloneDrinkSale) setStandaloneDrinkSale(data.standaloneDrinkSale);
                    if (data.inventoryPurchases) setInventoryPurchases(data.inventoryPurchases);
                    if (data.lowStockThreshold) setLowStockThreshold(data.lowStockThreshold);
                }
            } catch (error) {
                console.error('Error loading data from Firebase:', error);
            } finally {
                setLoading(false);
            }
        };

        const saveToFirebase = async() => {
            try {
                const dataRef = ref(database, 'psLoungeData');
                await set(dataRef, {
                    prices,
                    drinks,
                    playStations,
                    dailyRevenue,
                    drinksSoldToday,
                    standaloneDrinkSale,
                    inventoryPurchases,
                    lowStockThreshold,
                    lastUpdated: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error saving to Firebase:', error);
            }
        };

        // Check for time-up notifications
        useEffect(() => {
            const interval = setInterval(() => {
                setPlayStations(prev => prev.map(ps => {
                    if (ps.status === 'running' && ps.session && ps.session.bookingMinutes && !ps.session.notified) {
                        const elapsed = (Date.now() - ps.session.startTime) / 1000 / 60;
                        if (elapsed >= ps.session.bookingMinutes) {
                            if (audioRef.current) {
                                audioRef.current.pause();
                                audioRef.current = null;
                            }

                            const audio = customAlertSound ?
                                new Audio(customAlertSound) :
                                new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ8PVqzn77BdGAg+ltryxnMpBSp+zPDajzsIGGS57OihUhENTKXh8bllHgU2jdXzz3wxBSh6yu/ekTsIF2q/7uOYTw8PWKzi8LJeGAg+l9ryxnQoBSp8zPDajDsIF2m+7uOYTw8PWKzh8LJeGAg/l9rxw3MpBSp8zPDajDsIF2m+7uOYTw8PWKzh8LJeGAg/l9rxw3MpBSp8zPDajDsIF2m+7uOYTw8PWKzh8LJeGAg/l9rxw3MpBSp8zPDajDsIF2m+7uOYTw8PWKzh8LJeGAg/l9rxw3MpBSp8zPDajDsIF2m+7uOYTw8PWKzh8LJeGAg/l9rxw3MpBSp8zPDajDsIF2m+7uOYTw8PWKzh8LJeGAg/l9rxw3MpBSp8zPDajDsIF2m+7uOYTw8PWKzh8LJeGAg/');

                            audio.loop = true;
                            audioRef.current = audio;

                            audio.play().catch(err => console.log('Audio play failed:', err));
                            alert(`⏰ TIME'S UP! ${ps.name} booking has finished!`);

                            return {...ps, session: {...ps.session, notified: true } };
                        }
                    }
                    return ps;
                }));
            }, 1000);
            return () => clearInterval(interval);
        }, [customAlertSound]);

        const handleSoundUpload = (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                setCustomAlertSound(url);
                alert('Alert sound uploaded successfully!');
            }
        };

        const resetAllTotals = async() => {
            if (window.confirm('Are you sure you want to reset all totals? This cannot be undone.')) {
                const newData = {
                    date: new Date().toDateString(),
                    ps: 0,
                    drinks: 0
                };
                setDailyRevenue(newData);
                setDrinksSoldToday({});
                setStandaloneDrinkSale([]);
                setPlayStations(prev => prev.map(ps => ({...ps, totalTimeToday: 0, status: 'idle', session: null })));

                // Save reset to Firebase
                try {
                    const dataRef = ref(database, 'psLoungeData');
                    await update(dataRef, {
                        dailyRevenue: newData,
                        drinksSoldToday: {},
                        standaloneDrinkSale: [],
                        playStations: playStations.map(ps => ({...ps, totalTimeToday: 0, status: 'idle', session: null }))
                    });
                } catch (error) {
                    console.error('Error resetting data:', error);
                }

                alert('All totals have been reset successfully!');
            }
        };

        const handleLogin = () => {
            if (passwordInput === ADMIN_PASSWORD) {
                setIsAuthenticated(true);
                setIsManager(false);
                setPasswordInput('');
                setShowPasswordError(false);
            } else if (passwordInput === MANAGER_PASSWORD) {
                setIsAuthenticated(true);
                setIsManager(true);
                setPasswordInput('');
                setShowPasswordError(false);
            } else {
                setShowPasswordError(true);
            }
        };

        const handleLogout = () => {
            setIsAuthenticated(false);
            setIsManager(false);
            setSelectedPS(null);
            setShowSettings(false);
            setShowTotals(false);
            setShowInventory(false);
        };

        const startSession = (psId, mode, bookingMinutes = null, prepaid = false) => {
            setPlayStations(prev => prev.map(ps => {
                if (ps.id === psId) {
                    return {
                        ...ps,
                        status: 'running',
                        session: {
                            mode,
                            startTime: Date.now(),
                            drinks: [],
                            bookingMinutes: bookingMinutes,
                            notified: false,
                            prepaid: prepaid
                        }
                    };
                }
                return ps;
            }));
        };

        const togglePrepaid = (psId) => {
            setPlayStations(prev => prev.map(ps => {
                if (ps.id === psId && ps.session) {
                    return {
                        ...ps,
                        session: {...ps.session, prepaid: !ps.session.prepaid }
                    };
                }
                return ps;
            }));
        };

        const stopSession = (psId) => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            setPlayStations(prev => prev.map(ps => {
                if (ps.id === psId && ps.session) {
                    return {
                        ...ps,
                        session: {...ps.session, endTime: Date.now() }
                    };
                }
                return ps;
            }));
        };

        const addDrinkToSession = (psId, drink) => {
            if (drink.stock <= 0) {
                alert(`${drink.name} is out of stock!`);
                return;
            }

            setPlayStations(prev => prev.map(ps => {
                if (ps.id === psId && ps.session) {
                    return {
                        ...ps,
                        session: {...ps.session, drinks: [...ps.session.drinks, {...drink, id: Date.now() }] }
                    };
                }
                return ps;
            }));

            setDrinks(prev => prev.map(d =>
                d.id === drink.id ? {...d, stock: d.stock - 1 } : d
            ));

            setDrinksSoldToday(prev => ({
                ...prev,
                [drink.name]: (prev[drink.name] || 0) + 1
            }));
        };

        const removeDrinkFromSession = (psId, drinkId, drinkName) => {
            setPlayStations(prev => prev.map(ps => {
                if (ps.id === psId && ps.session) {
                    return {
                        ...ps,
                        session: {...ps.session, drinks: ps.session.drinks.filter(d => d.id !== drinkId) }
                    };
                }
                return ps;
            }));

            const drink = drinks.find(d => d.name === drinkName);
            if (drink) {
                setDrinks(prev => prev.map(d =>
                    d.id === drink.id ? {...d, stock: d.stock + 1 } : d
                ));
            }

            setDrinksSoldToday(prev => ({
                ...prev,
                [drinkName]: Math.max(0, (prev[drinkName] || 0) - 1)
            }));
        };

        const cancelSession = (psId) => {
            if (window.confirm('Are you sure you want to cancel this session?')) {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }

                const ps = playStations.find(p => p.id === psId);
                if (ps && ps.session) {
                    ps.session.drinks.forEach(drink => {
                        setDrinks(prev => prev.map(d =>
                            d.name === drink.name ? {...d, stock: d.stock + 1 } : d
                        ));

                        setDrinksSoldToday(prev => ({
                            ...prev,
                            [drink.name]: Math.max(0, (prev[drink.name] || 0) - 1)
                        }));
                    });
                }

                setPlayStations(prev => prev.map(p => {
                    if (p.id === psId) {
                        return {...p, status: 'idle', session: null };
                    }
                    return p;
                }));
                setSelectedPS(null);
            }
        };

        const completeSession = (psId) => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            const ps = playStations.find(p => p.id === psId);
            if (!ps || !ps.session) return;

            const session = ps.session;
            const duration = (session.endTime - session.startTime) / 1000 / 60 / 60;
            const pricePerHour = session.mode === 'single' ? prices.singlePlayer : prices.multiPlayer;
            const psCost = duration * pricePerHour;
            const drinksCost = session.drinks.reduce((sum, d) => sum + d.price, 0);

            setDailyRevenue(prev => ({
                ...prev,
                ps: prev.ps + psCost,
                drinks: prev.drinks + drinksCost
            }));

            setPlayStations(prev => prev.map(p => {
                if (p.id === psId) {
                    return {...p, status: 'idle', session: null, totalTimeToday: p.totalTimeToday + duration };
                }
                return p;
            }));

            setSelectedPS(null);
        };

        const sellStandaloneDrink = (drink) => {
            if (drink.stock <= 0) {
                alert(`${drink.name} is out of stock!`);
                return;
            }

            const saleId = Date.now();
            setStandaloneDrinkSale(prev => [...prev, {...drink, saleId, timestamp: saleId }]);
            setDailyRevenue(prev => ({
                ...prev,
                drinks: prev.drinks + drink.price
            }));
            setDrinksSoldToday(prev => ({
                ...prev,
                [drink.name]: (prev[drink.name] || 0) + 1
            }));

            setDrinks(prev => prev.map(d =>
                d.id === drink.id ? {...d, stock: d.stock - 1 } : d
            ));
        };

        const removeStandaloneDrink = (saleId, drinkName, drinkPrice) => {
            if (window.confirm('Remove this drink sale?')) {
                setStandaloneDrinkSale(prev => prev.filter(s => s.saleId !== saleId));
                setDailyRevenue(prev => ({
                    ...prev,
                    drinks: prev.drinks - drinkPrice
                }));
                setDrinksSoldToday(prev => ({
                    ...prev,
                    [drinkName]: Math.max(0, (prev[drinkName] || 0) - 1)
                }));

                const drink = drinks.find(d => d.name === drinkName);
                if (drink) {
                    setDrinks(prev => prev.map(d =>
                        d.id === drink.id ? {...d, stock: d.stock + 1 } : d
                    ));
                }
            }
        };

        const addDrink = (name, price) => {
            const newDrink = { id: Date.now(), name, price: parseFloat(price), costPrice: 0, stock: 0 };
            setDrinks([...drinks, newDrink]);
        };

        const editDrink = (id, name, price) => {
            setDrinks(drinks.map(d => d.id === id ? {...d, name, price: parseFloat(price) } : d));
        };

        const deleteDrink = (id) => {
            setDrinks(drinks.filter(d => d.id !== id));
        };

        const addInventoryPurchase = (drinkId, quantity, costPricePerUnit) => {
            const drink = drinks.find(d => d.id === drinkId);
            if (!drink) return;

            const purchase = {
                id: Date.now(),
                drinkId,
                drinkName: drink.name,
                quantity: parseInt(quantity),
                costPricePerUnit: parseFloat(costPricePerUnit),
                totalCost: parseInt(quantity) * parseFloat(costPricePerUnit),
                purchaseDate: new Date().toISOString()
            };

            setInventoryPurchases(prev => [...prev, purchase]);

            setDrinks(prev => prev.map(d =>
                d.id === drinkId ? {
                    ...d,
                    stock: d.stock + parseInt(quantity),
                    costPrice: parseFloat(costPricePerUnit)
                } : d
            ));
        };

        const deleteInventoryPurchase = (purchaseId) => {
            if (window.confirm('Delete this inventory purchase? Stock will be adjusted.')) {
                const purchase = inventoryPurchases.find(p => p.id === purchaseId);
                if (purchase) {
                    setDrinks(prev => prev.map(d =>
                        d.id === purchase.drinkId ? {
                            ...d,
                            stock: Math.max(0, d.stock - purchase.quantity)
                        } : d
                    ));
                }
                setInventoryPurchases(prev => prev.filter(p => p.id !== purchaseId));
            }
        };

        const calculateProfitStats = () => {
            let totalRevenue = 0;
            let totalCost = 0;
            let totalProfit = 0;
            const drinkStats = {};

            drinks.forEach(drink => {
                const soldCount = drinksSoldToday[drink.name] || 0;
                const revenue = soldCount * drink.price;
                const cost = soldCount * (drink.costPrice || 0);
                const profit = revenue - cost;

                if (soldCount > 0) {
                    drinkStats[drink.name] = {
                        sold: soldCount,
                        revenue,
                        cost,
                        profit,
                        profitPerUnit: drink.price - (drink.costPrice || 0),
                        stock: drink.stock
                    };
                }

                totalRevenue += revenue;
                totalCost += cost;
                totalProfit += profit;
            });

            return { totalRevenue, totalCost, totalProfit, drinkStats };
        };

        if (loading) {
            return ( <
                div className = "min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center" >
                <
                div className = "text-white text-2xl" > Loading data from database... < /div> < /
                div >
            );
        }

        if (!isAuthenticated) {
            return ( <
                div className = "min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4" >
                <
                div className = "bg-white rounded-lg shadow-2xl p-8 w-full max-w-md" >
                <
                div className = "text-center mb-8" >
                <
                h1 className = "text-3xl font-bold text-gray-800 mb-2" > PlayStation Lounge < /h1> <
                p className = "text-gray-600" > Management System < /p> < /
                div > <
                div className = "space-y-4" >
                <
                input type = "password"
                placeholder = "Enter Password"
                value = { passwordInput }
                onChange = {
                    (e) => setPasswordInput(e.target.value)
                }
                onKeyPress = {
                    (e) => e.key === 'Enter' && handleLogin()
                }
                className = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /
                >
                {
                    showPasswordError && ( <
                        p className = "text-red-500 text-sm" > Incorrect password < /p>
                    )
                } <
                button onClick = { handleLogin }
                className = "w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition" >
                Login <
                /button> < /
                div > <
                /div> < /
                div >
            );
        }

        if (showSettings && isManager) {
            return ( <
                SettingsPanel prices = { prices }
                setPrices = { setPrices }
                drinks = { drinks }
                addDrink = { addDrink }
                editDrink = { editDrink }
                deleteDrink = { deleteDrink }
                onClose = {
                    () => setShowSettings(false)
                }
                customAlertSound = { customAlertSound }
                onSoundUpload = { handleSoundUpload }
                lowStockThreshold = { lowStockThreshold }
                setLowStockThreshold = { setLowStockThreshold }
                />
            );
        }

        if (showInventory && isManager) {
            return ( <
                InventoryPanel drinks = { drinks }
                inventoryPurchases = { inventoryPurchases }
                onAddPurchase = { addInventoryPurchase }
                onDeletePurchase = { deleteInventoryPurchase }
                onClose = {
                    () => setShowInventory(false)
                }
                lowStockThreshold = { lowStockThreshold }
                />
            );
        }

        if (showTotals) {
            return ( <
                TotalsPage dailyRevenue = { dailyRevenue }
                drinksSoldToday = { drinksSoldToday }
                playStations = { playStations }
                standaloneDrinkSale = { standaloneDrinkSale }
                onClose = {
                    () => setShowTotals(false)
                }
                onReset = { resetAllTotals }
                onRemoveStandaloneDrink = { removeStandaloneDrink }
                profitStats = { calculateProfitStats() }
                isManager = { isManager }
                />
            );
        }

        if (selectedPS) {
            return ( <
                SessionScreen ps = { playStations.find(p => p.id === selectedPS) }
                prices = { prices }
                drinks = { drinks }
                onBack = {
                    () => setSelectedPS(null)
                }
                onStartSession = { startSession }
                onStopSession = { stopSession }
                onAddDrink = { addDrinkToSession }
                onRemoveDrink = { removeDrinkFromSession }
                onComplete = { completeSession }
                onCancel = { cancelSession }
                onTogglePrepaid = { togglePrepaid }
                />
            );
        }

        const lowStockItems = drinks.filter(d => d.stock > 0 && d.stock <= lowStockThreshold);

        return ( <
                div className = "min-h-screen bg-gray-100 p-6" >
                <
                div className = "max-w-7xl mx-auto" >
                <
                div className = "flex justify-between items-center mb-8" >
                <
                h1 className = "text-3xl font-bold text-gray-800" > PlayStation Lounge Dashboard < /h1> <
                div className = "flex gap-3" >
                <
                button onClick = {
                    () => setShowTotals(true)
                }
                className = "flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition" >
                <
                DollarSign size = { 20 }
                />
                Totals <
                /button> {
                isManager && ( <
                    >
                    <
                    button onClick = {
                        () => setShowInventory(true)
                    }
                    className = "flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition" >
                    <
                    Package size = { 20 }
                    />
                    Inventory <
                    /button> <
                    button onClick = {
                        () => setShowSettings(true)
                    }
                    className = "flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition" >
                    <
                    Settings size = { 20 }
                    />
                    Settings <
                    /button> < / >
                )
            } <
            button onClick = { handleLogout }
        className = "bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition" >
            Logout <
            /button> < /
        div > <
            /div>

        {
            lowStockItems.length > 0 && ( <
                div className = "mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4" >
                <
                div className = "flex items-center gap-3" >
                <
                AlertTriangle className = "text-yellow-600"
                size = { 24 }
                /> <
                div >
                <
                h3 className = "font-bold text-yellow-800" > Low Stock Alert! < /h3> <
                p className = "text-sm text-yellow-700" > { lowStockItems.map(d => `${d.name} (${d.stock} left)`).join(', ') } <
                /p> < /
                div > <
                /div> < /
                div >
            )
        }

        <
        div className = "mb-8" >
            <
            h2 className = "text-2xl font-bold text-gray-800 mb-4" > PlayStation Consoles < /h2> <
        div className = "grid grid-cols-1 md:grid-cols-2 gap-6" > {
            playStations.map(ps => {
                    const isRunning = ps.status === 'running';
                    return ( <
                            div key = { ps.id }
                            onClick = {
                                () => setSelectedPS(ps.id)
                            }
                            className = { `cursor-pointer rounded-2xl p-8 shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl ${
                                        isRunning 
                                          ? 'bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white' 
                                          : 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white'
                                    }` } >
                            <
                            div className = "flex items-center justify-between mb-6" >
                            <
                            h3 className = "text-4xl font-bold" > { ps.name } < /h3> <
                            div className = { `px-4 py-2 rounded-full text-sm font-bold ${
                                            isRunning 
                                                ? 'bg-white text-green-600 shadow-lg' 
                                                : 'bg-white bg-opacity-30 backdrop-blur-sm'
                                        }` } > { isRunning ? '🎮 RUNNING' : '⏸️ IDLE' } <
                            /div> < /
                            div > {
                                isRunning && ps.session && ( <
                                    div className = "bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4" >
                                    <
                                    SessionTimer startTime = { ps.session.startTime }
                                    bookingMinutes = { ps.session.bookingMinutes }
                                    /> {
                                    ps.session.prepaid && ( <
                                        div className = "mt-2 text-sm font-semibold" > ✓Prepaid < /div>
                                    )
                                } <
                                /div>
                            )
                        } {
                            !isRunning && ( <
                                div className = "text-white text-opacity-90 text-lg" >
                                Click to start a session <
                                /div>
                            )
                        } <
                        /div>
                );
            })
    } <
    /div> < /
div >

    <
    div className = "bg-white rounded-2xl shadow-xl p-8" >
    <
    h2 className = "text-2xl font-bold text-gray-800 mb-6" > Drinks Menu < /h2> <
div className = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" > {
        drinks.map(drink => ( <
            button key = { drink.id }
            onClick = {
                () => sellStandaloneDrink(drink)
            }
            disabled = { drink.stock <= 0 }
            className = { `p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${
                                    drink.stock <= 0 
                                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                                        : 'bg-gradient-to-br from-orange-400 to-pink-500 text-white hover:from-orange-500 hover:to-pink-600'
                                }` } >
            <
            p className = "font-bold text-lg mb-2" > { drink.name } < /p> <
            p className = "text-2xl font-bold" > { drink.price }
            EGP < /p> <
            p className = "text-sm mt-2 opacity-90" >
            Stock: { drink.stock } { drink.stock <= 0 && ' (Out of Stock)' } { drink.stock > 0 && drink.stock <= lowStockThreshold && ' ⚠️' } <
            /p> < /
            button >
        ))
    } <
    /div> < /
div > <
    /div> < /
div >
);
};

// SessionTimer, SessionScreen, InventoryPanel, TotalsPage, and SettingsPanel components remain the same as before
// (Include all the component code from the previous version here)

const SessionTimer = ({ startTime, bookingMinutes }) => {
    const [elapsed, setElapsed] = useState('');
    const [timeLeft, setTimeLeft] = useState('');
    const [isOvertime, setIsOvertime] = useState(false);

    useEffect(() => {
        const updateTimer = () => {
            const diff = Date.now() - startTime;
            const totalSeconds = Math.floor(diff / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            setElapsed(`${hours}h ${minutes}m ${seconds}s`);

            if (bookingMinutes) {
                const bookedSeconds = bookingMinutes * 60;
                const remainingSeconds = bookedSeconds - totalSeconds;

                if (remainingSeconds <= 0) {
                    setIsOvertime(true);
                    const overtimeSeconds = Math.abs(remainingSeconds);
                    const overtimeHours = Math.floor(overtimeSeconds / 3600);
                    const overtimeMinutes = Math.floor((overtimeSeconds % 3600) / 60);
                    const overtimeSecs = overtimeSeconds % 60;
                    setTimeLeft(`+${overtimeHours}h ${overtimeMinutes}m ${overtimeSecs}s`);
                } else {
                    setIsOvertime(false);
                    const remHours = Math.floor(remainingSeconds / 3600);
                    const remMinutes = Math.floor((remainingSeconds % 3600) / 60);
                    const remSecs = remainingSeconds % 60;
                    setTimeLeft(`${remHours}h ${remMinutes}m ${remSecs}s`);
                }
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [startTime, bookingMinutes]);

    return ( <
            div className = "space-y-3" >
            <
            div className = "flex items-center gap-2" >
            <
            Clock size = { 20 }
            /> <
            div >
            <
            p className = "text-sm opacity-75" > Time Elapsed < /p> <
            span className = "font-mono text-lg font-bold" > { elapsed } < /span> < /
            div > <
            /div> {
            bookingMinutes && ( <
                div className = "flex items-center gap-2" >
                <
                Clock size = { 20 }
                /> <
                div >
                <
                p className = "text-sm opacity-75" > { isOvertime ? 'Overtime' : 'Time Remaining' } < /p> <
                span className = { `font-mono text-lg font-bold ${isOvertime ? 'text-red-600' : 'text-green-600'}` } > { timeLeft } <
                /span> < /
                div > <
                /div>
            )
        } <
        /div>
);
};

const SessionScreen = ({ ps, prices, drinks, onBack, onStartSession, onStopSession, onAddDrink, onRemoveDrink, onComplete, onCancel, onTogglePrepaid }) => {
    const [selectedMode, setSelectedMode] = useState(null);
    const [showInvoice, setShowInvoice] = useState(false);
    const [bookingType, setBookingType] = useState('open');
    const [customMinutes, setCustomMinutes] = useState('');
    const [prepaid, setPrepaid] = useState(false);

    const isRunning = ps.status === 'running' && ps.session;
    const isStopped = ps.session && ps.session.endTime;

    const handleStart = () => {
        if (selectedMode) {
            const minutes = bookingType === 'timed' ? parseInt(customMinutes) || null : null;
            onStartSession(ps.id, selectedMode, minutes, prepaid);
        }
    };

    if (showInvoice && isStopped) {
        const duration = (ps.session.endTime - ps.session.startTime) / 1000 / 60 / 60;
        const pricePerHour = ps.session.mode === 'single' ? prices.singlePlayer : prices.multiPlayer;
        const psCost = duration * pricePerHour;
        const drinksCost = ps.session.drinks.reduce((sum, d) => sum + d.price, 0);
        const total = psCost + drinksCost;

        return ( <
            div className = "min-h-screen bg-gray-100 p-6" >
            <
            div className = "max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8" >
            <
            div className = "flex justify-between items-start mb-8" >
            <
            h2 className = "text-2xl font-bold" > Invoice < /h2> <
            button onClick = {
                () => setShowInvoice(false)
            }
            className = "text-gray-500 hover:text-gray-700" >
            <
            X size = { 24 }
            /> < /
            button > <
            /div>

            <
            div className = "space-y-4 mb-8" >
            <
            div className = "flex justify-between" >
            <
            span className = "font-semibold" > PlayStation: < /span> <
            span > { ps.name } < /span> < /
            div > <
            div className = "flex justify-between" >
            <
            span className = "font-semibold" > Mode: < /span> <
            span > { ps.session.mode === 'single' ? 'Single Player' : 'Multiplayer' } < /span> < /
            div > <
            div className = "flex justify-between" >
            <
            span className = "font-semibold" > Payment Status: < /span> <
            span className = { ps.session.prepaid ? 'text-green-600 font-semibold' : 'text-orange-600' } > { ps.session.prepaid ? '✓ Prepaid' : 'Pay Now' } <
            /span> < /
            div > <
            div className = "flex justify-between" >
            <
            span className = "font-semibold" > Start Time: < /span> <
            span > { new Date(ps.session.startTime).toLocaleTimeString() } < /span> < /
            div > <
            div className = "flex justify-between" >
            <
            span className = "font-semibold" > End Time: < /span> <
            span > { new Date(ps.session.endTime).toLocaleTimeString() } < /span> < /
            div > <
            div className = "flex justify-between" >
            <
            span className = "font-semibold" > Duration: < /span> <
            span > { Math.floor(duration) }
            h { Math.round((duration % 1) * 60) }
            m < /span> < /
            div > <
            div className = "flex justify-between" >
            <
            span className = "font-semibold" > Price per Hour: < /span> <
            span > { pricePerHour }
            EGP < /span> < /
            div > <
            div className = "flex justify-between text-lg" >
            <
            span className = "font-bold" > PlayStation Cost: < /span> <
            span className = "font-bold" > { psCost.toFixed(2) }
            EGP < /span> < /
            div > <
            /div>

            {
                ps.session.drinks.length > 0 && ( <
                        div className = "border-t pt-4 mb-4" >
                        <
                        h3 className = "font-bold mb-3" > Drinks < /h3> {
                        ps.session.drinks.map((drink, idx) => ( <
                            div key = { idx }
                            className = "flex justify-between mb-2" >
                            <
                            span > { drink.name } < /span> <
                            span > { drink.price }
                            EGP < /span> < /
                            div >
                        ))
                    } <
                    div className = "flex justify-between text-lg mt-3" >
                    <
                    span className = "font-bold" > Drinks Total: < /span> <
                span className = "font-bold" > { drinksCost.toFixed(2) }
                EGP < /span> < /
                div > <
                    /div>
            )
        }

        <
        div className = "border-t-2 pt-4 flex justify-between text-2xl font-bold" >
            <
            span > Total Amount: < /span> <
        span > { total.toFixed(2) }
        EGP < /span> < /
        div >

            <
            div className = "flex gap-3 mt-8" >
            <
            button onClick = {
                () => window.print()
            }
        className = "flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition" >
            <
            Printer size = { 20 }
        />
        Print Invoice <
            /button> <
        button onClick = {
            () => {
                onComplete(ps.id);
                setShowInvoice(false);
            }
        }
        className = "flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition" >
            Complete <
            /button> < /
        div > <
            /div> < /
        div >
    );
}

return ( <
    div className = "min-h-screen bg-gray-100 p-6" >
    <
    div className = "max-w-4xl mx-auto" >
    <
    button onClick = { onBack }
    className = "mb-6 text-blue-600 hover:text-blue-700 font-semibold" > ←Back to Dashboard <
    /button>

    <
    div className = "bg-white rounded-lg shadow-lg p-8" >
    <
    h2 className = "text-3xl font-bold mb-6" > { ps.name } < /h2>

    {
        !isRunning && !isStopped && ( <
            div className = "space-y-6" >
            <
            div >
            <
            h3 className = "text-xl font-semibold mb-4" > Select Play Mode < /h3> <
            div className = "grid grid-cols-2 gap-4" >
            <
            button onClick = {
                () => setSelectedMode('single')
            }
            className = { `p-6 rounded-lg border-2 transition ${
                                            selectedMode === 'single'
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-gray-300 hover:border-blue-400'
                                        }` } >
            <
            h4 className = "font-bold text-lg mb-2" > Single Player < /h4> <
            p className = "text-gray-600" > 1 or 2 Controller < /p> <
            p className = "text-2xl font-bold text-blue-600 mt-3" > { prices.singlePlayer }
            EGP / hr < /p> < /
            button > <
            button onClick = {
                () => setSelectedMode('multi')
            }
            className = { `p-6 rounded-lg border-2 transition ${
                                            selectedMode === 'multi'
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-gray-300 hover:border-blue-400'
                                        }` } >
            <
            h4 className = "font-bold text-lg mb-2" > Multiplayer < /h4> <
            p className = "text-gray-600" > Up to 4 Controllers < /p> <
            p className = "text-2xl font-bold text-blue-600 mt-3" > { prices.multiPlayer }
            EGP / hr < /p> < /
            button > <
            /div> < /
            div >

            <
            div >
            <
            h3 className = "text-xl font-semibold mb-4" > Booking Type < /h3> <
            div className = "grid grid-cols-2 gap-4 mb-4" >
            <
            button onClick = {
                () => setBookingType('open')
            }
            className = { `p-4 rounded-lg border-2 transition ${
                                            bookingType === 'open'
                                                ? 'border-green-600 bg-green-50'
                                                : 'border-gray-300 hover:border-green-400'
                                        }` } >
            <
            h4 className = "font-bold mb-1" > Open Time < /h4> <
            p className = "text-sm text-gray-600" > Pay
            for actual time used < /p> < /
            button > <
            button onClick = {
                () => setBookingType('timed')
            }
            className = { `p-4 rounded-lg border-2 transition ${
                                            bookingType === 'timed'
                                                ? 'border-green-600 bg-green-50'
                                                : 'border-gray-300 hover:border-green-400'
                                        }` } >
            <
            h4 className = "font-bold mb-1" > Timed Booking < /h4> <
            p className = "text-sm text-gray-600" > Set specific duration < /p> < /
            button > <
            /div>

            {
                bookingType === 'timed' && ( <
                    div className = "space-y-3" >
                    <
                    div className = "grid grid-cols-3 gap-3" >
                    <
                    button onClick = {
                        () => setCustomMinutes('10')
                    }
                    className = "p-3 bg-purple-100 hover:bg-purple-200 rounded-lg font-semibold text-purple-700 transition" > 10 min < /button> <
                    button onClick = {
                        () => setCustomMinutes('20')
                    }
                    className = "p-3 bg-purple-100 hover:bg-purple-200 rounded-lg font-semibold text-purple-700 transition" > 20 min < /button> <
                    button onClick = {
                        () => setCustomMinutes('30')
                    }
                    className = "p-3 bg-purple-100 hover:bg-purple-200 rounded-lg font-semibold text-purple-700 transition" > 30 min < /button> <
                    button onClick = {
                        () => setCustomMinutes('40')
                    }
                    className = "p-3 bg-purple-100 hover:bg-purple-200 rounded-lg font-semibold text-purple-700 transition" > 40 min < /button> <
                    button onClick = {
                        () => setCustomMinutes('60')
                    }
                    className = "p-3 bg-purple-100 hover:bg-purple-200 rounded-lg font-semibold text-purple-700 transition" > 1 hour < /button> <
                    button onClick = {
                        () => setCustomMinutes('90')
                    }
                    className = "p-3 bg-purple-100 hover:bg-purple-200 rounded-lg font-semibold text-purple-700 transition" > 1.5 hours < /button> <
                    button onClick = {
                        () => setCustomMinutes('120')
                    }
                    className = "p-3 bg-purple-100 hover:bg-purple-200 rounded-lg font-semibold text-purple-700 transition" > 2 hours < /button> <
                    button onClick = {
                        () => setCustomMinutes('150')
                    }
                    className = "p-3 bg-purple-100 hover:bg-purple-200 rounded-lg font-semibold text-purple-700 transition" > 2.5 hours < /button> <
                    button onClick = {
                        () => setCustomMinutes('180')
                    }
                    className = "p-3 bg-purple-100 hover:bg-purple-200 rounded-lg font-semibold text-purple-700 transition" > 3 hours < /button> < /
                    div > <
                    div >
                    <
                    label className = "block text-sm font-semibold mb-2" > Or enter custom minutes: < /label> <
                    input type = "number"
                    value = { customMinutes }
                    onChange = {
                        (e) => setCustomMinutes(e.target.value)
                    }
                    placeholder = "Enter minutes"
                    className = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /
                    >
                    <
                    /div>

                    <
                    div className = "bg-blue-50 border-2 border-blue-300 rounded-lg p-4" >
                    <
                    label className = "flex items-center gap-3 cursor-pointer" >
                    <
                    input type = "checkbox"
                    checked = { prepaid }
                    onChange = {
                        (e) => setPrepaid(e.target.checked)
                    }
                    className = "w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" /
                    >
                    <
                    div >
                    <
                    span className = "font-semibold text-gray-800" > Customer Prepaid < /span> <
                    p className = "text-sm text-gray-600" > Check this
                    if customer has paid before starting < /p> < /
                    div > <
                    /label> < /
                    div > <
                    /div>
                )
            } <
            /div>

            <
            button onClick = { handleStart }
            disabled = {!selectedMode || (bookingType === 'timed' && !customMinutes) }
            className = "w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed" >
            Start Session <
            /button> < /
            div >
        )
    }

    {
        isRunning && !isStopped && ( <
                div className = "space-y-6" >
                <
                div className = { `border-2 rounded-lg p-6 ${
                                ps.session.bookingMinutes ? 'bg-purple-50 border-purple-600' : 'bg-green-50 border-green-600'
                            }` } >
                <
                h3 className = "text-xl font-semibold mb-2" > Session Running < /h3> <
                p className = "text-gray-600 mb-2" > Mode: { ps.session.mode === 'single' ? 'Single Player' : 'Multiplayer' } < /p> {
                ps.session.bookingMinutes && ( <
                    p className = "text-purple-700 font-semibold mb-2" >
                    Booked Time: { Math.floor(ps.session.bookingMinutes / 60) }
                    h { ps.session.bookingMinutes % 60 }
                    m <
                    /p>
                )
            } <
            SessionTimer startTime = { ps.session.startTime }
        bookingMinutes = { ps.session.bookingMinutes }
        />

        {
            ps.session.bookingMinutes && ( <
                div className = "mt-4 bg-white rounded-lg p-3" >
                <
                label className = "flex items-center gap-3 cursor-pointer" >
                <
                input type = "checkbox"
                checked = { ps.session.prepaid || false }
                onChange = {
                    () => onTogglePrepaid(ps.id)
                }
                className = "w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500" /
                >
                <
                div >
                <
                span className = "font-semibold text-gray-800" > { ps.session.prepaid ? '✓ Prepaid' : 'Mark as Prepaid' } <
                /span> <
                p className = "text-sm text-gray-600" > { ps.session.prepaid ? 'Customer has paid' : 'Will pay after session' } <
                /p> < /
                div > <
                /label> < /
                div >
            )
        } <
        /div>

        <
        div >
            <
            h3 className = "text-xl font-semibold mb-4" > Add Drinks < /h3> <
        div className = "grid grid-cols-2 gap-3" > {
                drinks.map(drink => ( <
                    button key = { drink.id }
                    onClick = {
                        () => onAddDrink(ps.id, drink)
                    }
                    disabled = { drink.stock <= 0 }
                    className = { `p-4 border-2 rounded-lg transition text-left ${
                                                drink.stock <= 0
                                                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                                                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                                            }` } >
                    <
                    p className = "font-semibold" > { drink.name } < /p> <
                    p className = "text-blue-600 font-bold" > { drink.price }
                    EGP < /p> <
                    p className = "text-xs text-gray-500" > Stock: { drink.stock } < /p> < /
                    button >
                ))
            } <
            /div> < /
        div >

            {
                ps.session.drinks.length > 0 && ( <
                    div className = "bg-gray-50 rounded-lg p-4" >
                    <
                    h4 className = "font-semibold mb-3" > Drinks Added < /h4> {
                    ps.session.drinks.map((drink) => ( <
                        div key = { drink.id }
                        className = "flex justify-between items-center mb-2 p-2 bg-white rounded" >
                        <
                        span > { drink.name } < /span> <
                        div className = "flex items-center gap-3" >
                        <
                        span > { drink.price }
                        EGP < /span> <
                        button onClick = {
                            () => onRemoveDrink(ps.id, drink.id, drink.name)
                        }
                        className = "text-red-600 hover:text-red-800 font-bold" >
                        <
                        X size = { 20 }
                        /> < /
                        button > <
                        /div> < /
                        div >
                    ))
                } <
                /div>
            )
    }

    <
    div className = "flex gap-3" >
    <
    button onClick = {
        () => onCancel(ps.id)
    }
    className = "flex-1 bg-gray-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-700 transition" >
    Cancel Session <
    /button> <
    button onClick = {
        () => onStopSession(ps.id)
    }
    className = "flex-1 bg-red-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition" >
    Stop Session <
    /button> < /
    div > <
    /div>
)
}

{
    isStopped && ( <
        div className = "text-center space-y-4" >
        <
        div className = "bg-blue-50 border-2 border-blue-600 rounded-lg p-6" >
        <
        h3 className = "text-xl font-semibold mb-2" > Session Completed < /h3> <
        p className = "text-gray-600" > Ready to generate invoice < /p> < /
        div > <
        button onClick = {
            () => setShowInvoice(true)
        }
        className = "w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition" >
        Generate Invoice <
        /button> < /
        div >
    )
} <
/div> < /
div > <
    /div>
);
};

const InventoryPanel = ({ drinks, inventoryPurchases, onAddPurchase, onDeletePurchase, onClose, lowStockThreshold }) => {
        const [selectedDrink, setSelectedDrink] = useState('');
        const [quantity, setQuantity] = useState('');
        const [costPrice, setCostPrice] = useState('');

        const handleAddPurchase = () => {
            if (selectedDrink && quantity && costPrice) {
                onAddPurchase(parseInt(selectedDrink), quantity, costPrice);
                setSelectedDrink('');
                setQuantity('');
                setCostPrice('');
                alert('Inventory added successfully!');
            }
        };

        return ( <
                div className = "min-h-screen bg-gray-100 p-6" >
                <
                div className = "max-w-6xl mx-auto" >
                <
                div className = "flex justify-between items-center mb-6" >
                <
                h1 className = "text-3xl font-bold text-gray-800" > Inventory Management < /h1> <
                button onClick = { onClose }
                className = "bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition" >
                Close <
                /button> < /
                div >

                <
                div className = "bg-white rounded-lg shadow-lg p-8 mb-6" >
                <
                h2 className = "text-2xl font-bold mb-6" > Add Stock Purchase < /h2> <
                div className = "grid grid-cols-1 md:grid-cols-4 gap-4" >
                <
                div >
                <
                label className = "block text-sm font-semibold mb-2" > Drink < /label> <
                select value = { selectedDrink }
                onChange = {
                    (e) => setSelectedDrink(e.target.value)
                }
                className = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" >
                <
                option value = "" > Select Drink < /option> {
                drinks.map(drink => ( <
                    option key = { drink.id }
                    value = { drink.id } > { drink.name } < /option>
                ))
            } <
            /select> < /
        div > <
            div >
            <
            label className = "block text-sm font-semibold mb-2" > Quantity < /label> <
        input type = "number"
        value = { quantity }
        onChange = {
            (e) => setQuantity(e.target.value)
        }
        placeholder = "24"
        className = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /
            >
            <
            /div> <
        div >
            <
            label className = "block text-sm font-semibold mb-2" > Cost Price per Unit(EGP) < /label> <
        input type = "number"
        step = "0.01"
        value = { costPrice }
        onChange = {
            (e) => setCostPrice(e.target.value)
        }
        placeholder = "14.00"
        className = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /
            >
            <
            /div> <
        div className = "flex items-end" >
            <
            button onClick = { handleAddPurchase }
        className = "w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2" >
            <
            Plus size = { 20 }
        />
        Add Stock <
            /button> < /
        div > <
            /div> < /
        div >

            <
            div className = "bg-white rounded-lg shadow-lg p-8 mb-6" >
            <
            h2 className = "text-2xl font-bold mb-6" > Current Stock Levels < /h2> <
        div className = "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4" > {
                drinks.map(drink => ( <
                    div key = { drink.id }
                    className = { `p-4 rounded-lg border-2 ${
                                    drink.stock === 0 
                                        ? 'border-red-300 bg-red-50' 
                                        : drink.stock <= lowStockThreshold
                                        ? 'border-yellow-300 bg-yellow-50'
                                        : 'border-green-300 bg-green-50'
                                }` } >
                    <
                    div className = "flex items-center gap-2 mb-2" > {
                        drink.stock === 0 && < AlertTriangle size = { 16 }
                        className = "text-red-600" / >
                    } {
                        drink.stock > 0 && drink.stock <= lowStockThreshold && < AlertTriangle size = { 16 }
                        className = "text-yellow-600" / >
                    } <
                    h3 className = "font-bold" > { drink.name } < /h3> < /
                    div > <
                    p className = "text-2xl font-bold text-gray-800 mb-1" > { drink.stock }
                    units < /p> <
                    p className = "text-sm text-gray-600" > Sell: { drink.price }
                    EGP < /p> <
                    p className = "text-sm text-gray-600" > Cost: { drink.costPrice || 0 }
                    EGP < /p> <
                    p className = "text-sm font-semibold text-green-600" >
                    Profit: {
                        (drink.price - (drink.costPrice || 0)).toFixed(2)
                    }
                    EGP / unit <
                    /p> < /
                    div >
                ))
            } <
            /div> < /
        div >

            <
            div className = "bg-white rounded-lg shadow-lg p-8" >
            <
            h2 className = "text-2xl font-bold mb-6" > Purchase History < /h2> {
        inventoryPurchases.length === 0 ? ( <
            p className = "text-gray-500 text-center py-8" > No purchases recorded yet < /p>
        ) : ( <
            div className = "space-y-3" > {
                inventoryPurchases.slice().reverse().map(purchase => ( <
                    div key = { purchase.id }
                    className = "flex justify-between items-center p-4 bg-gray-50 rounded-lg" >
                    <
                    div className = "flex-1" >
                    <
                    h4 className = "font-semibold text-lg" > { purchase.drinkName } < /h4> <
                    p className = "text-sm text-gray-600" > { new Date(purchase.purchaseDate).toLocaleDateString() }
                    at { new Date(purchase.purchaseDate).toLocaleTimeString() } <
                    /p> <
                    p className = "text-sm text-gray-700 mt-1" >
                    Quantity: { purchase.quantity }
                    units× { purchase.costPricePerUnit }
                    EGP = { purchase.totalCost }
                    EGP <
                    /p> < /
                    div > <
                    button onClick = {
                        () => onDeletePurchase(purchase.id)
                    }
                    className = "text-red-600 hover:text-red-800 ml-4" >
                    <
                    Trash2 size = { 20 }
                    /> < /
                    button > <
                    /div>
                ))
            } <
            /div>
        )
    } <
    /div> < /
div > <
    /div>
);
};

const TotalsPage = ({ dailyRevenue, drinksSoldToday, playStations, standaloneDrinkSale, onClose, onReset, onRemoveStandaloneDrink, profitStats, isManager }) => ( <
    div className = "min-h-screen bg-gray-100 p-6" >
    <
    div className = "max-w-6xl mx-auto" >
    <
    div className = "flex justify-between items-center mb-8" >
    <
    h1 className = "text-3xl font-bold text-gray-800" > Daily Revenue & Profit Report < /h1> <
    div className = "flex gap-3" > {
        isManager && ( <
            button onClick = { onReset }
            className = "bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-semibold" >
            Reset All <
            /button>
        )
    } <
    button onClick = { onClose }
    className = "bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition" >
    Close <
    /button> < /
    div > <
    /div>

    <
    div className = "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" >
    <
    div className = "bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-8 text-white shadow-lg" >
    <
    div className = "flex items-center justify-between mb-4" >
    <
    DollarSign size = { 48 }
    className = "opacity-80" / >
    <
    /div> <
    p className = "text-green-100 text-sm mb-2" > PlayStation Revenue < /p> <
    p className = "text-4xl font-bold" > { dailyRevenue.ps.toFixed(2) }
    EGP < /p> < /
    div > <
    div className = "bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-8 text-white shadow-lg" >
    <
    div className = "flex items-center justify-between mb-4" >
    <
    DollarSign size = { 48 }
    className = "opacity-80" / >
    <
    /div> <
    p className = "text-blue-100 text-sm mb-2" > Drinks Revenue < /p> <
    p className = "text-4xl font-bold" > { profitStats.totalRevenue.toFixed(2) }
    EGP < /p> < /
    div > <
    div className = "bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-8 text-white shadow-lg" >
    <
    div className = "flex items-center justify-between mb-4" >
    <
    TrendingUp size = { 48 }
    className = "opacity-80" / >
    <
    /div> <
    p className = "text-orange-100 text-sm mb-2" > Drinks Profit < /p> <
    p className = "text-4xl font-bold" > { profitStats.totalProfit.toFixed(2) }
    EGP < /p> < /
    div > <
    div className = "bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-8 text-white shadow-lg" >
    <
    div className = "flex items-center justify-between mb-4" >
    <
    DollarSign size = { 48 }
    className = "opacity-80" / >
    <
    /div> <
    p className = "text-purple-100 text-sm mb-2" > Total Revenue < /p> <
    p className = "text-4xl font-bold" > {
        (dailyRevenue.ps + profitStats.totalRevenue).toFixed(2)
    }
    EGP < /p> < /
    div > <
    /div>

    {
        isManager && ( <
                div className = "bg-white rounded-lg shadow-lg p-8 mb-6" >
                <
                h2 className = "text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2" >
                <
                TrendingUp className = "text-green-600" / >
                Drinks Profit Breakdown <
                /h2> {
                Object.keys(profitStats.drinkStats).length > 0 ? ( <
                    div className = "space-y-3" > {
                        Object.entries(profitStats.drinkStats).map(([drinkName, stats]) => ( <
                            div key = { drinkName }
                            className = "p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200" >
                            <
                            div className = "flex justify-between items-start mb-2" >
                            <
                            h3 className = "font-bold text-lg" > { drinkName } < /h3> <
                            span className = "text-sm bg-white px-3 py-1 rounded-full font-semibold" >
                            Stock: { stats.stock } <
                            /span> < /
                            div > <
                            div className = "grid grid-cols-2 md:grid-cols-5 gap-3 text-sm" >
                            <
                            div >
                            <
                            p className = "text-gray-600" > Sold < /p> <
                            p className = "font-bold text-gray-800" > { stats.sold }
                            units < /p> < /
                            div > <
                            div >
                            <
                            p className = "text-gray-600" > Revenue < /p> <
                            p className = "font-bold text-blue-600" > { stats.revenue.toFixed(2) }
                            EGP < /p> < /
                            div > <
                            div >
                            <
                            p className = "text-gray-600" > Cost < /p> <
                            p className = "font-bold text-red-600" > { stats.cost.toFixed(2) }
                            EGP < /p> < /
                            div > <
                            div >
                            <
                            p className = "text-gray-600" > Profit / Unit < /p> <
                            p className = "font-bold text-green-600" > { stats.profitPerUnit.toFixed(2) }
                            EGP < /p> < /
                            div > <
                            div >
                            <
                            p className = "text-gray-600" > Total Profit < /p> <
                            p className = "font-bold text-green-700 text-lg" > { stats.profit.toFixed(2) }
                            EGP < /p> < /
                            div > <
                            /div> < /
                            div >
                        ))
                    } <
                    div className = "p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-2 border-purple-300 mt-4" >
                    <
                    div className = "grid grid-cols-3 gap-4 text-center" >
                    <
                    div >
                    <
                    p className = "text-sm text-gray-600 mb-1" > Total Revenue < /p> <
                    p className = "text-2xl font-bold text-blue-600" > { profitStats.totalRevenue.toFixed(2) }
                    EGP < /p> < /
                    div > <
                    div >
                    <
                    p className = "text-sm text-gray-600 mb-1" > Total Cost < /p> <
                    p className = "text-2xl font-bold text-red-600" > { profitStats.totalCost.toFixed(2) }
                    EGP < /p> < /
                    div > <
                    div >
                    <
                    p className = "text-sm text-gray-600 mb-1" > Total Profit < /p> <
                    p className = "text-2xl font-bold text-green-700" > { profitStats.totalProfit.toFixed(2) }
                    EGP < /p> < /
                    div > <
                    /div> < /
                    div > <
                    /div>
                ) : ( <
                    p className = "text-gray-500 text-center py-8" > No drinks sold today < /p>
                )
            } <
            /div>
    )
}

<
div className = "grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" >
    <
    div className = "bg-white rounded-lg shadow-lg p-8" >
    <
    h2 className = "text-2xl font-bold mb-6 text-gray-800" > 🎮PlayStation Usage Today < /h2> <
div className = "space-y-4" > {
        playStations.map(ps => {
            const hours = Math.floor(ps.totalTimeToday);
            const minutes = Math.round((ps.totalTimeToday % 1) * 60);
            return ( <
                div key = { ps.id }
                className = "flex justify-between items-center p-4 bg-blue-50 rounded-lg" >
                <
                span className = "text-lg font-semibold text-gray-700" > { ps.name } < /span> <
                span className = "text-xl font-bold text-blue-600" > { hours }
                h { minutes }
                m < /span> < /
                div >
            );
        })
    } <
    div className = "flex justify-between items-center p-4 bg-purple-50 rounded-lg border-2 border-purple-300 mt-4" >
    <
    span className = "text-lg font-bold text-gray-800" > Total Usage < /span> <
span className = "text-xl font-bold text-purple-600" > { Math.floor(playStations.reduce((sum, ps) => sum + ps.totalTimeToday, 0)) }
h { ' ' } { Math.round((playStations.reduce((sum, ps) => sum + ps.totalTimeToday, 0) % 1) * 60) }
m <
    /span> < /
div > <
    /div> < /
div >

    <
    div className = "bg-white rounded-lg shadow-lg p-8" >
    <
    h2 className = "text-2xl font-bold mb-6 text-gray-800" > Drinks Sold Today < /h2> <
div className = "space-y-4" > {
        Object.keys(drinksSoldToday).length > 0 ? ( <
            >
            {
                Object.entries(drinksSoldToday).map(([drinkName, count]) => ( <
                    div key = { drinkName }
                    className = "flex justify-between items-center p-4 bg-orange-50 rounded-lg" >
                    <
                    span className = "text-lg font-semibold text-gray-700" > { drinkName } < /span> <
                    span className = "text-xl font-bold text-orange-600" > { count } { count === 1 ? 'drink' : 'drinks' } <
                    /span> < /
                    div >
                ))
            } <
            div className = "flex justify-between items-center p-4 bg-pink-50 rounded-lg border-2 border-pink-300 mt-4" >
            <
            span className = "text-lg font-bold text-gray-800" > Total Drinks < /span> <
            span className = "text-xl font-bold text-pink-600" > { Object.values(drinksSoldToday).reduce((sum, count) => sum + count, 0) }
            drinks <
            /span> < /
            div > <
            />
        ) : ( <
            p className = "text-gray-500 text-center py-8" > No drinks sold today < /p>
        )
    } <
    /div> < /
div > <
    /div>

{
    standaloneDrinkSale.length > 0 && ( <
        div className = "bg-white rounded-lg shadow-lg p-8 mb-6" >
        <
        h2 className = "text-2xl font-bold mb-6 text-gray-800" > Recent Standalone Drink Sales < /h2> <
        div className = "space-y-2" > {
            standaloneDrinkSale.slice().reverse().map((sale) => ( <
                div key = { sale.saleId }
                className = "flex justify-between items-center p-3 bg-orange-50 rounded-lg" >
                <
                div >
                <
                span className = "font-semibold" > { sale.name } < /span> <
                span className = "text-sm text-gray-500 ml-3" > { new Date(sale.timestamp).toLocaleTimeString() } <
                /span> < /
                div > <
                div className = "flex items-center gap-3" >
                <
                span className = "font-bold text-orange-600" > { sale.price }
                EGP < /span> <
                button onClick = {
                    () => onRemoveStandaloneDrink(sale.saleId, sale.name, sale.price)
                }
                className = "text-red-600 hover:text-red-800" >
                <
                X size = { 20 }
                /> < /
                button > <
                /div> < /
                div >
            ))
        } <
        /div> < /
        div >
    )
}

<
div className = "bg-white rounded-lg shadow-lg p-8" >
    <
    h2 className = "text-2xl font-bold mb-6" > Revenue Summary < /h2> <
div className = "space-y-4" >
    <
    div className = "flex justify-between items-center p-4 bg-green-50 rounded-lg" >
    <
    span className = "text-lg font-semibold text-gray-700" > PlayStation Sessions < /span> <
span className = "text-2xl font-bold text-green-600" > { dailyRevenue.ps.toFixed(2) }
EGP < /span> < /
div > <
    div className = "flex justify-between items-center p-4 bg-blue-50 rounded-lg" >
    <
    span className = "text-lg font-semibold text-gray-700" > Drinks Sales Revenue < /span> <
span className = "text-2xl font-bold text-blue-600" > { profitStats.totalRevenue.toFixed(2) }
EGP < /span> < /
div > {
        isManager && ( <
            div className = "flex justify-between items-center p-4 bg-orange-50 rounded-lg" >
            <
            span className = "text-lg font-semibold text-gray-700" > Drinks Profit < /span> <
            span className = "text-2xl font-bold text-orange-600" > { profitStats.totalProfit.toFixed(2) }
            EGP < /span> < /
            div >
        )
    } <
    div className = "flex justify-between items-center p-4 bg-purple-50 rounded-lg border-2 border-purple-300" >
    <
    span className = "text-xl font-bold text-gray-800" > Total Daily Revenue < /span> <
span className = "text-3xl font-bold text-purple-600" > {
    (dailyRevenue.ps + profitStats.totalRevenue).toFixed(2)
}
EGP <
    /span> < /
div > <
    /div> <
div className = "mt-6 p-4 bg-gray-50 rounded-lg" >
    <
    p className = "text-sm text-gray-600" > Last Updated: { new Date().toLocaleString() } < /p> {
isManager && ( <
    p className = "text-xs text-gray-500 mt-1" > Click "Reset All"
    button to clear all totals and start fresh < /p>
)
} <
/div> < /
div > <
    /div> < /
div >
);

const SettingsPanel = ({ prices, setPrices, drinks, addDrink, editDrink, deleteDrink, onClose, customAlertSound, onSoundUpload, lowStockThreshold, setLowStockThreshold }) => {
    const [singlePrice, setSinglePrice] = useState(prices.singlePlayer);
    const [multiPrice, setMultiPrice] = useState(prices.multiPlayer);
    const [newDrinkName, setNewDrinkName] = useState('');
    const [newDrinkPrice, setNewDrinkPrice] = useState('');
    const [editingDrink, setEditingDrink] = useState(null);
    const [threshold, setThreshold] = useState(lowStockThreshold);

    const handleSavePrices = () => {
        setPrices({
            singlePlayer: parseFloat(singlePrice),
            multiPlayer: parseFloat(multiPrice)
        });
        alert('Prices updated successfully!');
    };

    const handleAddDrink = () => {
        if (newDrinkName && newDrinkPrice) {
            addDrink(newDrinkName, newDrinkPrice);
            setNewDrinkName('');
            setNewDrinkPrice('');
        }
    };

    const handleSaveThreshold = () => {
        setLowStockThreshold(parseInt(threshold));
        alert('Low stock threshold updated!');
    };

    return ( <
            div className = "min-h-screen bg-gray-100 p-6" >
            <
            div className = "max-w-4xl mx-auto" >
            <
            div className = "flex justify-between items-center mb-6" >
            <
            h1 className = "text-3xl font-bold text-gray-800" > Manager Settings < /h1> <
            button onClick = { onClose }
            className = "bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition" >
            Close <
            /button> < /
            div >

            <
            div className = "bg-white rounded-lg shadow-lg p-8 mb-6" >
            <
            h2 className = "text-2xl font-bold mb-6" > Inventory Settings < /h2> <
            div className = "space-y-4" >
            <
            div >
            <
            label className = "block text-sm font-semibold mb-2" > Low Stock Alert Threshold < /label> <
            div className = "flex gap-3" >
            <
            input type = "number"
            value = { threshold }
            onChange = {
                (e) => setThreshold(e.target.value)
            }
            className = "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /
            >
            <
            button onClick = { handleSaveThreshold }
            className = "bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition" >
            Save <
            /button> < /
            div > <
            p className = "text-xs text-gray-500 mt-2" >
            Alert will show when stock reaches this level or below <
            /p> < /
            div > <
            /div> < /
            div >

            <
            div className = "bg-white rounded-lg shadow-lg p-8 mb-6" >
            <
            h2 className = "text-2xl font-bold mb-6" > Alert Sound < /h2> <
            div className = "space-y-4" >
            <
            div >
            <
            label className = "block text-sm font-semibold mb-2" > Upload Custom Alert Sound < /label> <
            input type = "file"
            accept = "audio/*"
            onChange = { onSoundUpload }
            className = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /
            >
            <
            p className = "text-xs text-gray-500 mt-2" >
            Upload an audio file(MP3, WAV, etc.) to use as the timer alert sound <
            /p> {
            customAlertSound && ( <
                p className = "text-sm text-green-600 mt-2" > ✓Custom sound uploaded < /p>
            )
        } <
        /div> < /
    div > <
        /div>

    <
    div className = "bg-white rounded-lg shadow-lg p-8 mb-6" >
        <
        h2 className = "text-2xl font-bold mb-6" > PlayStation Prices < /h2> <
    div className = "grid grid-cols-2 gap-6" >
        <
        div >
        <
        label className = "block text-sm font-semibold mb-2" > Single Player(EGP / hour) < /label> <
    input type = "number"
    value = { singlePrice }
    onChange = {
        (e) => setSinglePrice(e.target.value)
    }
    className = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /
        >
        <
        /div> <
    div >
        <
        label className = "block text-sm font-semibold mb-2" > Multiplayer(EGP / hour) < /label> <
    input type = "number"
    value = { multiPrice }
    onChange = {
        (e) => setMultiPrice(e.target.value)
    }
    className = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /
        >
        <
        /div> < /
    div > <
        button onClick = { handleSavePrices }
    className = "mt-6 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition" >
        Save Prices <
        /button> < /
    div >

        <
        div className = "bg-white rounded-lg shadow-lg p-8" >
        <
        h2 className = "text-2xl font-bold mb-6" > Drinks Management < /h2>

    <
    div className = "mb-8" >
        <
        h3 className = "text-lg font-semibold mb-4" > Add New Drink < /h3> <
    div className = "flex gap-3" >
        <
        input type = "text"
    placeholder = "Drink Name"
    value = { newDrinkName }
    onChange = {
        (e) => setNewDrinkName(e.target.value)
    }
    className = "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /
        >
        <
        input type = "number"
    placeholder = "Selling Price"
    value = { newDrinkPrice }
    onChange = {
        (e) => setNewDrinkPrice(e.target.value)
    }
    className = "w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /
        >
        <
        button onClick = { handleAddDrink }
    className = "bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2" >
        <
        Plus size = { 20 }
    />
    Add <
        /button> < /
    div > <
        /div>

    <
    div >
        <
        h3 className = "text-lg font-semibold mb-4" > Drinks List < /h3> <
    div className = "space-y-3" > {
            drinks.map(drink => ( <
                div key = { drink.id }
                className = "flex items-center gap-3 p-4 bg-gray-50 rounded-lg" > {
                    editingDrink && editingDrink.id === drink.id ? ( <
                        >
                        <
                        input type = "text"
                        value = { editingDrink.name }
                        onChange = {
                            (e) => setEditingDrink({...editingDrink, name: e.target.value })
                        }
                        className = "flex-1 px-3 py-2 border border-gray-300 rounded-lg" /
                        >
                        <
                        input type = "number"
                        value = { editingDrink.price }
                        onChange = {
                            (e) => setEditingDrink({...editingDrink, price: e.target.value })
                        }
                        className = "w-24 px-3 py-2 border border-gray-300 rounded-lg" /
                        >
                        <
                        button onClick = {
                            () => {
                                editDrink(editingDrink.id, editingDrink.name, editingDrink.price);
                                setEditingDrink(null);
                            }
                        }
                        className = "bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" >
                        Save <
                        /button> <
                        button onClick = {
                            () => setEditingDrink(null)
                        }
                        className = "bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700" >
                        Cancel <
                        /button> < / >
                    ) : ( <
                        >
                        <
                        span className = "flex-1 font-semibold" > { drink.name } < /span> <
                        span className = "font-bold text-blue-600" > { drink.price }
                        EGP < /span> <
                        span className = "text-sm text-gray-500" > Stock: { drink.stock } < /span> <
                        button onClick = {
                            () => setEditingDrink(drink)
                        }
                        className = "text-blue-600 hover:text-blue-700 p-2" >
                        <
                        Edit2 size = { 18 }
                        /> < /
                        button > <
                        button onClick = {
                            () => deleteDrink(drink.id)
                        }
                        className = "text-red-600 hover:text-red-700 p-2" >
                        <
                        Trash2 size = { 18 }
                        /> < /
                        button > <
                        />
                    )
                } <
                /div>
            ))
        } <
        /div> < /
    div > <
        /div> < /
    div > <
        /div>
);
};

export default PSLoungeManager;