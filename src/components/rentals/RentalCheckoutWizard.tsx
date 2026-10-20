import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Minus, Plus, X, Calendar, Clock, Heart,
    Share2, CreditCard, CheckCircle2, ShoppingBag, MessageSquare, MapPin,
    ChevronLeft, ChevronRight, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useStore, type InventoryItem } from '@/context/StoreContext';
import { useLanguage } from '@/context/LanguageContext';
import { t, getLocalizedField } from '@/lib/translations';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import DeliveryMapPicker from './DeliveryMapPicker';
import { sendTelegramNotification } from '@/lib/telegram';
import { addDaysToDateString, toBoliviaDateString } from '@/lib/dateUtils';
import { getAccessoryAddonUnitPrice, parseDurationToHours } from '@/lib/rentalPricing';
import { buildComboComponentSelections, getRentalInventoryDemands } from '@/lib/rentalAvailability';

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

// Structural combo accessories (already offered inside combo bikes, excluded from standalone extra addon selector unless admin enables them)
const STRUCTURAL_COMBO_ACCESSORY_IDS = new Set([
    'acc_canasta_metalica',
    'acc_canasta_mimbre',
    'acc_ruedas_auxiliares_adulto',
    'acc_silla_delantera_urbana',
    'acc_silla_delantera_mamachari',
    'acc_silla_mediana_trasera',
    'acc_silla_trasera_grande',
    'acc_set_silla_delantera_canasta_mamachari',
    'acc_ruedas_apoyo_nino_16',
    'acc_canasta_trasera_carga',
]);

