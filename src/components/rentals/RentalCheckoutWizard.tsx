import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Minus, Plus, X, Calendar, Clock, Heart, 
    Share2, CreditCard, CheckCircle2, ShoppingBag, MessageSquare, MapPin,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useStore } from '@/context/StoreContext';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import DeliveryMapPicker from './DeliveryMapPicker';

// Types for wizard cart
export interface RentalCartItem {
    id: string; // unique combo of productId + selectedWheelSize
    product: any; // InventoryItem or ComboProduct
    selectedWheelSize?: string;
    quantity: number;
}

interface RentalCheckoutWizardProps {
    selectedProduct: any;
    setSelectedProduct: (product: any) => void;
    cart: RentalCartItem[];
    setCart: React.Dispatch<React.SetStateAction<RentalCartItem[]>>;
    step: number;
    setStep: (step: number) => void;
    onClose: () => void;
    setAuthOpen: (open: boolean) => void;
}

const STORE_ADDRESS = 'Av. Rodriguez Morales (Zona el pueblito)';
const STORE_MAP_URL = 'https://maps.app.goo.gl/WeUipumWSXCMwPqL9';
const WHATSAPP_NUMBER = '59177860277';
const PRICE_TIER_DEFS = [
    { label: '1 Hora', value: '1 hora', accent: false },
    { label: '2 Horas', value: '2 horas', accent: false },
    { label: '3 Horas', value: '3 horas', accent: false },
    { label: '4 Horas', value: '4 horas', accent: true },
    { label: '8 Horas', value: '8 horas', accent: false },
    { label: '24 Horas', value: '24 horas', accent: true },
    { label: '1 Semana', value: '1 semana', accent: true },
    { label: '1 Mes', value: '1 mes', accent: true },
];

function durationToHours(duration: string) {
    const normalized = duration.toLowerCase();
    if (normalized.includes('semana')) return 24 * 7;
    if (normalized.includes('mes')) return 24 * 30;
    const match = normalized.match(/\d+/);
    return match ? Number(match[0]) : 24;
}

function addHoursToTime(time: string, hours: number) {
    const [hour, minute] = time.split(':').map(Number);
    const totalMinutes = (hour * 60) + minute + (hours * 60);
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const nextHour = Math.floor(normalized / 60);
    const nextMinute = normalized % 60;
    return `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`;
}