// Preferred display order & visual icons for real rental accessories
const ACCESSORY_META: Record<string, { icon: string; badge?: string; order: number; subtitle?: string }> = {
    acc_casco_adulto: { icon: '🪖', badge: 'Adulto', order: 1, subtitle: 'Protección certificada talla adulto' },
    acc_casco_nino: { icon: '🧒', badge: 'Niñ@', order: 2, subtitle: 'Protección ligera talla infantil' },
    acc_portacelular: { icon: '📱', badge: 'GPS / Mapa', order: 3, subtitle: 'Soporte firme para manubrio' },
    acc_linterna_bocina: { icon: '🔦', badge: 'Nocturno', order: 4, subtitle: 'Luz LED delantera con bocina' },
    acc_candado_seguridad: { icon: '🔒', badge: 'Antirrobo', order: 5, subtitle: 'Cable acerado con llave/combinación' },
    acc_chaleco_seguridad: { icon: '🦺', badge: 'Reflectivo', order: 6, subtitle: 'Alta visibilidad diurna y nocturna' },
    acc_remolque_mascotas: { icon: '🐾', badge: 'Mascotas', order: 7, subtitle: 'Remolque aro 20 de aluminio' },
};

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
    setAuthOpen,
}: RentalCheckoutWizardProps) {
    const {
        inventory,
        combos,
        currentCustomer,
        addRental,
        addOrUpdateCustomer,
        calculatePrice,
        rentalSettings,
        getAvailableStockForInterval,
        getComboAvailabilityForInterval
    } = useStore();
    const { language } = useLanguage();
    const [loading, setLoading] = useState(false);

    // Step 1 local states
    const [detailWheelSize, setDetailWheelSize] = useState<string>('');
    const [detailQty, setDetailQty] = useState<number>(1);
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

    useEffect(() => {
        setActiveImageIndex(0);
    }, [selectedProduct]);

    // Step 3 states (Reservation details) — Bolivia timezone safe default (Tomorrow)
    const [date, setDate] = useState<string>(() => addDaysToDateString(toBoliviaDateString(new Date()), 1));
    const [pickupTime, setPickupTime] = useState<string>('15:00');
    const [returnTime, setReturnTime] = useState<string>('15:00');
    const [duration, setDuration] = useState<string>('24 horas');

    // Real inventory accessories map: { [inventoryItemId]: quantity }
    const [selectedAccessories, setSelectedAccessories] = useState<Record<string, number>>({});

    const [deliveryChecked, setDeliveryChecked] = useState(false);
    const [pickupChecked, setPickupChecked] = useState(false);
    const [deliveryLatLng, setDeliveryLatLng] = useState<{ lat: number; lng: number } | null>(null);
    const [isAddressInZone, setIsAddressInZone] = useState(true);
    const [formattedAddress, setFormattedAddress] = useState('');

    // Real-time interval availability for the currently selected product in Step 1
    const selectedWheelSizeOptions = useMemo(() => {
        if (!selectedProduct || !selectedProduct.hasWheelSizes || !selectedProduct.wheelSizes) return [];
        return selectedProduct.wheelSizes.map((ws: { size: string; stock: number }) => {
            const avail = selectedProduct.type === 'combo'
                ? getComboAvailabilityForInterval(selectedProduct.id, ws.size, date, pickupTime, duration)
                : getAvailableStockForInterval(selectedProduct.id, ws.size, date, pickupTime, duration);
            return {
                size: ws.size,
                stock: avail
            };
        });
    }, [selectedProduct, date, pickupTime, duration, getAvailableStockForInterval, getComboAvailabilityForInterval]);

    const selectedAvailability = useMemo(() => {
        if (!selectedProduct) return 0;
        if (selectedProduct.type === 'combo') {
            if (selectedProduct.hasWheelSizes && detailWheelSize) {
                return getComboAvailabilityForInterval(selectedProduct.id, detailWheelSize, date, pickupTime, duration);
            }
            return getComboAvailabilityForInterval(selectedProduct.id, undefined, date, pickupTime, duration);
        }
        if (selectedProduct.hasWheelSizes) {
            if (detailWheelSize) {
                return getAvailableStockForInterval(selectedProduct.id, detailWheelSize, date, pickupTime, duration);
            }
            return selectedWheelSizeOptions.reduce((sum: number, ws: { stock: number }) => sum + (ws.stock || 0), 0);
        }
        return getAvailableStockForInterval(selectedProduct.id, undefined, date, pickupTime, duration);
    }, [
        selectedProduct,
        detailWheelSize,
        date,
        pickupTime,
        duration,
        selectedWheelSizeOptions,
        getAvailableStockForInterval,
        getComboAvailabilityForInterval
    ]);

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

    // Cap detailQty to selectedAvailability when availability changes
    useEffect(() => {
        if (selectedAvailability > 0 && detailQty > selectedAvailability) {
            setDetailQty(selectedAvailability);
        }
    }, [selectedAvailability, detailQty]);

    // Compute how many units of each inventory item are already demanded by bikes/combos in the cart
    const cartComponentDemands = useMemo(() => {
        const map = new Map<string, number>();
        for (const item of cart) {
            const prodType = item.product.type || 'single';
            const demands = getRentalInventoryDemands(
                {
                    productType: prodType,
                    productId: item.product.id,
                    quantity: item.quantity,
                    selectedWheelSize: item.selectedWheelSize,
                },
                inventory,
                combos
            );
            for (const d of demands) {
                const key = d.wheelSize ? `${d.itemId}::${d.wheelSize}` : d.itemId;
                map.set(key, (map.get(key) || 0) + d.quantity);
                map.set(d.itemId, (map.get(d.itemId) || 0) + d.quantity);
            }
        }
        return map;
    }, [cart, inventory, combos]);

    // Build real rental accessories list from inventory
    const availableAddonAccessories = useMemo(() => {
        return inventory
            .filter(item => {
                if (!item.active || item.itemType !== 'accessory') return false;
                if (item.availableForRental === false) return false;
                // Exclude structural combo baskets/seats unless admin explicitly set a rental price > 0 on them
                if (STRUCTURAL_COMBO_ACCESSORY_IDS.has(item.id)) {
                    const hasAdminPrice =
                        (item.price1Hour ?? 0) > 0 ||
                        (item.price24Hours ?? 0) > 0 ||
                        (item.pricePerHour ?? 0) > 0 ||
                        (item.pricePerDay ?? 0) > 0;
                    return hasAdminPrice;
                }
                return true;
            })
            .map(item => {
                const intervalStock = getAvailableStockForInterval(item.id, undefined, date, pickupTime, duration);
                const usedInCartCombos = cartComponentDemands.get(item.id) || 0;
                const remainingStock = Math.max(0, intervalStock - usedInCartCombos);
                const unitPrice = getAccessoryAddonUnitPrice(item, duration);
                const meta = ACCESSORY_META[item.id] || { icon: '🛡️', order: 50 };
                return {
                    item,
                    remainingStock,
                    unitPrice,
                    icon: meta.icon,
                    badge: meta.badge,
                    subtitle: meta.subtitle || item.details || item.description,
                    order: meta.order,
                };
            })
            .sort((a, b) => a.order - b.order || a.item.name.localeCompare(b.item.name));
    }, [inventory, date, pickupTime, duration, getAvailableStockForInterval, cartComponentDemands]);

    // Automatically clamp selected accessory quantities if remainingStock drops (e.g. when changing date/time)
    useEffect(() => {
        setSelectedAccessories(prev => {
            let changed = false;
            const next = { ...prev };
            for (const [accId, qty] of Object.entries(next)) {
                if (qty <= 0) continue;
                const entry = availableAddonAccessories.find(a => a.item.id === accId);
                const maxAllowed = entry ? entry.remainingStock : 0;
                if (qty > maxAllowed) {
                    next[accId] = maxAllowed;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [availableAddonAccessories]);

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

    const selectedAccessoryEntries = useMemo(() => {
        return availableAddonAccessories
            .filter(a => (selectedAccessories[a.item.id] || 0) > 0)
            .map(a => {
                const qty = selectedAccessories[a.item.id] || 0;
                return {
                    ...a,
                    quantity: qty,
                    lineTotal: a.unitPrice * qty,
                };
            });
    }, [availableAddonAccessories, selectedAccessories]);

    const accessoriesSubtotal = useMemo(() => {
        return selectedAccessoryEntries.reduce((sum, entry) => sum + entry.lineTotal, 0);
    }, [selectedAccessoryEntries]);

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
        const hours = parseDurationToHours(duration);
        if (hours >= 24) {
            return language === 'es'
                ? 'La devolución corresponde al día acordado según la duración elegida.'
                : 'Return date corresponds to the agreed day based on your selected duration.';
        }
        const [startHour] = pickupTime.split(':').map(Number);
        return startHour + hours >= 24
            ? (language === 'es' ? 'La devolución será al día siguiente.' : 'Return will be the following day.')
            : '';
    }, [duration, pickupTime, language]);

    useEffect(() => {
        setReturnTime(addHoursToTime(pickupTime, parseDurationToHours(duration)));
    }, [pickupTime, duration]);

    // Validate shared component conflicts across all cart items + selected accessories for the chosen date/time
    const cartAvailabilityConflict = useMemo((): string | null => {
        // Aggregate total demand per inventoryItemId (and wheelSize) across the entire cart + accessories
        const totalDemandByKey = new Map<string, { itemId: string; wheelSize?: string; qty: number; label: string }>();

        for (const cartItem of cart) {
            const pType = cartItem.product.type || 'single';
            const demands = getRentalInventoryDemands(
                {
                    productType: pType,
                    productId: cartItem.product.id,
                    quantity: cartItem.quantity,
                    selectedWheelSize: cartItem.selectedWheelSize,
                },
                inventory,
                combos
            );
            for (const d of demands) {
                const invItem = inventory.find(i => i.id === d.itemId);
                const key = d.wheelSize ? `${d.itemId}::${d.wheelSize}` : d.itemId;
                const existing = totalDemandByKey.get(key);
                totalDemandByKey.set(key, {
                    itemId: d.itemId,
                    wheelSize: d.wheelSize,
                    qty: (existing?.qty || 0) + d.quantity,
                    label: invItem ? `${invItem.name}${d.wheelSize ? ` (Aro ${d.wheelSize})` : ''}` : cartItem.product.name
                });
            }
        }

        for (const accEntry of selectedAccessoryEntries) {
            const key = accEntry.item.id;
            const existing = totalDemandByKey.get(key);
            totalDemandByKey.set(key, {
                itemId: accEntry.item.id,
                qty: (existing?.qty || 0) + accEntry.quantity,
                label: accEntry.item.name
            });
        }

        for (const demand of totalDemandByKey.values()) {
            const available = getAvailableStockForInterval(
                demand.itemId,
                demand.wheelSize,
                date,
                pickupTime,
                duration
            );
            if (demand.qty > available) {
                return language === 'es'
                    ? `Stock insuficiente para ${demand.label} en la fecha y horario seleccionados (disponible: ${available}, solicitado en tu pedido: ${demand.qty}).`
                    : `Insufficient stock for ${demand.label} on the selected date and time (available: ${available}, requested in your order: ${demand.qty}).`;
            }
        }
        return null;
    }, [cart, selectedAccessoryEntries, inventory, combos, date, pickupTime, duration, getAvailableStockForInterval]);

    const amountToShow = step === 5 ? confirmedTotal : finalTotal;
    const proofWhatsappUrl = useMemo(() => {
        const message = language === 'es'
            ? [
                'Hola, adjunto comprobante de pago de mi alquiler.',
                `Código: ${reservationCode}`,
                `Nombre: ${currentCustomer?.name || ''}`,
                `WhatsApp: ${currentCustomer?.phone || ''}`,
                `CI: ${currentCustomer?.ci || ''}`,
                `Total: Bs. ${amountToShow.toFixed(2)}`
            ].join('\n')
            : [
                'Hello, I am attaching the payment receipt for my rental.',
                `Code: ${reservationCode}`,
                `Name: ${currentCustomer?.name || ''}`,
                `WhatsApp: ${currentCustomer?.phone || ''}`,
                `ID: ${currentCustomer?.ci || ''}`,
                `Total: Bs. ${amountToShow.toFixed(2)}`
            ].join('\n');
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    }, [reservationCode, currentCustomer, amountToShow, language]);

    const addSelectedProductToCart = () => {
        if (!selectedProduct) return false;
        if (selectedAvailability <= 0) {
            alert('Este producto está agotado para la fecha u horario seleccionado.');
            return false;
        }
        const cartItemId = detailWheelSize ? `${selectedProduct.id}-${detailWheelSize}` : selectedProduct.id;
        const existingInCart = cart.find(i => i.id === cartItemId)?.quantity || 0;
        if (existingInCart + detailQty > selectedAvailability) {
            alert(`Solo hay ${selectedAvailability} unidad(es) disponible(s) de esta configuración.`);
            return false;
        }

        setCart(prev => {
            const existing = prev.find(i => i.id === cartItemId);
            if (existing) {
                return prev.map(i => i.id === cartItemId ? { ...i, quantity: Math.min(selectedAvailability, i.quantity + detailQty) } : i);
            }
            return [...prev, {
                id: cartItemId,
                product: selectedProduct,
                selectedWheelSize: detailWheelSize || undefined,
                quantity: Math.min(selectedAvailability, detailQty)
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
                // Ignore storage quota errors
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
                const maxAvail = item.product.type === 'combo'
                    ? getComboAvailabilityForInterval(item.product.id, item.selectedWheelSize, date, pickupTime, duration)
                    : getAvailableStockForInterval(item.product.id, item.selectedWheelSize, date, pickupTime, duration);
                const nextQty = Math.max(1, item.quantity + delta);
                if (delta > 0 && nextQty > maxAvail) {
                    alert(`Solo hay ${maxAvail} unidad(es) disponible(s) para este producto.`);
                    return item;
                }
                return { ...item, quantity: nextQty };
            }
            return item;
        }));
    };

    const handleAccessoryDelta = (accItem: InventoryItem, delta: number, maxStock: number) => {
        setSelectedAccessories(prev => {
            const current = prev[accItem.id] || 0;
            const next = Math.max(0, Math.min(maxStock, current + delta));
            return { ...prev, [accItem.id]: next };
        });
    };

    const handleApplyDiscount = () => {
        const code = discountCode.trim().toUpperCase();
        if (code === 'BRIZ10' || code === 'DESCUENTO') {
            setDiscountRate(0.10);
            setDiscountApplied(true);
            alert('¡Código de descuento aplicado! Recibes 10% de descuento en tu total.');
        } else {
            alert('Código de descuento no válido.');
        }
    };

    const handleAlquilarAhora = () => {
        if (cart.length === 0) {
            alert('Tu carrito está vacío. Agrega una bicicleta para continuar.');
            setStep(1);
            return;
        }

        const todayBolivia = toBoliviaDateString(new Date());
        if (date < todayBolivia) {
            alert('La fecha de reserva no puede ser anterior a hoy.');
            return;
        }

        if (cartAvailabilityConflict) {
            alert(cartAvailabilityConflict);
            return;
        }

        if (deliveryChecked || pickupChecked) {
            if (!formattedAddress.trim() || !deliveryLatLng) {
                alert('Por favor busca tu dirección y marca tu ubicación exacta en el mapa.');
                return;
            }
        }

        if (!currentCustomer) {
            setAuthOpen(true);
            return;
        }

        setStep(4);
    };

    // Auto-advance if authenticated during step 3
    useEffect(() => {
        if (step === 3 && currentCustomer && !cartAvailabilityConflict) {
            setStep(4);
        }
    }, [currentCustomer]);

    const handleFinalizeOrder = async () => {
        if (loading) return; // Prevent double submission
        if (!currentCustomer) {
            setAuthOpen(true);
            return;
        }
        if (cart.length === 0) {
            alert('No hay productos en tu carrito.');
            return;
        }
        if (cartAvailabilityConflict) {
            alert(cartAvailabilityConflict);
            return;
        }

        setLoading(true);
        try {
            const generatedMapsLink = deliveryLatLng
                ? `https://www.google.com/maps/?q=${deliveryLatLng.lat},${deliveryLatLng.lng}`
                : '';

            const paymentMethodLabel = paymentMethod === 'qr' ? 'QR' : paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo';
            const rentalPayloads: any[] = [];

            // 1. Bikes & Combos in the cart (including componentSelections for combos!)
            cart.forEach(item => {
                const productType: 'single' | 'combo' = item.product.type || 'single';
                const unitPrice = calculatePrice(productType, item.product.id, duration, 1);

                let componentSelections = undefined;
                if (productType === 'combo') {
                    const comboObj = combos.find(c => c.id === item.product.id);
                    if (comboObj) {
                        componentSelections = buildComboComponentSelections(comboObj, item.selectedWheelSize, inventory);
                    }
                }

                rentalPayloads.push({
                    customerName: currentCustomer.name,
                    customerPhone: currentCustomer.phone,
                    customerCI: currentCustomer.ci,
                    customerEmail: currentCustomer.email,
                    autofotoUrl: currentCustomer.autofotoUrl,
                    documentoUrl: currentCustomer.documentoUrl,
                    documentoReversoUrl: currentCustomer.documentoReversoUrl,
                    productType,
                    productId: item.product.id,
                    productName: item.product.name,
                    productNameSnapshot: item.product.name,
                    selectedWheelSize: item.selectedWheelSize || '',
                    ...(componentSelections ? { componentSelections } : {}),
                    quantity: item.quantity,
                    duration,
                    date,
                    pickupTime,
                    endTime: returnTime,
                    total: unitPrice * item.quantity,
                    paymentMethod: paymentMethodLabel,
                    notes: `Bicicleta alquilada.${deliveryChecked ? ' Servicio de entrega.' : ''}${pickupChecked ? ' Servicio de recojo.' : ''}${formattedAddress ? ` Dirección: ${formattedAddress}` : ''}`,
                    mapsLink: generatedMapsLink,
                    deliveryService: deliveryChecked,
                    pickupService: pickupChecked,
                    source: 'web'
                });
            });

            // 2. Real Inventory Accessories selected in Step 3
            selectedAccessoryEntries.forEach(accEntry => {
                rentalPayloads.push({
                    customerName: currentCustomer.name,
                    customerPhone: currentCustomer.phone,
                    customerCI: currentCustomer.ci,
                    customerEmail: currentCustomer.email,
                    productType: 'single',
                    productId: accEntry.item.id,
                    productName: accEntry.item.name,
                    productNameSnapshot: accEntry.item.name,
                    selectedWheelSize: '',
                    quantity: accEntry.quantity,
                    duration,
                    date,
                    pickupTime,
                    endTime: returnTime,
                    total: accEntry.lineTotal,
                    paymentMethod: paymentMethodLabel,
                    notes: 'Accesorio adicional de alquiler',
                    mapsLink: generatedMapsLink,
                    deliveryService: deliveryChecked,
                    pickupService: pickupChecked,
                    source: 'web'
                });
            });

            // 3. Transportation as separate service items
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
                    duration,
                    date,
                    pickupTime,
                    endTime: returnTime,
                    total: costPerTrip,
                    paymentMethod: paymentMethodLabel,
                    notes: `Transporte de entrega. Dirección: ${formattedAddress} ${!isAddressInZone ? '[Fuera de Cobertura]' : ''}`,
                    mapsLink: generatedMapsLink,
                    deliveryService: true,
                    pickupService: false,
                    source: 'web'
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
                    duration,
                    date,
                    pickupTime,
                    endTime: returnTime,
                    total: costPerTrip,
                    paymentMethod: paymentMethodLabel,
                    notes: `Transporte de recojo. Dirección: ${formattedAddress} ${!isAddressInZone ? '[Fuera de Cobertura]' : ''}`,
                    mapsLink: generatedMapsLink,
                    deliveryService: false,
                    pickupService: true,
                    source: 'web'
                });
            }

            // Apply discount proportionally if a valid code was applied
            if (discountRate > 0) {
                rentalPayloads.forEach((p, idx) => {
                    p.total = Number((p.total * (1 - discountRate)).toFixed(2));
                    if (idx === 0) {
                        p.notes += ` [Descuento aplicado: ${discountRate * 100}%]`;
                    }
                });
            }

            setConfirmedTotal(finalTotal);

            // Write first item via addRental (which generates the transactional BRIZ-YYYY-NNNN code)
            const firstRental = rentalPayloads[0];
            const createdFirst = await addRental(firstRental);
            const sharedCode = createdFirst.reservationCode;

            // Write remaining items sharing the exact same reservationCode
            const nowIso = new Date().toISOString();
            for (let i = 1; i < rentalPayloads.length; i++) {
                const item = rentalPayloads[i];
                const newId = `rental_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`;
                const fullItem: Record<string, any> = {
                    ...item,
                    id: newId,
                    reservationCode: sharedCode,
                    paymentStatus: paymentMethod === 'qr' || paymentMethod === 'transfer' ? 'pending_review' : 'unpaid',
                    status: 'pending',
                    createdAt: nowIso,
                    updatedAt: nowIso,
                    createdDate: nowIso
                };
                Object.keys(fullItem).forEach(k => {
                    if (fullItem[k] === undefined) delete fullItem[k];
                });
                await setDoc(doc(db, 'rentals', newId), fullItem);
            }

            // Update customer rental counter
            await addOrUpdateCustomer(
                { name: currentCustomer.name, phone: currentCustomer.phone, ci: currentCustomer.ci },
                false
            ).catch(() => undefined);

            // Send Telegram Notification
            try {
                const firstItem = rentalPayloads[0];
                const mapsLinkValue = firstItem?.mapsLink || rentalPayloads.find(p => p.mapsLink)?.mapsLink;
                await sendTelegramNotification(
                    sharedCode,
                    rentalPayloads,
                    finalTotal,
                    currentCustomer,
                    paymentMethodLabel,
                    date,
                    pickupTime,
                    duration,
                    mapsLinkValue
                );
            } catch (telegramErr) {
                console.error('Failed to send Telegram notification:', telegramErr);
            }

            // Transition to confirmation screen & clear cart/accessories
            setReservationCode(sharedCode);
            setStep(5);
            setCart([]);
            setSelectedAccessories({});
        } catch (err) {
            console.error(err);
            alert('No se pudo completar el pedido de reserva. Intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Back navigation (except Step 5) */}
            {step < 5 && (
                <>
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
                            <ArrowLeft className="w-4 h-4" /> {step === 1 ? (language === 'es' ? 'Volver a Alquileres' : 'Back to Rentals') : (language === 'es' ? `Volver al Paso ${step - 1}` : `Back to Step ${step - 1}`)}
                        </button>
                        <span className="text-[10px] font-black text-brand-charcoal/40 font-maiandra uppercase">
                            {language === 'es' ? `Paso ${step} de 4` : `Step ${step} of 4`}
                        </span>
                    </div>

                    {/* Notice about modifying order via WhatsApp */}
                    <div className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-2xl p-4 text-[11px] font-semibold text-brand-charcoal/80 leading-relaxed font-sans flex items-start gap-2.5 shadow-sm">
                        <span className="text-sm">💡</span>
                        <p>
                            {language === 'es' ? (
                                <><strong>¿Tienes dudas o no estás seguro?</strong> Completa tu pedido con tranquilidad. Al finalizar, podrás comunicarte con nosotros por WhatsApp para corregir o modificar cualquier detalle de tu reserva (fechas, horas, bicicletas o accesorios).</>
                            ) : (
                                <><strong>Have questions or not sure yet?</strong> Complete your booking with peace of mind. Once finished, you can message us on WhatsApp to adjust any detail of your reservation (dates, times, bikes, or accessories).</>
                            )}
                        </p>
                    </div>
                </>
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
                        <div className="flex justify-between items-center gap-2">
                            <h2 className="font-tangkiwood text-2xl sm:text-3xl text-brand-black leading-none">{getLocalizedField(selectedProduct.name, selectedProduct.nameEn, language)}</h2>
                            <span className="bg-brand-yellow text-brand-black border-0 text-[10px] font-black uppercase rounded-lg px-2.5 py-1 font-sans shrink-0">
                                {selectedProduct.type === 'combo' ? 'Combo' : selectedProduct.itemType === 'bike' ? (language === 'es' ? 'Bicicleta' : 'Bike') : (language === 'es' ? 'Accesorio' : 'Accessory')}
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
                                    <img
                                        src={productImages[activeImageIndex] || '/placeholder_bike.png'}
                                        alt={selectedProduct.name}
                                        className="w-full h-full object-contain p-4 transition-all duration-300"
                                    />

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

                                    <div className="absolute bottom-5 right-5 flex gap-2 z-10">
                                        <button
                                            type="button"
                                            onClick={handleToggleFavorite}
                                            aria-pressed={isFavorite}
                                            title={currentCustomer ? 'Guardar en favoritos' : 'Inicia sesión para guardar favoritos'}
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
                            {getLocalizedField(selectedProduct.description, selectedProduct.descriptionEn, language) || t('Alquila tu bicicleta ideal para pasear o entrenar por la ciudad con total comodidad y estilo.', language as any)}
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
                                            / {t(tier.label, language as any)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Wheel Sizes Select (if applicable) */}
                        {selectedProduct.hasWheelSizes && selectedWheelSizeOptions.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Selecciona Aro' : 'Select Wheel Size'}</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {selectedWheelSizeOptions.map((ws: { size: string; stock: number }) => (
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
                                            {language === 'es' ? `Aro ${ws.size}` : `Wheel ${ws.size}`}{ws.stock <= 0 ? (language === 'es' ? ' - Agotado' : ' - Out of stock') : ` (${ws.stock} ${language === 'es' ? 'disp.' : 'avail.'})`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity Selector */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Cantidad' : 'Quantity'}</Label>
                                <span className="text-[10px] font-bold text-brand-charcoal/50 font-maiandra uppercase">
                                    {language === 'es' ? `Disponible: ${selectedAvailability} ud${selectedAvailability === 1 ? '' : 's'}.` : `Available: ${selectedAvailability} unit${selectedAvailability === 1 ? '' : 's'}`}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-1.5 w-32 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                                    className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="flex-1 text-center font-black text-sm text-brand-black font-sans">{detailQty}</span>
                                <button
                                    type="button"
                                    onClick={() => setDetailQty(Math.min(Math.max(1, selectedAvailability), detailQty + 1))}
                                    disabled={detailQty >= selectedAvailability}
                                    className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Step 1 Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                            <Button
                                onClick={handleAddToCart}
                                disabled={selectedAvailability <= 0}
                                className="w-full bg-white border-2 border-brand-yellow hover:bg-brand-yellow/10 text-brand-black font-black rounded-2xl h-14 uppercase text-xs tracking-widest font-sans cursor-pointer"
                            >
                                <ShoppingBag className="w-4 h-4 mr-2" /> {language === 'es' ? 'Añadir al Carrito' : 'Add to Cart'}
                            </Button>
                            <Button
                                onClick={handleContinueStep1}
                                disabled={selectedAvailability <= 0}
                                className="w-full bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-2xl h-14 uppercase text-xs tracking-widest font-sans cursor-pointer shadow-md shadow-brand-yellow/10"
                            >
                                {selectedAvailability <= 0 ? (language === 'es' ? 'Agotado' : 'Out of Stock') : (language === 'es' ? 'Continuar' : 'Continue')}
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
                        <h2 className="font-tan text-2xl text-brand-black uppercase">{language === 'es' ? 'Detalles del Carrito' : 'Cart Details'}</h2>

                        {cart.length === 0 ? (
                            <div className="text-center py-10 bg-white/40 border border-brand-charcoal/5 rounded-[2rem] p-6 space-y-3 shadow-inner">
                                <ShoppingBag className="w-10 h-10 text-brand-charcoal/20 mx-auto" />
                                <p className="font-bold text-brand-charcoal/60 text-xs font-maiandra uppercase">{language === 'es' ? 'Tu carrito de alquiler está vacío' : 'Your rental cart is empty'}</p>
                                <Button
                                    onClick={() => { setSelectedProduct(null); onClose(); }}
                                    className="bg-brand-yellow text-brand-black font-black rounded-xl h-10 px-6 cursor-pointer"
                                >
                                    {language === 'es' ? 'Ir a buscar bicicletas' : 'Browse bicycles'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    {cart.map(item => {
                                        const hourlyPrice = calculatePrice(item.product.type || 'single', item.product.id, '1 hora', 1);
                                        return (
                                            <div
                                                key={item.id}
                                                className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 items-center shadow-sm relative group"
                                            >
                                                <img
                                                    src={item.product.imageUrl || '/placeholder_bike.png'}
                                                    alt={item.product.name}
                                                    className="w-16 h-16 object-contain rounded-xl border border-gray-100 shrink-0"
                                                />

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-brand-black text-sm truncate uppercase font-sans">{getLocalizedField(item.product.name, item.product.nameEn, language)}</h3>
                                                    <p className="font-black text-brand-yellow-vibrant text-xs mt-1 font-sans">
                                                        Bs. {hourlyPrice} / {language === 'es' ? '1 hora' : '1 hour'}
                                                    </p>
                                                    <p className="text-[10px] text-brand-black/40 font-bold uppercase font-maiandra mt-0.5">
                                                        {item.selectedWheelSize ? `${language === 'es' ? 'Aro' : 'Wheel'} ${item.selectedWheelSize} - ` : ''}{item.quantity} {language === 'es' ? `unidad${item.quantity > 1 ? 'es' : ''}` : `unit${item.quantity > 1 ? 's' : ''}`}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-150 rounded-lg p-1 shrink-0 scale-95">
                                                    <button type="button" onClick={() => handleUpdateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"><Minus className="w-2.5 h-2.5" /></button>
                                                    <span className="w-6 text-center font-bold text-xs text-brand-black font-sans">{item.quantity}</span>
                                                    <button type="button" onClick={() => handleUpdateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"><Plus className="w-2.5 h-2.5" /></button>
                                                </div>

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
                                                {language === 'es' ? 'Total estimado del carrito' : 'Estimated cart total'}
                                            </p>
                                            <p className="text-xs font-bold text-brand-black/55 font-sans">
                                                {language === 'es' ? 'Para comparar rápido antes de elegir fecha y duración.' : 'Quick estimate before selecting date and duration.'}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-2xl font-black leading-none text-brand-black">Bs. {cartHourlyEstimate}</p>
                                            <p className="text-[10px] font-black uppercase leading-none text-brand-black/35 font-maiandra">/ {language === 'es' ? '1 hora' : '1 hour'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4">
                                    <Button
                                        onClick={() => { setSelectedProduct(null); }}
                                        className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-brand-charcoal font-black rounded-2xl h-12 uppercase text-xs tracking-widest font-sans cursor-pointer"
                                    >
                                        {language === 'es' ? '+ Añadir más bicicletas' : '+ Add more bicycles'}
                                    </Button>
                                    <Button
                                        onClick={() => setStep(3)}
                                        className="w-full bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-2xl h-14 uppercase text-xs tracking-widest font-sans cursor-pointer shadow-md shadow-brand-yellow/10"
                                    >
                                        {language === 'es' ? 'Continuar con la Reserva' : 'Continue to Booking'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* STEP 3: RESERVATION SPECIFICATIONS & REAL INVENTORY ACCESSORIES */}
                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-6"
                    >
                        <h2 className="font-tan text-2xl text-brand-black uppercase">{language === 'es' ? 'Termina el Registro de tu Alquiler' : 'Complete Your Rental Details'}</h2>

                        {/* Calendar Dates & Hours Pickers */}
                        <div className="bg-white border border-gray-150 p-5 rounded-3xl space-y-4 shadow-sm">
                            <div className="space-y-2">
                                <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-brand-yellow-vibrant" /> {language === 'es' ? 'Fecha de Requerimiento' : 'Rental Date'}
                                </Label>
                                <Input
                                    type="date"
                                    required
                                    min={toBoliviaDateString(new Date())}
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="bg-gray-50 border-gray-200 text-brand-black font-bold h-12 rounded-xl focus-visible:ring-brand-yellow"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-brand-yellow-vibrant" /> {language === 'es' ? 'Hora Adquisición' : 'Pickup Time'}
                                    </Label>
                                    <select
                                        value={pickupTime}
                                        onChange={e => setPickupTime(e.target.value)}
                                        className="w-full px-4 bg-gray-50 border border-gray-200 h-12 text-sm text-brand-black font-bold rounded-xl focus:border-brand-yellow focus:outline-none font-sans"
                                    >
                                        {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(timeOpt => (
                                            <option key={timeOpt} value={timeOpt}>{timeOpt}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-brand-yellow-vibrant" /> {language === 'es' ? 'Hora Devolución' : 'Return Time'}
                                    </Label>
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

                        {/* Shared component conflict banner */}
                        {cartAvailabilityConflict && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-start gap-2.5">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                                <span>{cartAvailabilityConflict}</span>
                            </div>
                        )}

                        {/* Duration Selector Rate */}
                        <div className="space-y-2">
                            <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Selecciona la Duración de tu Reserva' : 'Select Your Rental Duration'}</Label>
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
                                            <span className="text-xs font-black uppercase font-maiandra tracking-tight">{t(tier.label, language as any)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* REDESIGNED REAL-INVENTORY ACCESSORY SELECTOR CARDS */}
                        <div className="space-y-4 bg-white border border-gray-150 p-5 rounded-3xl shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-gray-100 pb-3">
                                <div>
                                    <Label className="text-[13.5px] sm:text-sm text-brand-charcoal font-black uppercase tracking-widest font-tangkiwood flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-brand-yellow-vibrant" />
                                        {language === 'es' ? '¿Quieres agregar algún accesorio adicional?' : 'Would you like to add any extra accessories?'}
                                    </Label>
                                    <p className="text-[10px] font-bold text-brand-charcoal/50 font-maiandra uppercase mt-0.5">
                                        {language === 'es' ? 'Stock sincronizado en tiempo real con nuestro inventario' : 'Real-time stock synchronized with our inventory'}
                                    </p>
                                </div>
                                {selectedAccessoryEntries.length > 0 && (
                                    <span className="inline-flex items-center self-start sm:self-auto rounded-full bg-brand-yellow/20 px-3 py-1 text-[10px] font-black uppercase text-brand-black">
                                        {selectedAccessoryEntries.reduce((s, e) => s + e.quantity, 0)} {language === 'es' ? 'seleccionado(s)' : 'selected'} · +Bs. {accessoriesSubtotal}
                                    </span>
                                )}
                            </div>

                            {availableAddonAccessories.length === 0 ? (
                                <p className="text-xs text-brand-charcoal/50 font-bold text-center py-4">
                                    No hay accesorios adicionales disponibles en este momento.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {availableAddonAccessories.map(({ item, remainingStock, unitPrice, icon, badge, subtitle }) => {
                                        const qty = selectedAccessories[item.id] || 0;
                                        const isSelected = qty > 0;
                                        const isOutOfStock = remainingStock <= 0;

                                        return (
                                            <div
                                                key={item.id}
                                                className={`relative rounded-2xl border p-3.5 transition-all flex flex-col justify-between gap-3 ${
                                                    isOutOfStock
                                                        ? 'border-gray-100 bg-gray-50/70 opacity-60'
                                                        : isSelected
                                                            ? 'border-brand-yellow bg-[#FFFDF2] ring-2 ring-brand-yellow/30 shadow-sm'
                                                            : 'border-gray-150 bg-white hover:border-brand-yellow/50'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Image or Icon */}
                                                    <div className="w-12 h-12 rounded-xl bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-1" />
                                                        ) : (
                                                            <span className="text-2xl leading-none">{icon}</span>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <h4 className="font-bold text-xs sm:text-sm text-brand-black leading-tight font-sans">
                                                                {getLocalizedField(item.name, item.nameEn, language)}
                                                            </h4>
                                                            {badge && (
                                                                <span className="rounded-md bg-brand-charcoal/5 px-1.5 py-0.5 text-[9px] font-black uppercase text-brand-charcoal/70">
                                                                    {t(badge, language as any)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-brand-charcoal/55 font-medium line-clamp-1 mt-0.5 font-sans">
                                                            {getLocalizedField(subtitle, item.descriptionEn, language)}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-xs font-black text-brand-yellow-vibrant font-sans">
                                                                {unitPrice === 0 ? (language === 'es' ? 'Incluido (Bs. 0)' : 'Included (Bs. 0)') : `+Bs. ${unitPrice}`}
                                                            </span>
                                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                                                                isOutOfStock
                                                                    ? 'bg-red-100 text-red-600'
                                                                    : 'bg-emerald-50 text-emerald-700'
                                                            }`}>
                                                                {isOutOfStock ? (language === 'es' ? 'Agotado' : 'Out of stock') : `${remainingStock} ${language === 'es' ? 'disp.' : 'avail.'}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                    <span className="text-[10px] font-bold uppercase text-brand-charcoal/45 font-maiandra">
                                                        {qty > 0 ? `Subtotal: Bs. ${unitPrice * qty}` : (language === 'es' ? 'Cantidad' : 'Quantity')}
                                                    </span>
                                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1">
                                                        <button
                                                            type="button"
                                                            disabled={qty <= 0}
                                                            onClick={() => handleAccessoryDelta(item, -1, remainingStock)}
                                                            className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-brand-black hover:bg-gray-100 disabled:opacity-30 cursor-pointer shadow-xs"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="w-6 text-center font-black text-xs text-brand-black font-sans">
                                                            {qty}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            disabled={isOutOfStock || qty >= remainingStock}
                                                            onClick={() => handleAccessoryDelta(item, 1, remainingStock)}
                                                            className="w-7 h-7 rounded-lg bg-brand-yellow flex items-center justify-center text-brand-black hover:bg-brand-yellow-light disabled:opacity-30 cursor-pointer shadow-xs"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Delivery / Pickup Transportation Checks */}
                        <div className="space-y-3 bg-white border border-gray-150 p-5 rounded-3xl shadow-sm">
                            <Label className="text-[13.5px] sm:text-sm text-brand-charcoal font-black uppercase tracking-widest font-tangkiwood block border-b border-gray-100 pb-2 mb-2">
                                {language === 'es' ? '¿Entrega y recojo a domicilio?' : 'Home delivery & pickup?'}
                            </Label>
                            <p className="text-[9px] text-brand-black/40 font-bold uppercase font-maiandra leading-relaxed">
                                {language === 'es' ? 'Dentro el casco urbano de Cochabamba.' : 'Within the urban area of Cochabamba.'}
                            </p>
                            <div className="rounded-2xl border border-brand-yellow/30 bg-brand-yellow/10 p-3 text-[10px] font-bold uppercase leading-relaxed text-brand-black/60 font-maiandra">
                                {language === 'es'
                                    ? 'Si deseas recoger la bicicleta de nuestras instalaciones, te dejamos el mapa al finalizar el pedido.'
                                    : 'If you prefer to pick up the bike at our store, we will show you the map once your order is complete.'}
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
                                        🚚 {language === 'es' ? 'Servicio de entrega' : 'Delivery service'} ({isAddressInZone ? `+${calculateShippingFee(totalBikes)}` : '+0'} Bs)
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
                                        🔄 {language === 'es' ? 'Servicio de recojo' : 'Pickup service'} ({isAddressInZone ? `+${calculateShippingFee(totalBikes)}` : '+0'} Bs)
                                    </Label>
                                </div>
                            </div>

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
                            <span className="text-[10px] font-black uppercase tracking-widest font-maiandra text-white/60">{language === 'es' ? 'Total Estimado:' : 'Estimated Total:'}</span>
                            <span className="text-2xl font-black font-sans">Bs. {finalTotal.toFixed(2)}</span>
                        </div>

                        {/* Step 3 Alquilar CTA */}
                        <Button
                            onClick={handleAlquilarAhora}
                            disabled={Boolean(cartAvailabilityConflict)}
                            className="w-full bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-2xl h-14 uppercase text-xs tracking-widest font-sans cursor-pointer shadow-md shadow-brand-yellow/10 disabled:opacity-50"
                        >
                            {language === 'es' ? 'Alquilar ahora' : 'Rent now'}
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
                        <h2 className="font-tan text-2xl text-brand-black uppercase">{language === 'es' ? 'Resumen del Pedido y Pago' : 'Order Summary & Payment'}</h2>

                        {/* Order Summary */}
                        <div className="bg-white border border-gray-150 p-5 rounded-3xl space-y-3 shadow-sm">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-xs font-bold text-brand-black font-sans uppercase">{language === 'es' ? 'Resumen de reserva' : 'Booking summary'}</span>
                                <span className="text-xs font-black text-brand-charcoal font-sans">
                                    Bs. {finalTotal.toFixed(2)}
                                </span>
                            </div>

                            <div className="space-y-2 text-xs text-brand-charcoal/80 font-medium font-sans">
                                {cart.map(item => {
                                    const price = calculatePrice(item.product.type || 'single', item.product.id, duration, 1);
                                    return (
                                        <div key={item.id} className="flex justify-between">
                                            <span>{item.quantity}x {t(item.product.name, language as any)} {item.selectedWheelSize ? `(Aro ${item.selectedWheelSize})` : ''}</span>
                                            <span>Bs. {(price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    );
                                })}

                                {/* Real Accessories summary */}
                                {selectedAccessoryEntries.map(accEntry => (
                                    <div key={accEntry.item.id} className="flex justify-between text-brand-charcoal/60">
                                        <span>{accEntry.quantity}x {t(accEntry.item.name, language as any)}</span>
                                        <span>Bs. {accEntry.lineTotal.toFixed(2)}</span>
                                    </div>
                                ))}

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
                                placeholder={language === 'es' ? 'Código de descuento' : 'Discount code'}
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
                                {language === 'es' ? 'Aplicar' : 'Apply'}
                            </Button>
                        </div>

                        {/* Payment Method Selector Accordion */}
                        <div className="space-y-3">
                            <Label className="text-[10px] text-brand-black/50 font-bold uppercase tracking-widest font-maiandra">{language === 'es' ? 'Selecciona Método de Pago' : 'Select Payment Method'}</Label>

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
                                        <span className="font-bold text-xs uppercase font-sans text-brand-black">{language === 'es' ? 'Pago con QR' : 'QR Payment'}</span>
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
                                        <span className="font-bold text-xs uppercase font-sans text-brand-black">{language === 'es' ? 'Depósito / Transferencia Bancaria' : 'Bank Deposit / Transfer'}</span>
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
                                        <span className="font-bold text-xs uppercase font-sans text-brand-black">{language === 'es' ? 'Pago en Efectivo' : 'Cash Payment'}</span>
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
                            disabled={loading || Boolean(cartAvailabilityConflict)}
                            className="w-full bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-2xl h-14 uppercase text-xs tracking-widest font-sans cursor-pointer shadow-md shadow-brand-yellow/10"
                        >
                            {loading ? (language === 'es' ? 'Procesando Reserva...' : 'Processing Booking...') : (language === 'es' ? 'FINALIZAR EL PEDIDO' : 'COMPLETE BOOKING')}
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
                        <div className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-[2.2rem] p-6 sm:p-8 space-y-6 shadow-sm">
                            <div className="w-16 h-16 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8 text-brand-yellow-vibrant" strokeWidth={2.5} />
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest text-brand-charcoal/50 notranslate" translate="no">
                                    {language === 'es' ? 'Código' : 'Code'}: {reservationCode}
                                </p>
                                <h2 className="font-tan text-2xl uppercase text-brand-black leading-tight">
                                    {paymentMethod === 'cash'
                                        ? (language === 'es' ? 'Tu pedido está en estado reservado hasta realizar el pago' : 'Your booking is reserved until payment is completed')
                                        : (language === 'es' ? 'Tu pedido está confirmado' : 'Your booking is confirmed')}
                                </h2>
                                <p className="text-xs font-semibold text-brand-charcoal/70 leading-relaxed font-sans">
                                    {language === 'es' ? 'Recibirás confirmación cuando tu pedido esté listo para ser entregado.' : 'You will receive confirmation once your order is ready for pickup or delivery.'}
                                </p>
                            </div>

                            <div className="bg-brand-charcoal text-white rounded-2xl p-5 text-xs font-sans space-y-2 flex flex-col items-center text-center shadow-md">
                                <p className="font-black text-brand-yellow uppercase tracking-wider text-xs flex items-center gap-1.5">
                                    <span>⚠️</span> {language === 'es' ? '¿DESEAS MODIFICAR O CAMBIAR TU PEDIDO?' : 'NEED TO MODIFY OR CHANGE YOUR BOOKING?'}
                                </p>
                                <p className="font-semibold text-white/95 leading-relaxed">
                                    {language === 'es'
                                        ? 'Si quieres cambiar la fecha, hora, tipo de bicicleta, accesorios o dirección de tu reserva, ¡no te preocupes! Escríbenos directamente por WhatsApp y lo modificaremos de inmediato por ti.'
                                        : 'If you need to change the date, time, bicycle, accessories, or delivery address of your booking, just message us on WhatsApp and we will update it right away.'}
                                </p>
                                <a
                                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(language === 'es' ? `Hola Briz, acabo de realizar mi pedido con código ${reservationCode} y me gustaría realizar una modificación.` : `Hello Briz, I just placed booking ${reservationCode} and I would like to make a change.`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1.5 inline-flex items-center gap-1.5 bg-brand-yellow text-brand-black px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-yellow-light transition-all shadow-md cursor-pointer hover:scale-102"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" /> {language === 'es' ? 'Modificar pedido por WhatsApp' : 'Modify booking via WhatsApp'}
                                </a>
                            </div>

                            <div className="bg-white/80 border border-brand-yellow/15 p-5 rounded-2xl space-y-4 text-xs font-sans">
                                <p className="font-black text-brand-black text-sm border-b border-gray-100 pb-1.5">{language === 'es' ? 'Detalles del pedido' : 'Booking details'}</p>

                                <div className="space-y-3.5">
                                    <div>
                                        <p className="text-[10px] text-brand-black/40 font-bold uppercase font-maiandra">{language === 'es' ? 'Información del pedido' : 'Customer email'}</p>
                                        <p className="font-bold text-brand-charcoal text-sm mt-0.5">{currentCustomer?.email || 'N/A'}</p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-brand-black/40 font-bold uppercase font-maiandra">{language === 'es' ? 'Método de pago' : 'Payment method'}</p>
                                        <p className="font-bold text-brand-charcoal text-sm mt-0.5">
                                            {paymentMethod === 'qr' ? 'QR' : paymentMethod === 'transfer' ? (language === 'es' ? 'Transferencia' : 'Bank Transfer') : (language === 'es' ? 'Efectivo' : 'Cash')} · BOB {amountToShow.toFixed(2)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-brand-black/40 font-bold uppercase font-maiandra">{language === 'es' ? 'Dirección de facturación' : 'Billing address'}</p>
                                        <p className="font-bold text-brand-charcoal/50 text-[11px] italic mt-0.5">{language === 'es' ? 'No requerida (Consumidor Final)' : 'Not required (Standard Receipt)'}</p>
                                    </div>

                                    {(deliveryChecked || pickupChecked) && (
                                        <div>
                                            <p className="text-[10px] text-brand-black/40 font-bold uppercase font-maiandra">{language === 'es' ? 'Dirección de envío / recojo' : 'Delivery / pickup address'}</p>
                                            <p className="font-bold text-brand-charcoal text-[11px] mt-0.5 leading-normal">{formattedAddress}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white/80 border border-brand-yellow/15 p-5 rounded-2xl space-y-3 text-xs font-sans">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-brand-yellow-vibrant shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-black text-brand-black text-sm">{language === 'es' ? 'Mapa de la tienda' : 'Store location'}</p>
                                        <p className="font-bold text-brand-charcoal/70 mt-1">{STORE_ADDRESS}</p>
                                    </div>
                                </div>
                                <a
                                    href={STORE_MAP_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-yellow px-4 py-3 text-xs font-black uppercase tracking-widest text-brand-black hover:bg-brand-yellow-light"
                                >
                                    {language === 'es' ? 'Abrir mapa de la tienda' : 'Open store map'}
                                </a>
                            </div>

                            {(paymentMethod === 'qr' || paymentMethod === 'transfer') && (
                                <div className="bg-white/80 border border-brand-yellow/15 p-5 rounded-2xl space-y-3 text-center">
                                    <p className="text-xs font-bold text-brand-charcoal/70 leading-relaxed font-sans">
                                        {language === 'es'
                                            ? 'Envía el comprobante de pago al número de WhatsApp para confirmar tu pedido.'
                                            : 'Send your payment receipt via WhatsApp to confirm your booking.'}
                                    </p>
                                    <a
                                        href={proofWhatsappUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-charcoal px-4 py-3 text-xs font-black uppercase tracking-widest text-brand-yellow hover:bg-brand-black"
                                    >
                                        <MessageSquare className="w-4 h-4" /> {language === 'es' ? 'Enviar comprobante por WhatsApp' : 'Send payment receipt via WhatsApp'}
                                    </a>
                                </div>
                            )}

                            <div className="pt-2 text-center border-t border-brand-yellow/10">
                                <a
                                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(language === 'es' ? `Hola Briz, acabo de realizar una solicitud de alquiler. Código: ${reservationCode}` : `Hello Briz, I just submitted a rental booking. Code: ${reservationCode}`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-black text-brand-yellow hover:text-brand-yellow-light inline-flex items-center gap-1.5 bg-brand-charcoal px-4 py-2 rounded-xl"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" /> {language === 'es' ? '¿Tienes dudas? Contáctanos por WhatsApp' : 'Have questions? Contact us on WhatsApp'}
                                </a>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={() => {
                                    setSelectedProduct(null);
                                    setStep(1);
                                    onClose();
                                }}
                                className="w-full bg-brand-yellow hover:bg-brand-yellow-light text-brand-black font-black rounded-2xl h-14 uppercase text-xs tracking-widest font-sans cursor-pointer shadow-md shadow-brand-yellow/10"
                            >
                                {language === 'es' ? 'SEGUIR COMPRANDO' : 'CONTINUE BROWSING'}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