export default function RentalCheckoutWizard({
    selectedProduct,
    setSelectedProduct,
    cart,
    setCart,
    step,
    setStep,
    onClose,
    setAuthOpen
}: RentalCheckoutWizardProps) {
    const { currentCustomer, addRental, calculatePrice, rentalSettings } = useStore();
    const [loading, setLoading] = useState(false);

    // Step 1 local states
    const [detailWheelSize, setDetailWheelSize] = useState<string>('');
    const [detailQty, setDetailQty] = useState<number>(1);
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

    useEffect(() => {
        setActiveImageIndex(0);
    }, [selectedProduct]);

    const selectedAvailability = useMemo(() => {
        if (!selectedProduct) return 0;
        if (selectedProduct.hasWheelSizes && selectedProduct.wheelSizes) {
            return selectedProduct.wheelSizes.reduce((sum: number, ws: any) => sum + (ws.stock || 0), 0);
        }
        return selectedProduct.comboAvailability ?? selectedProduct.stock ?? 0;
    }, [selectedProduct]);

    const selectedPriceTiers = useMemo(() => {
        if (!selectedProduct) return [];
        return PRICE_TIER_DEFS.map(tier => ({
            ...tier,
            price: calculatePrice(selectedProduct.type || 'single', selectedProduct.id, tier.value, 1)
        })).filter(tier => tier.price > 0);
    }, [selectedProduct, calculatePrice]);

    const isFavorite = selectedProduct ? favoriteIds.includes(selectedProduct.id) : false;

    useEffect(() => {
        if (!currentCustomer || typeof window === 'undefined') {
            setFavoriteIds([]);
            return;
        }

        try {
            const stored = window.localStorage.getItem(`briz_favorites_${currentCustomer.id}`);
            setFavoriteIds(stored ? JSON.parse(stored) : []);
        } catch {
            setFavoriteIds([]);
        }
    }, [currentCustomer?.id]);

    // Initialize wheel size selection if available
    useEffect(() => {
        if (selectedProduct && selectedProduct.hasWheelSizes && selectedProduct.wheelSizes && selectedProduct.wheelSizes.length > 0) {
            // Find first available stock size
            const available = selectedProduct.wheelSizes.find((ws: any) => ws.stock > 0);
            if (available) {
                setDetailWheelSize(available.size);
            } else {
                setDetailWheelSize(selectedProduct.wheelSizes[0].size);
            }
        } else {
            setDetailWheelSize('');
        }
        setDetailQty(1);
    }, [selectedProduct]);

    // Step 3 states (Reservation details)
    const [date, setDate] = useState<string>(() => {
        // Default to tomorrow's date in YYYY-MM-DD format
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [pickupTime, setPickupTime] = useState<string>('15:00');
    const [returnTime, setReturnTime] = useState<string>('19:00');
    const [duration, setDuration] = useState<string>('24 horas');
    const [accessories, setAccessories] = useState({
        casco: 0,
        portacelular: 0,
        luz: 0,
        candado: 0,
        combo: 0
    });
    const [deliveryChecked, setDeliveryChecked] = useState(false);
    const [pickupChecked, setPickupChecked] = useState(false);
    const [deliveryLatLng, setDeliveryLatLng] = useState<{ lat: number; lng: number } | null>(null);
    const [isAddressInZone, setIsAddressInZone] = useState(true);
    const [formattedAddress, setFormattedAddress] = useState('');

    const totalBikes = useMemo(() => {
        return cart.reduce((sum, item) => {
            const isBike = item.product.itemType === 'bike' || item.product.type === 'combo';
            return sum + (isBike ? item.quantity : 0);
        }, 0);
    }, [cart]);

    const calculateShippingFee = (numBikes: number) => {
        if (numBikes <= 0) return 0;
        if (numBikes === 1) return 30;
        if (numBikes === 2) return 45;
        if (numBikes === 3) return 55;
        if (numBikes === 4) return 65;
        return 65 + (numBikes - 4) * 10;
    };

    // Step 4 states (Payment)
    const [discountCode, setDiscountCode] = useState('');
    const [discountApplied, setDiscountApplied] = useState(false);
    const [discountRate, setDiscountRate] = useState(0); // 0.10 for 10%
    const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'qr' | 'cash'>('qr');
    const [reservationCode, setReservationCode] = useState('');
    const [confirmedTotal, setConfirmedTotal] = useState(0);

    // Dynamic computations for subtotals and totals
    const itemsSubtotal = useMemo(() => {
        return cart.reduce((sum, item) => {
            const unitPrice = calculatePrice(item.product.type || 'single', item.product.id, duration, 1);
            return sum + (unitPrice * item.quantity);
        }, 0);
    }, [cart, duration, calculatePrice]);

    const cartHourlyEstimate = useMemo(() => {
        return cart.reduce((sum, item) => {
            const unitPrice = calculatePrice(item.product.type || 'single', item.product.id, '1 hora', 1);
            return sum + (unitPrice * item.quantity);
        }, 0);
    }, [cart, calculatePrice]);

    const accessoriesSubtotal = useMemo(() => {
        const cascoPrice = accessories.casco * 10;
        const portacelularPrice = accessories.portacelular * 10;
        const luzPrice = accessories.luz * 10;
        const candadoPrice = accessories.candado * 10;
        const comboPrice = accessories.combo * 30;
        return cascoPrice + portacelularPrice + luzPrice + candadoPrice + comboPrice;
    }, [accessories]);

    const transportSubtotal = useMemo(() => {
        if ((deliveryChecked || pickupChecked) && !isAddressInZone) {
            return 0;
        }
        const costPerTrip = calculateShippingFee(totalBikes);
        return (deliveryChecked ? costPerTrip : 0) + (pickupChecked ? costPerTrip : 0);
    }, [deliveryChecked, pickupChecked, totalBikes, isAddressInZone]);

    const rawTotal = useMemo(() => {
        return itemsSubtotal + accessoriesSubtotal + transportSubtotal;
    }, [itemsSubtotal, accessoriesSubtotal, transportSubtotal]);

    const finalTotal = useMemo(() => {
        return rawTotal * (1 - discountRate);
    }, [rawTotal, discountRate]);

    const returnDateNote = useMemo(() => {
        const hours = durationToHours(duration);
        if (hours >= 24) return 'La devolución corresponde al día acordado según la duración elegida.';
        const [startHour] = pickupTime.split(':').map(Number);
        return startHour + hours >= 24 ? 'La devolución será al día siguiente.' : '';
    }, [duration, pickupTime]);

    useEffect(() => {
        setReturnTime(addHoursToTime(pickupTime, durationToHours(duration)));
    }, [pickupTime, duration]);

    const amountToShow = step === 5 ? confirmedTotal : finalTotal;
    const proofWhatsappUrl = useMemo(() => {
        const message = [
            'Hola, adjunto comprobante de pago de mi alquiler.',
            `Código: ${reservationCode}`,
            `Nombre: ${currentCustomer?.name || ''}`,
            `WhatsApp: ${currentCustomer?.phone || ''}`,
            `CI: ${currentCustomer?.ci || ''}`,
            `Total: Bs. ${amountToShow.toFixed(2)}`
        ].join('\n');
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    }, [reservationCode, currentCustomer, amountToShow]);

    const addSelectedProductToCart = () => {
        if (!selectedProduct) return false;
        if (selectedAvailability <= 0) {
            alert('Este producto esta agotado.');
            return false;
        }
        const cartItemId = detailWheelSize ? `${selectedProduct.id}-${detailWheelSize}` : selectedProduct.id;
        
        setCart(prev => {
            const existing = prev.find(i => i.id === cartItemId);
            if (existing) {
                return prev.map(i => i.id === cartItemId ? { ...i, quantity: i.quantity + detailQty } : i);
            }
            return [...prev, { 
                id: cartItemId, 
                product: selectedProduct, 
                selectedWheelSize: detailWheelSize || undefined, 
                quantity: detailQty 
            }];
        });
        return true;
    };

    // Step handlers
    const handleAddToCart = () => {
        if (!addSelectedProductToCart()) return;
        alert(`¡${selectedProduct.name} añadido al carrito!`);
        setSelectedProduct(null);
        onClose();
    };

    const handleContinueStep1 = () => {
        if (!addSelectedProductToCart()) return;
        setStep(2);
    };

    const handleToggleFavorite = () => {
        if (!selectedProduct) return;
        if (!currentCustomer) {
            setAuthOpen(true);
            return;
        }

        setFavoriteIds(prev => {
            const next = prev.includes(selectedProduct.id)
                ? prev.filter(id => id !== selectedProduct.id)
                : [...prev, selectedProduct.id];
            try {
                window.localStorage.setItem(`briz_favorites_${currentCustomer.id}`, JSON.stringify(next));
            } catch {
                // Favorites are a convenience until a persisted customer list is added.
            }
            return next;
        });
    };

    const handleShareSelectedProduct = async () => {
        if (!selectedProduct) return;

        const shareData = {
            title: `${selectedProduct.name} | Briz`,
            text: `Mira este alquiler en Briz: ${selectedProduct.name}`,
            url: window.location.href,
        };

        try {
            if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
                await navigator.share(shareData);
                return;
            }

            await navigator.clipboard.writeText(shareData.url);
            alert('Enlace de alquiler copiado al portapapeles.');
        } catch (error) {
            if ((error as DOMException)?.name === 'AbortError') return;

            try {
                await navigator.clipboard.writeText(shareData.url);
                alert('Enlace de alquiler copiado al portapapeles.');
            } catch {
                alert('No se pudo compartir el enlace en este dispositivo.');
            }
        }
    };

    const handleRemoveCartItem = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handleUpdateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const handleApplyDiscount = () => {
        const code = discountCode.trim().toUpperCase();
        if (code === 'BRIZ10' || code === 'DESCUENTO') {
            setDiscountRate(0.10);
            setDiscountApplied(true);
            alert("¡Código de descuento aplicado! Recibes 10% de descuento en tu total.");
        } else {
            alert("Código de descuento no válido.");
        }
    };

    const handleAlquilarAhora = () => {
        if (cart.length === 0) {
            alert("Tu carrito está vacío. Agrega una bicicleta para continuar.");
            setStep(1);
            return;
        }

        if (deliveryChecked || pickupChecked) {
            if (!formattedAddress.trim() || !deliveryLatLng) {
                alert("Por favor busca tu dirección y marca tu ubicación exacta en el mapa.");
                return;
            }
        }

        if (!currentCustomer) {
            // Trigger authentication modal
            setAuthOpen(true);
            return;
        }

        // Proceed to payment selection
        setStep(4);
    };

    // Auto-advance if authenticated during step 3
    useEffect(() => {
        if (step === 3 && currentCustomer) {
            // User was on step 3 and successfully logged in, don't automatically jump unless they click again, 
            // or automatically advance to payment. Autopulse makes it smoother!
            setStep(4);
        }
    }, [currentCustomer]);

    const handleFinalizeOrder = async () => {
        if (!currentCustomer) {
            setAuthOpen(true);
            return;
        }
        if (cart.length === 0) {
            alert("No hay productos en tu carrito.");
            return;
        }

        setLoading(true);
        try {
            // Generate link from lat/lng
            const generatedMapsLink = deliveryLatLng 
                ? `https://www.google.com/maps/?q=${deliveryLatLng.lat},${deliveryLatLng.lng}`
                : '';

            // Build the database payloads
            const rentalPayloads: any[] = [];

            // 1. Bikes in the cart
            cart.forEach(item => {
                const unitPrice = calculatePrice(item.product.type || 'single', item.product.id, duration, 1);
                rentalPayloads.push({
                    customerName: currentCustomer.name,
                    customerPhone: currentCustomer.phone,
                    customerCI: currentCustomer.ci,
                    productType: item.product.type || 'single',
                    productId: item.product.id,
                    productName: item.product.name,
                    productNameSnapshot: item.product.name,
                    selectedWheelSize: item.selectedWheelSize || '',
                    quantity: item.quantity,
                    duration: duration,
                    date: date,
                    pickupTime: pickupTime,
                    total: unitPrice * item.quantity,
                    paymentMethod: paymentMethod === 'qr' ? 'QR' : paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo',
                    notes: `Bicicleta alquilada. ${deliveryChecked ? 'Servicio de entrega.' : ''} ${pickupChecked ? 'Servicio de recojo.' : ''}${formattedAddress ? ` Dirección: ${formattedAddress}` : ''}`,
                    mapsLink: generatedMapsLink,
                    deliveryService: deliveryChecked,
                    pickupService: pickupChecked
                });
            });

            // 2. Selected accessories as separate rental documents
            if (accessories.casco > 0) {
                rentalPayloads.push({
                    customerName: currentCustomer.name,
                    customerPhone: currentCustomer.phone,
                    customerCI: currentCustomer.ci,
                    productType: 'single',
                    productId: 'acc_casco',
                    productName: 'Alquiler de Casco',
                    productNameSnapshot: 'Alquiler de Casco',
                    selectedWheelSize: '',
                    quantity: accessories.casco,
                    duration: duration,
                    date: date,
                    pickupTime: pickupTime,
                    total: 10 * accessories.casco,
                    paymentMethod: paymentMethod === 'qr' ? 'QR' : paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo',
                    notes: 'Accesorio de alquiler',
                    mapsLink: generatedMapsLink,
                    deliveryService: deliveryChecked,
                    pickupService: pickupChecked
                });
            }

            if (accessories.portacelular > 0) {
                rentalPayloads.push({
                    customerName: currentCustomer.name,
                    customerPhone: currentCustomer.phone,
                    customerCI: currentCustomer.ci,
                    productType: 'single',
                    productId: 'acc_portacelular',
                    productName: 'Alquiler de Portacelular',
                    productNameSnapshot: 'Alquiler de Portacelular',
                    selectedWheelSize: '',
                    quantity: accessories.portacelular,
                    duration: duration,
                    date: date,
                    pickupTime: pickupTime,
                    total: 10 * accessories.portacelular,
                    paymentMethod: paymentMethod === 'qr' ? 'QR' : paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo',
                    notes: 'Accesorio de alquiler',
                    mapsLink: generatedMapsLink,
                    deliveryService: deliveryChecked,
                    pickupService: pickupChecked
                });
            }

            if (accessories.luz > 0) {
                rentalPayloads.push({
                    customerName: currentCustomer.name,
                    customerPhone: currentCustomer.phone,
                    customerCI: currentCustomer.ci,
                    productType: 'single',
                    productId: 'acc_luz',
                    productName: 'Alquiler de luz delantera con bocina',
                    productNameSnapshot: 'Alquiler de luz delantera con bocina',
                    selectedWheelSize: '',
                    quantity: accessories.luz,
                    duration: duration,
                    date: date,
                    pickupTime: pickupTime,
                    total: 10 * accessories.luz,
                    paymentMethod: paymentMethod === 'qr' ? 'QR' : paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo',
                    notes: 'Accesorio de alquiler',
                    mapsLink: generatedMapsLink,
                    deliveryService: deliveryChecked,
                    pickupService: pickupChecked
                });
            }

            if (accessories.candado > 0) {
                rentalPayloads.push({
                    customerName: currentCustomer.name,
                    customerPhone: currentCustomer.phone,
                    customerCI: currentCustomer.ci,
                    productType: 'single',
                    productId: 'acc_candado',
                    productName: 'Alquiler de Candado',
                    productNameSnapshot: 'Alquiler de Candado',
                    selectedWheelSize: '',
                    quantity: accessories.candado,
                    duration: duration,
                    date: date,
                    pickupTime: pickupTime,
                    total: 10 * accessories.candado,
                    paymentMethod: paymentMethod === 'qr' ? 'QR' : paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo',
                    notes: 'Accesorio de alquiler',
                    mapsLink: generatedMapsLink,
                    deliveryService: deliveryChecked,
                    pickupService: pickupChecked
                });
            }

            if (accessories.combo > 0) {
                rentalPayloads.push({
                    customerName: currentCustomer.name,
                    customerPhone: currentCustomer.phone,
                    customerCI: currentCustomer.ci,
                    productType: 'single',
                    productId: 'acc_combo',
                    productName: 'Alquiler de Combo Kit de Seguridad',
                    productNameSnapshot: 'Alquiler de Combo Kit de Seguridad',
                    selectedWheelSize: '',
                    quantity: accessories.combo,
                    duration: duration,
                    date: date,
                    pickupTime: pickupTime,
                    total: 30 * accessories.combo,
                    paymentMethod: paymentMethod === 'qr' ? 'QR' : paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo',
                    notes: 'Combo accesorios de alquiler',
                    mapsLink: generatedMapsLink,
                    deliveryService: deliveryChecked,
                    pickupService: pickupChecked
                });
            }

            // 3. Transportation as separate documents
            if (deliveryChecked) {
                const costPerTrip = isAddressInZone ? calculateShippingFee(totalBikes) : 0;
                rentalPayloads.push({
                    customerName: currentCustomer.name,
                    customerPhone: currentCustomer.phone,
                    customerCI: currentCustomer.ci,
                    productType: 'single',
                    productId: 'srv_delivery',
                    productName: 'Servicio de entrega',
                    productNameSnapshot: 'Servicio de entrega',
                    selectedWheelSize: '',
                    quantity: 1,
                    duration: duration,
                    date: date,
                    pickupTime: pickupTime,
                    total: costPerTrip,
                    paymentMethod: paymentMethod === 'qr' ? 'QR' : paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo',
                    notes: `Transporte de entrega. Dirección: ${formattedAddress} ${!isAddressInZone ? '[Fuera de Cobertura]' : ''}`,
                    mapsLink: generatedMapsLink,
                    deliveryService: true,
                    pickupService: false
                });
            }

            if (pickupChecked) {
                const costPerTrip = isAddressInZone ? calculateShippingFee(totalBikes) : 0;
                rentalPayloads.push({
                    customerName: currentCustomer.name,
                    customerPhone: currentCustomer.phone,
                    customerCI: currentCustomer.ci,
                    productType: 'single',
                    productId: 'srv_pickup',
                    productName: 'Servicio de recojo',
                    productNameSnapshot: 'Servicio de recojo',
                    selectedWheelSize: '',
                    quantity: 1,
                    duration: duration,
                    date: date,
                    pickupTime: pickupTime,
                    total: costPerTrip,
                    paymentMethod: paymentMethod === 'qr' ? 'QR' : paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo',
                    notes: `Transporte de recojo. Dirección: ${formattedAddress} ${!isAddressInZone ? '[Fuera de Cobertura]' : ''}`,
                    mapsLink: generatedMapsLink,
                    deliveryService: false,
                    pickupService: true
                });
            }

            // Write all to database
            // Write first item with context helper to get the generated reservation code
            const firstRental = rentalPayloads[0];
            // Discount calculation adjustments for database totals
            if (discountRate > 0) {
                firstRental.total = firstRental.total * (1 - discountRate);
                firstRental.notes += ` [Descuento aplicado: ${discountRate * 100}%]`;
            }
            setConfirmedTotal(finalTotal);
            const createdFirst = await addRental(firstRental);
            const sharedCode = createdFirst.reservationCode;

            // Write remaining items directly in Firestore sharing the same reservation code
            for (let i = 1; i < rentalPayloads.length; i++) {
                const item = rentalPayloads[i];
                if (discountRate > 0) {
                    item.total = item.total * (1 - discountRate);
                    item.notes += ` [Descuento aplicado: ${discountRate * 100}%]`;
                }
                const newId = 'rental_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
                const fullItem = {
                    ...item,
                    id: newId,
                    reservationCode: sharedCode,
                    paymentStatus: paymentMethod === 'qr' || paymentMethod === 'transfer' ? 'pending_review' : 'unpaid',
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    createdDate: new Date().toISOString()
                };
                
                await setDoc(doc(db, 'rentals', newId), fullItem);
            }

            // Success state transitions
            setReservationCode(sharedCode);
            setStep(5);
            setCart([]);
        } catch (err) {
            console.error(err);
            alert("No se pudo completar el pedido de reserva. Intente de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Back navigation (except Step 5) */}
            {step < 5 && (
                <div className="flex justify-between items-center pb-2 border-b border-brand-charcoal/5">
                    <button 
                        onClick={() => {
                            if (step === 1) {
                                setSelectedProduct(null);
                            } else {
                                setStep(step - 1);
                            }
                        }} 
                        className="flex items-center gap-2 text-brand-charcoal/60 hover:text-brand-charcoal text-xs font-black uppercase tracking-wider font-maiandra cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> {step === 1 ? 'Volver a Alquileres' : `Volver al Paso ${step - 1}`}
                    </button>
                    <span className="text-[10px] font-black text-brand-charcoal/40 font-maiandra uppercase">
                        Paso {step} de 4
                    </span>
                </div>
            )}

            <AnimatePresence mode="wait">
                {/* STEP 1: ITEM SPECIFICATIONS */}
                {step === 1 && selectedProduct && (
                    <motion.div 
                        key="step1" 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-6"
                    >
                        {/* Title & Badge */}
                        <div className="flex justify-between items-center">
                            <h2 className="font-tangkiwood text-2xl sm:text-3xl text-brand-black leading-none">{selectedProduct.name}</h2>
                            <span className="bg-brand-yellow text-brand-black border-0 text-[10px] font-black uppercase rounded-lg px-2.5 py-1 font-sans">
                                {selectedProduct.type === 'combo' ? 'Combo' : selectedProduct.itemType === 'bike' ? 'Bicicleta' : 'Accesorio'}
                            </span>
                        </div>

                        {/* Product Image Gallery Carousel */}
                        {(() => {
                            const productImages = [
                                selectedProduct.imageUrl,
                                ...(selectedProduct.additionalImageUrls || [])
                            ].filter(Boolean);
                            const hasMultipleImages = productImages.length > 1;

                            return (
                                <div className="relative aspect-[4/3] bg-white border border-gray-100 rounded-[2.2rem] overflow-hidden shadow-md flex flex-col items-center justify-center group/carousel">
                                    {/* Main Active Image */}
                                    <img 
                                        src={productImages[activeImageIndex] || '/placeholder_bike.png'} 
                                        alt={selectedProduct.name} 
                                        className="w-full h-full object-contain p-4 transition-all duration-300" 
                                    />

                                    {/* Left/Right Controls */}
                                    {hasMultipleImages && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveImageIndex(prev => (prev === 0 ? productImages.length - 1 : prev - 1));
                                                }}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-brand-black shadow-md flex items-center justify-center border border-gray-100 cursor-pointer opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 z-10"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveImageIndex(prev => (prev === productImages.length - 1 ? 0 : prev + 1));
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-brand-black shadow-md flex items-center justify-center border border-gray-100 cursor-pointer opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 z-10"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>

                                            {/* Dot Indicators */}
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                                {productImages.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setActiveImageIndex(idx)}
                                                        className={`w-2 h-2 rounded-full transition-all ${idx === activeImageIndex ? 'bg-brand-yellow w-4' : 'bg-gray-300'}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* Actions Overlays */}
                                    <div className="absolute bottom-5 right-5 flex gap-2 z-10">
                                        <button
                                            type="button"
                                            onClick={handleToggleFavorite}
                                            aria-pressed={isFavorite}
                                            title={currentCustomer ? 'Guardar en favoritos' : 'Inicia sesion para guardar favoritos'}
                                            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-brand-black shadow-lg flex items-center justify-center border border-gray-100 cursor-pointer"
                                        >
                                            <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
                                        </button>
                                        <button 
                                            type="button"
                                            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-brand-black shadow-lg flex items-center justify-center border border-gray-100 cursor-pointer"
                                            onClick={handleShareSelectedProduct}
                                        >
                                            <Share2 className="w-5 h-5 text-gray-700" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Description */}
                        <p className="text-xs sm:text-sm font-medium text-brand-black leading-relaxed text-justify font-sans bg-white/50 p-5 rounded-2xl border border-black/5">
                            {selectedProduct.description || 'Alquila tu bicicleta ideal para pasear o entrenar por la ciudad con total comodidad y estilo.'}
                        </p>

                        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                                {selectedPriceTiers.map(tier => (
                                    <button
                                        key={tier.value}
                                        type="button"
                                        onClick={() => setDuration(tier.value)}
                                        className="group text-left rounded-xl border border-transparent p-2 transition-all hover:border-brand-yellow hover:bg-brand-yellow/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
                                    >
                                        <span className={`block font-black leading-none text-xl sm:text-2xl ${tier.accent ? 'text-red-600' : 'text-brand-black'}`}>
                                            Bs. {tier.price}
                                        </span>
                                        <span className={`block font-maiandra text-[10px] font-black uppercase leading-none ${tier.accent ? 'text-red-300' : 'text-gray-300'}`}>
                                            / {tier.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Wheel Sizes Select (if applicable) */}
                        {selectedProduct.hasWheelSizes && selectedProduct.wheelSizes && selectedProduct.wheelSizes.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra">Selecciona Aro</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {selectedProduct.wheelSizes.map((ws: any) => (
                                        <button 
                                            key={ws.size} 
                                            type="button" 
                                            disabled={ws.stock <= 0} 
                                            onClick={() => setDetailWheelSize(ws.size)}
                                            className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                                                ws.stock <= 0 
                                                    ? 'opacity-30 cursor-not-allowed border-gray-200 bg-gray-50' 
                                                    : detailWheelSize === ws.size 
                                                        ? 'bg-brand-yellow border-brand-charcoal text-brand-black shadow-sm' 
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            Aro {ws.size}{ws.stock <= 0 ? ' - Agotado' : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity Selector */}
                        <div className="space-y-2">
                            <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra">Cantidad</Label>
                            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-1.5 w-32 shadow-sm">
                                <button type="button" onClick={() => setDetailQty(Math.max(1, detailQty - 1))} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                                <span className="flex-1 text-center font-black text-sm text-brand-black font-sans">{detailQty}</span>
                                <button type="button" onClick={() => setDetailQty(detailQty + 1)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>

                        {/* Step 1 Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                            <Button 
                                onClick={handleAddToCart}
                                disabled={selectedAvailability <= 0}
                                className="w-full bg-white border-2 border-brand-yellow hover:bg-brand-yellow/10 text-brand-black font-black rounded-2xl h-14 uppercase text-xs tracking-widest font-sans cursor-pointer"
                            >
                                <ShoppingBag className="w-4 h-4 mr-2" /> Añadir al Carrito
                            </Button>
                            <Button 
                                onClick={handleContinueStep1}
                                disabled={selectedAvailability <= 0}
                                className="w-full bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-2xl h-14 uppercase text-xs tracking-widest font-sans cursor-pointer shadow-md shadow-brand-yellow/10"
                            >
                                {selectedAvailability <= 0 ? 'Agotado' : 'Continuar'}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: CART DETAILS */}
                {step === 2 && (
                    <motion.div 
                        key="step2" 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-6"
                    >
                        <h2 className="font-tan text-2xl text-brand-black uppercase">Detalles del Carrito</h2>
                        
                        {cart.length === 0 ? (
                            <div className="text-center py-10 bg-white/40 border border-brand-charcoal/5 rounded-[2rem] p-6 space-y-3 shadow-inner">
                                <ShoppingBag className="w-10 h-10 text-brand-charcoal/20 mx-auto" />
                                <p className="font-bold text-brand-charcoal/60 text-xs font-maiandra uppercase">Tu carrito de alquiler está vacío</p>
                                <Button 
                                    onClick={() => { setSelectedProduct(null); onClose(); }}
                                    className="bg-brand-yellow text-brand-black font-black rounded-xl h-10 px-6 cursor-pointer"
                                >
                                    Ir a buscar bicicletas
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Items List */}
                                <div className="space-y-3">
                                    {cart.map(item => {
                                        const hourlyPrice = calculatePrice(item.product.type || 'single', item.product.id, '1 hora', 1);
                                        return (
                                            <div 
                                                key={item.id} 
                                                className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 items-center shadow-sm relative group"
                                            >
                                                {/* Product Image */}
                                                <img 
                                                    src={item.product.imageUrl || '/placeholder_bike.png'} 
                                                    alt={item.product.name} 
                                                    className="w-16 h-16 object-contain rounded-xl border border-gray-100 shrink-0" 
                                                />
                                                
                                                {/* Text Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-brand-black text-sm truncate uppercase font-sans">{item.product.name}</h3>
                                                    <p className="font-black text-brand-yellow-vibrant text-xs mt-1 font-sans">
                                                        Bs. {hourlyPrice} / 1 hora
                                                    </p>
                                                    <p className="text-[10px] text-brand-black/40 font-bold uppercase font-maiandra mt-0.5">
                                                        {item.selectedWheelSize ? `Aro ${item.selectedWheelSize} - ` : ''}{item.quantity} unidad{item.quantity > 1 ? 'es' : ''}
                                                    </p>
                                                </div>

                                                {/* Qty +/- Controls */}
                                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-150 rounded-lg p-1 shrink-0 scale-95">
                                                    <button type="button" onClick={() => handleUpdateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"><Minus className="w-2.5 h-2.5" /></button>
                                                    <span className="w-6 text-center font-bold text-xs text-brand-black font-sans">{item.quantity}</span>
                                                    <button type="button" onClick={() => handleUpdateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"><Plus className="w-2.5 h-2.5" /></button>
                                                </div>

                                                {/* Remove Button */}
                                                <button 
                                                    onClick={() => handleRemoveCartItem(item.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer shrink-0"
                                                    aria-label="Eliminar ítem"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-black/45 font-maiandra">
                                                Total estimado del carrito
                                            </p>
                                            <p className="text-xs font-bold text-brand-black/55 font-sans">
                                                Para comparar rapido antes de elegir fecha y duracion.
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-2xl font-black leading-none text-brand-black">Bs. {cartHourlyEstimate}</p>
                                            <p className="text-[10px] font-black uppercase leading-none text-brand-black/35 font-maiandra">/ 1 hora</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-3 pt-4">
                                    <Button 
                                        onClick={() => { setSelectedProduct(null); }}
                                        className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-brand-charcoal font-black rounded-2xl h-12 uppercase text-xs tracking-widest font-sans cursor-pointer"
                                    >
                                        + Añadir más bicicletas
                                    </Button>
                                    <Button 
                                        onClick={() => setStep(3)}
                                        className="w-full bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-2xl h-14 uppercase text-xs tracking-widest font-sans cursor-pointer shadow-md shadow-brand-yellow/10"
                                    >
                                        Continuar con la Reserva
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* STEP 3: RESERVATION SPECIFICATIONS */}
                {step === 3 && (
                    <motion.div 
                        key="step3" 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-6"
                    >
                        <h2 className="font-tan text-2xl text-brand-black uppercase">Termina el Registro de tu Alquiler</h2>

                        {/* Calendar Dates & Hours Pickers */}
                        <div className="bg-white border border-gray-150 p-5 rounded-3xl space-y-4 shadow-sm">
                            <div className="space-y-2">
                                <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-brand-yellow-vibrant" /> Fecha de Requerimiento</Label>
                                <Input 
                                    type="date" 
                                    required 
                                    value={date} 
                                    onChange={e => setDate(e.target.value)}
                                    className="bg-gray-50 border-gray-200 text-brand-black font-bold h-12 rounded-xl focus-visible:ring-brand-yellow" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-brand-yellow-vibrant" /> Hora Adquisición</Label>
                                    <select 
                                        value={pickupTime} 
                                        onChange={e => setPickupTime(e.target.value)} 
                                        className="w-full px-4 bg-gray-50 border border-gray-200 h-12 text-sm text-brand-black font-bold rounded-xl focus:border-brand-yellow focus:outline-none font-sans"
                                    >
                                        {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-brand-yellow-vibrant" /> Hora Devolución</Label>
                                    <Input
                                        readOnly
                                        value={returnTime} 
                                        className="w-full px-4 bg-gray-50 border border-gray-200 h-12 text-sm text-brand-black font-bold rounded-xl focus:border-brand-yellow focus:outline-none font-sans"
                                    />
                                </div>
                            </div>
                            {returnDateNote && (
                                <p className="text-[10px] text-brand-black/45 font-bold uppercase font-maiandra leading-relaxed">
                                    {returnDateNote}
                                </p>
                            )}
                        </div>

                        {/* Duration Selector Rate */}
                        <div className="space-y-2">
                            <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra">Selecciona la Duración de tu Reserva</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {[
                                    { label: '1 Hora', value: '1 hora' },
                                    { label: '2 Horas', value: '2 horas' },
                                    { label: '3 Horas', value: '3 horas' },
                                    { label: '4 Horas', value: '4 horas' },
                                    { label: '8 Horas', value: '8 horas' },
                                    { label: '24 Horas', value: '24 horas' },
                                    { label: '1 Semana', value: '1 semana' },
                                    { label: '1 Mes', value: '1 mes' }
                                ].map(tier => {
                                    const isSelected = duration === tier.value;
                                    return (
                                        <button 
                                            key={tier.value} 
                                            type="button" 
                                            onClick={() => setDuration(tier.value)}
                                            className={`p-3 text-center border rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-brand-yellow border-brand-charcoal text-brand-black shadow-md scale-[1.01]' 
                                                    : 'bg-white border-gray-150 text-brand-black hover:border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="text-xs font-black uppercase font-maiandra tracking-tight">{tier.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Accessory selections */}
                        <div className="space-y-3 bg-white border border-gray-150 p-5 rounded-3xl shadow-sm">
                            <Label className="text-[13.5px] sm:text-sm text-brand-charcoal font-black uppercase tracking-widest font-tangkiwood block border-b border-gray-100 pb-2 mb-2">
                                ¿Quieres agregar algún accesorio adicional?
                            </Label>
                            
                            <div className="space-y-3">
                                {[
                                    { key: 'casco', label: 'Casco de seguridad', price: '10 Bs.', icon: '🪖' },
                                    { key: 'portacelular', label: 'Soporte portacelular', price: '10 Bs.', icon: '📱' },
                                    { key: 'luz', label: 'Luz delantera y bocina', price: '10 Bs.', icon: '🔦' },
                                    { key: 'candado', label: 'Candado antirrobo', price: '10 Bs.', icon: '🔒' },
                                    { key: 'combo', label: 'Combo "Kit de seguridad" (25% Desc.)', price: '30 Bs.', icon: '🛡️', note: 'Casco + Celular + Luz + Candado' }
                                ].map(acc => (
                                    <div key={acc.key} className="flex justify-between items-center gap-3 py-1.5 border-b border-gray-50 last:border-b-0">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-lg">{acc.icon}</span>
                                            <div>
                                                <p className="font-bold text-brand-black font-sans">{acc.label}</p>
                                                {acc.note && <p className="text-[9px] text-brand-black/40 font-bold uppercase font-maiandra">{acc.note}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs font-bold text-brand-yellow-vibrant font-sans">+{acc.price}</span>
                                            <select 
                                                value={(accessories as any)[acc.key]} 
                                                onChange={e => {
                                                    const val = parseInt(e.target.value, 10);
                                                    setAccessories(prev => ({ ...prev, [acc.key]: val }));
                                                }}
                                                className="bg-gray-50 border border-gray-200 text-xs font-bold h-8 rounded-lg px-2 text-brand-black focus:outline-none"
                                            >
                                                {[0, 1, 2, 3, 4, 5].map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery / Pickup Transportation Checks */}
                        <div className="space-y-3 bg-white border border-gray-150 p-5 rounded-3xl shadow-sm">
                            <Label className="text-[13.5px] sm:text-sm text-brand-charcoal font-black uppercase tracking-widest font-tangkiwood block border-b border-gray-100 pb-2 mb-2">
                                ¿Entrega y recojo a domicilio?
                            </Label>
                            <p className="text-[9px] text-brand-black/40 font-bold uppercase font-maiandra leading-relaxed">
                                Dentro el casco urbano de Cochabamba.
                            </p>
                            <div className="rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 p-3 text-[10px] font-bold uppercase leading-relaxed text-brand-black/60 font-maiandra">
                                Si deseas recoger la bicicleta de nuestras instalaciones, te dejamos el mapa al finalizar el pedido.
                            </div>

                            <div className="grid grid-cols-2 gap-3 py-2">
                                <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200/50 rounded-2xl">
                                    <Checkbox 
                                        id="delivery" 
                                        checked={deliveryChecked} 
                                        onCheckedChange={(v) => setDeliveryChecked(Boolean(v))}
                                        className="border-brand-charcoal/20 data-[state=checked]:bg-brand-yellow data-[state=checked]:border-brand-yellow data-[state=checked]:text-brand-black"
                                    />
                                    <Label htmlFor="delivery" className="text-xs text-brand-charcoal/80 font-bold cursor-pointer font-sans leading-none">
                                        🚚 Servicio de entrega ({isAddressInZone ? `+${calculateShippingFee(totalBikes)}` : '+0'} Bs)
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200/50 rounded-2xl">
                                    <Checkbox 
                                        id="pickup" 
                                        checked={pickupChecked} 
                                        onCheckedChange={(v) => setPickupChecked(Boolean(v))}
                                        className="border-brand-charcoal/20 data-[state=checked]:bg-brand-yellow data-[state=checked]:border-brand-yellow data-[state=checked]:text-brand-black"
                                    />
                                    <Label htmlFor="pickup" className="text-xs text-brand-charcoal/80 font-bold cursor-pointer font-sans leading-none">
                                        🔄 Servicio de recojo ({isAddressInZone ? `+${calculateShippingFee(totalBikes)}` : '+0'} Bs)
                                    </Label>
                                </div>
                            </div>

                            {/* Google Maps interactive picker conditionally shown */}
                            {(deliveryChecked || pickupChecked) && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    className="space-y-3 pt-2"
                                >
                                    <Label className="text-[10px] text-brand-black/60 font-bold uppercase tracking-widest font-maiandra block">
                                        Ingresa tu dirección y marca tu ubicación exacta en el mapa:
                                    </Label>
                                    <DeliveryMapPicker 
                                        onLocationSelected={(addr, latLng, inZone) => {
                                            setFormattedAddress(addr);
                                            setDeliveryLatLng(latLng);
                                            setIsAddressInZone(inZone);
                                        }}
                                        initialAddress={formattedAddress}
                                        initialLatLng={deliveryLatLng}
                                    />
                                    <div className="text-[10px] text-brand-black/50 font-bold uppercase font-maiandra pt-1 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p className="font-extrabold text-brand-black mb-1">Resumen del transporte ({totalBikes} bici{totalBikes > 1 ? 's' : ''}):</p>
                                        {deliveryChecked && (
                                            <p className="flex justify-between border-b border-gray-100/50 py-1">
                                                <span>• Servicio de Entrega:</span>
                                                <span className="font-extrabold text-brand-black">
                                                    {isAddressInZone ? `Bs. ${calculateShippingFee(totalBikes)}` : 'A convenir (Bs. 0)'}
                                                </span>
                                            </p>
                                        )}
                                        {pickupChecked && (
                                            <p className="flex justify-between py-1">
                                                <span>• Servicio de Recojo:</span>
                                                <span className="font-extrabold text-brand-black">
                                                    {isAddressInZone ? `Bs. ${calculateShippingFee(totalBikes)}` : 'A convenir (Bs. 0)'}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* TOTAL BS */}
                        <div className="bg-brand-charcoal text-brand-yellow p-5 rounded-[2.2rem] text-center shadow-lg flex justify-between items-center px-8">
                            <span className="text-[10px] font-black uppercase tracking-widest font-maiandra">Monto Total Estimado:</span>
                            <span className="text-2xl font-black font-sans">Bs. {rawTotal.toFixed(2)}</span>
                        </div>

                        {/* Step 3 Alquilar CTA */}
                        <Button 
                            onClick={handleAlquilarAhora}
                            className="w-full bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-2xl h-14 uppercase text-xs tracking-widest font-sans cursor-pointer shadow-md shadow-brand-yellow/10"
                        >
                            Alquilar ahora
                        </Button>
                    </motion.div>
                )}

                {/* STEP 4: SUMMARY & PAYMENT METHODS */}
                {step === 4 && (
                    <motion.div 
                        key="step4" 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-6"
                    >
                        <h2 className="font-tan text-2xl text-brand-black uppercase">Resumen del Pedido y Pago</h2>

                        {/* Collapsible Order Summary */}
                        <div className="bg-white border border-gray-150 p-5 rounded-3xl space-y-3 shadow-sm">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-xs font-bold text-brand-black font-sans uppercase">Resumen de reserva</span>
                                <span className="text-xs font-black text-brand-charcoal font-sans">
                                    Bs. {finalTotal.toFixed(2)}
                                </span>
                            </div>
                            
                            <div className="space-y-2 text-xs text-brand-charcoal/80 font-medium font-sans">
                                {cart.map(item => {
                                    const price = calculatePrice(item.product.type || 'single', item.product.id, duration, 1);
                                    return (
                                        <div key={item.id} className="flex justify-between">
                                            <span>{item.quantity}x {item.product.name} {item.selectedWheelSize ? `(Aro ${item.selectedWheelSize})` : ''}</span>
                                            <span>Bs. {(price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                                
                                {/* Accessories summary */}
                                {accessories.casco > 0 && <div className="flex justify-between text-brand-charcoal/60"><span>{accessories.casco}x Alquiler de Casco</span><span>Bs. {(10 * accessories.casco).toFixed(2)}</span></div>}
                                {accessories.portacelular > 0 && <div className="flex justify-between text-brand-charcoal/60"><span>{accessories.portacelular}x Alquiler de Portacelular</span><span>Bs. {(10 * accessories.portacelular).toFixed(2)}</span></div>}
                                {accessories.luz > 0 && <div className="flex justify-between text-brand-charcoal/60"><span>{accessories.luz}x Alquiler de Luz y Bocina</span><span>Bs. {(10 * accessories.luz).toFixed(2)}</span></div>}
                                {accessories.candado > 0 && <div className="flex justify-between text-brand-charcoal/60"><span>{accessories.candado}x Alquiler de Candado</span><span>Bs. {(10 * accessories.candado).toFixed(2)}</span></div>}
                                {accessories.combo > 0 && <div className="flex justify-between text-brand-charcoal/60"><span>{accessories.combo}x Combo Kit de Seguridad</span><span>Bs. {(30 * accessories.combo).toFixed(2)}</span></div>}

                                {/* Delivery services summary */}
                                {deliveryChecked && (
                                    <div className="flex justify-between text-brand-charcoal/60">
                                        <span>🚚 Servicio de entrega</span>
                                        <span>
                                            {isAddressInZone 
                                                ? `Bs. ${calculateShippingFee(totalBikes).toFixed(2)}` 
                                                : 'A convenir (Bs. 0.00)'}
                                        </span>
                                    </div>
                                )}
                                {pickupChecked && (
                                    <div className="flex justify-between text-brand-charcoal/60">
                                        <span>🔄 Servicio de recojo</span>
                                        <span>
                                            {isAddressInZone 
                                                ? `Bs. ${calculateShippingFee(totalBikes).toFixed(2)}` 
                                                : 'A convenir (Bs. 0.00)'}
                                        </span>
                                    </div>
                                )}

                                {/* Schedule info */}
                                <div className="pt-2 border-t border-gray-50 flex flex-wrap gap-x-4 text-[10px] text-brand-black/40 font-bold uppercase font-maiandra">
                                    <span>📅 Fecha: {date}</span>
                                    <span>⏱️ Hora: {pickupTime} a {returnTime}</span>
                                    <span>⌛ Duración: {duration}</span>
                                </div>
                            </div>
                        </div>

                        {/* Discount Code Input */}
                        <div className="bg-white border border-gray-150 p-4 rounded-3xl shadow-sm flex gap-2 items-center">
                            <Input 
                                placeholder="Código de descuento" 
                                value={discountCode}
                                onChange={e => setDiscountCode(e.target.value)}
                                disabled={discountApplied}
                                className="bg-gray-50 border-gray-200 text-xs font-bold h-10 rounded-xl focus-visible:ring-brand-yellow flex-1"
                            />
                            <Button 
                                onClick={handleApplyDiscount}
                                disabled={discountApplied || !discountCode.trim()}
                                className="bg-brand-charcoal hover:bg-brand-charcoal/90 text-brand-yellow font-black rounded-xl h-10 text-xs uppercase px-4 cursor-pointer"
                            >
                                Aplicar
                            </Button>
                        </div>

                        {/* Payment Method Selector Accordion */}
                        <div className="space-y-3">
                            <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra">Selecciona Método de Pago</Label>
                            
                            <div className="space-y-2.5">
                                {/* QR CARD */}
                                <div 
                                    onClick={() => setPaymentMethod('qr')}
                                    className={`border rounded-2xl p-4 transition-all cursor-pointer bg-white ${
                                        paymentMethod === 'qr' 
                                            ? 'border-brand-yellow ring-2 ring-brand-yellow/20 shadow-sm' 
                                            : 'border-gray-150 hover:border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'qr' ? 'border-brand-yellow bg-brand-yellow' : 'border-gray-300'}`}>
                                            {paymentMethod === 'qr' && <div className="w-1.5 h-1.5 rounded-full bg-brand-black" />}
                                        </div>
                                        <CreditCard className="w-4 h-4 text-brand-charcoal/60" />
                                        <span className="font-bold text-xs uppercase font-sans text-brand-black">Pago con QR</span>
                                    </div>
                                    {paymentMethod === 'qr' && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }} 
                                            animate={{ opacity: 1, height: 'auto' }} 
                                            className="pt-4 space-y-3 flex flex-col items-center border-t border-gray-100 mt-3"
                                        >
                                            <p className="text-[11px] text-brand-black/60 font-bold text-center uppercase font-maiandra leading-relaxed">
                                                Escanea el siguiente código QR BNB para completar tu pago:
                                            </p>
                                            <img 
                                                src={rentalSettings.qrCodeUrl} 
                                                alt="QR Pago" 
                                                className="w-48 h-auto object-contain rounded-xl border border-gray-100 shadow-sm" 
                                            />
                                            <p className="text-[9px] text-brand-black/40 text-center uppercase font-maiandra leading-relaxed">
                                                *El total a transferir es Bs. {finalTotal.toFixed(2)}.*
                                            </p>
                                        </motion.div>
                                    )}
                                </div>

                                {/* BANK TRANSFER */}
                                <div 
                                    onClick={() => setPaymentMethod('transfer')}
                                    className={`border rounded-2xl p-4 transition-all cursor-pointer bg-white ${
                                        paymentMethod === 'transfer' 
                                            ? 'border-brand-yellow ring-2 ring-brand-yellow/20 shadow-sm' 
                                            : 'border-gray-150 hover:border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'transfer' ? 'border-brand-yellow bg-brand-yellow' : 'border-gray-300'}`}>
                                            {paymentMethod === 'transfer' && <div className="w-1.5 h-1.5 rounded-full bg-brand-black" />}
                                        </div>
                                        <CreditCard className="w-4 h-4 text-brand-charcoal/60" />
                                        <span className="font-bold text-xs uppercase font-sans text-brand-black">Depósito / Transferencia Bancaria</span>
                                    </div>
                                    {paymentMethod === 'transfer' && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }} 
                                            animate={{ opacity: 1, height: 'auto' }} 
                                            className="pt-3 border-t border-gray-100 mt-3 text-xs text-brand-charcoal/80 space-y-2 font-sans"
                                        >
                                            <div className="bg-gray-50 p-3.5 rounded-xl space-y-1.5 border border-gray-100 text-[11px] leading-relaxed">
                                                <p className="font-black text-brand-black uppercase">{rentalSettings.bankName}</p>
                                                <p>Caja de Ahorro Bs: <span className="font-black">{rentalSettings.accountNumber}</span></p>
                                                <p>Titular: <span className="font-black">{rentalSettings.accountOwner}</span></p>
                                                <p>CI: <span className="font-black">{rentalSettings.ownerCI}</span></p>
                                            </div>
                                            <p className="text-[9px] text-brand-black/40 uppercase font-maiandra leading-relaxed">
                                                *Reservamos tu pedido por 24 horas hasta validar la transferencia.*
                                            </p>
                                        </motion.div>
                                    )}
                                </div>

                                {/* CASH (EFECTIVO) */}
                                <div 
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`border rounded-2xl p-4 transition-all cursor-pointer bg-white ${
                                        paymentMethod === 'cash' 
                                            ? 'border-brand-yellow ring-2 ring-brand-yellow/20 shadow-sm' 
                                            : 'border-gray-150 hover:border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'cash' ? 'border-brand-yellow bg-brand-yellow' : 'border-gray-300'}`}>
                                            {paymentMethod === 'cash' && <div className="w-1.5 h-1.5 rounded-full bg-brand-black" />}
                                        </div>
                                        <CreditCard className="w-4 h-4 text-brand-charcoal/60" />
                                        <span className="font-bold text-xs uppercase font-sans text-brand-black">Pago en Efectivo</span>
                                    </div>
                                    {paymentMethod === 'cash' && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }} 
                                            animate={{ opacity: 1, height: 'auto' }} 
                                            className="pt-3 border-t border-gray-100 mt-3 text-[11px] text-brand-black/60 font-bold uppercase font-maiandra leading-relaxed"
                                        >
                                            ✓ Cancela directamente en efectivo al momento de la entrega o retiro de tus bicicletas.
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Finalize order Button */}
                        <Button 
                            onClick={handleFinalizeOrder}
                            disabled={loading}
                            className="w-full bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-2xl h-14 uppercase text-xs tracking-widest font-sans cursor-pointer shadow-md shadow-brand-yellow/10"
                        >
                            {loading ? 'Procesando Reserva...' : 'FINALIZAR EL PEDIDO'}
                        </Button>
                    </motion.div>
                )}

                {/* STEP 5: ORDER CONFIRMATION */}
                {step === 5 && (
                    <motion.div 
                        key="step5" 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        className="space-y-6"
                    >
                        {/* Confirmation Card exactly like user mockup */}
                        <div className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-[2.2rem] p-6 sm:p-8 space-y-6 shadow-sm">
                            <div className="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8 text-brand-yellow-vibrant" strokeWidth={2.5} />
                            </div>

                            {/* Header conditional to Cash method */}
                            <div className="text-center space-y-2">
                                <h2 className="font-tan text-2xl uppercase text-brand-black leading-tight">
                                    {paymentMethod === 'cash' 
                                        ? 'Tu pedido está en estado reservado hasta realizar el pago' 
                                        : 'Tu pedido está confirmado'}
                                </h2>
                                <p className="text-xs font-semibold text-brand-charcoal/70 leading-relaxed font-sans">
                                    Recibirás un correo electrónico cuando tu pedido esté listo para ser entregado.
                                </p>
                            </div>

                            {/* Order details Card */}
                            <div className="bg-white/80 border border-brand-yellow/15 p-5 rounded-2xl space-y-4 text-xs font-sans">
                                <p className="font-black text-brand-black text-sm border-b border-gray-100 pb-1.5">Detalles del pedido</p>
                                
                                <div className="space-y-3.5">
                                    {/* Email */}
                                    <div>
                                        <p className="text-[10px] text-brand-black/40 font-bold uppercase font-maiandra">Información del pedido</p>
                                        <p className="font-bold text-brand-charcoal text-sm mt-0.5">{currentCustomer?.email || 'N/A'}</p>
                                    </div>

                                    {/* Payment Method & Total */}
                                    <div>
                                        <p className="text-[10px] text-brand-black/40 font-bold uppercase font-maiandra">Método de pago</p>
                                        <p className="font-bold text-brand-charcoal text-sm mt-0.5">
                                            {paymentMethod === 'qr' ? 'QR' : paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo'} . BOB {amountToShow.toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Billing Address */}
                                    <div>
                                        <p className="text-[10px] text-brand-black/40 font-bold uppercase font-maiandra">Dirección de facturación</p>
                                        <p className="font-bold text-brand-charcoal/50 text-[11px] italic mt-0.5">No requerida (Consumidor Final)</p>
                                    </div>

                                    {/* Shipping Address */}
                                    {(deliveryChecked || pickupChecked) && (
                                        <div>
                                            <p className="text-[10px] text-brand-black/40 font-bold uppercase font-maiandra">Dirección de envío / recojo</p>
                                            <p className="font-bold text-brand-charcoal text-[11px] mt-0.5 leading-normal">{formattedAddress}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white/80 border border-brand-yellow/15 p-5 rounded-2xl space-y-3 text-xs font-sans">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-brand-yellow-vibrant shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-black text-brand-black text-sm">Mapa de la tienda</p>
                                        <p className="font-bold text-brand-charcoal/70 mt-1">{STORE_ADDRESS}</p>
                                    </div>
                                </div>
                                <a
                                    href={STORE_MAP_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-yellow px-4 py-3 text-xs font-black uppercase tracking-widest text-brand-black hover:bg-brand-yellow-light"
                                >
                                    Abrir mapa de la tienda
                                </a>
                            </div>

                            {(paymentMethod === 'qr' || paymentMethod === 'transfer') && (
                                <div className="bg-white/80 border border-brand-yellow/15 p-5 rounded-2xl space-y-3 text-center">
                                    <p className="text-xs font-bold text-brand-charcoal/70 leading-relaxed font-sans">
                                        Envia el comprobante de pago al numero de WhatsApp para confirmar tu pedido.
                                    </p>
                                    <a
                                        href={proofWhatsappUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-charcoal px-4 py-3 text-xs font-black uppercase tracking-widest text-brand-yellow hover:bg-brand-black"
                                    >
                                        <MessageSquare className="w-4 h-4" /> Enviar comprobante por WhatsApp
                                    </a>
                                </div>
                            )}

                            {/* WhatsApp link support */}
                            <div className="pt-2 text-center border-t border-brand-yellow/10">
                                <a 
                                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola Briz, acabo de realizar una solicitud de alquiler. Código: ${reservationCode}`)}`}
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-xs font-black text-brand-yellow hover:text-brand-yellow-light inline-flex items-center gap-1.5 bg-brand-charcoal px-4 py-2 rounded-xl"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" /> ¿Tienes dudas? Contáctanos por WhatsApp
                                </a>
                            </div>
                        </div>

                        {/* Seguir comprando Button */}
                        <div className="pt-2">
                            <Button 
                                onClick={() => {
                                    setSelectedProduct(null);
                                    setStep(1);
                                    onClose();
                                }}
                                className="w-full bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-2xl h-14 uppercase text-xs tracking-widest font-sans cursor-pointer shadow-md shadow-brand-yellow/10"
                            >
                                SEGUIR COMPRANDO
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
