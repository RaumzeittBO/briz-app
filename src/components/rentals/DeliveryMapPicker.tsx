import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

declare global {
    interface Window {
        google: any;
    }
}

interface DeliveryMapPickerProps {
    onLocationSelected: (address: string, latLng: { lat: number; lng: number }, isInside: boolean) => void;
    initialAddress?: string;
    initialLatLng?: { lat: number; lng: number } | null;
}

// Bounding box limits for standard delivery zone in Cochabamba
// North: Segunda Circunvalación (~lat -17.345)
// South: Av. 6 de Agosto (~lat -17.413)
// West: Av. Beijing (~lng -66.182)
// East: Av. Villazón Km 8 (~lng -66.071)
const LIMITS = {
    north: -17.345,
    south: -17.413,
    west: -66.182,
    east: -66.071,
};

const COCHABAMBA_CENTER = { lat: -17.393698, lng: -66.157125 };

export default function DeliveryMapPicker({
    onLocationSelected,
    initialAddress = '',
    initialLatLng = null
}: DeliveryMapPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const [mapLoaded, setMapLoaded] = useState(false);
    const [addressText, setAddressText] = useState(initialAddress);
    const [isInside, setIsInside] = useState(true);
    const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(initialLatLng);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Instances references
    const googleMapInstance = useRef<google.maps.Map | null>(null);
    const markerInstance = useRef<google.maps.Marker | null>(null);

    const isInsideZone = (lat: number, lng: number): boolean => {
        return lat >= LIMITS.south && lat <= LIMITS.north && lng >= LIMITS.west && lng <= LIMITS.east;
    };

    // Load Google Maps script dynamically
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.error('Google Maps API Key (VITE_GOOGLE_MAPS_API_KEY) is missing in environment variables.');
            return;
        }

        if (window.google && window.google.maps) {
            setMapLoaded(true);
            return;
        }

        // Check if script is already loading
        const existingScript = document.getElementById('google-maps-api-script');
        if (existingScript) return;

        const script = document.createElement('script');
        script.id = 'google-maps-api-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            setMapLoaded(true);
        };
        script.onerror = () => {
            console.error('Failed to load Google Maps API script.');
        };
        document.head.appendChild(script);
    }, []);

    // Initialize Map once loaded
    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;

        const initialCenter = selectedPos || COCHABAMBA_CENTER;
        const initialZoom = selectedPos ? 16 : 13;

        // Create Map
        const map = new window.google.maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: initialZoom,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }] // clean business labels for cleaner looks
                }
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        });
        googleMapInstance.current = map;

        // Create Marker
        const marker = new window.google.maps.Marker({
            position: initialCenter,
            map: map,
            draggable: true,
            title: 'Arrastra para marcar tu ubicación exacta',
            animation: window.google.maps.Animation.DROP,
        });
        markerInstance.current = marker;

        // Draw visual standard delivery zone polygon
        new window.google.maps.Polygon({
            paths: [
                { lat: LIMITS.north, lng: LIMITS.west }, // NW
                { lat: LIMITS.north, lng: LIMITS.east }, // NE
                { lat: LIMITS.south, lng: LIMITS.east }, // SE
                { lat: LIMITS.south, lng: LIMITS.west }, // SW
            ],
            strokeColor: '#EAB308', // brand-yellow equivalent
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#EAB308',
            fillOpacity: 0.12,
            map: map,
            clickable: false
        });

        // Initialize Places Autocomplete
        if (inputRef.current) {
            const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: 'BO' },
                bounds: new window.google.maps.LatLngBounds(
                    { lat: -17.460, lng: -66.250 },
                    { lat: -17.300, lng: -66.030 }
                ),
                fields: ['geometry', 'formatted_address'],
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) return;

                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const newPos = { lat, lng };

                map.setCenter(newPos);
                map.setZoom(16);
                marker.setPosition(newPos);
                setSelectedPos(newPos);

                const address = place.formatted_address || '';
                setAddressText(address);

                const inZone = isInsideZone(lat, lng);
                setIsInside(inZone);
                onLocationSelected(address, newPos, inZone);
            });
        }

        // Listener for Drag End on Marker
        marker.addListener('dragend', () => {
            const position = marker.getPosition();
            if (!position) return;
            const lat = position.lat();
            const lng = position.lng();
            const newPos = { lat, lng };
            setSelectedPos(newPos);

            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: newPos }, (results: any, status: any) => {
                let address = '';
                if (status === 'OK' && results && results[0]) {
                    address = results[0].formatted_address;
                } else {
                    address = `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                }
                setAddressText(address);

                const inZone = isInsideZone(lat, lng);
                setIsInside(inZone);
                onLocationSelected(address, newPos, inZone);
            });
        });

        // Listener for clicking on Map to move marker
        map.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (!event.latLng) return;
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            const newPos = { lat, lng };
            
            marker.setPosition(newPos);
            setSelectedPos(newPos);

            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: newPos }, (results: any, status: any) => {
                let address = '';
                if (status === 'OK' && results && results[0]) {
                    address = results[0].formatted_address;
                } else {
                    address = `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                }
                setAddressText(address);

                const inZone = isInsideZone(lat, lng);
                setIsInside(inZone);
                onLocationSelected(address, newPos, inZone);
            });
        });

        // Trigger initial callback if we already have initial values
        if (initialLatLng) {
            const inZone = isInsideZone(initialLatLng.lat, initialLatLng.lng);
            setIsInside(inZone);
        }

    }, [mapLoaded]);

    // Geolocation for current user position
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('La geolocalización no es soportada por tu navegador.');
            return;
        }

        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const newPos = { lat, lng };

                setSelectedPos(newPos);
                
                if (googleMapInstance.current) {
                    googleMapInstance.current.setCenter(newPos);
                    googleMapInstance.current.setZoom(16);
                }
                if (markerInstance.current) {
                    markerInstance.current.setPosition(newPos);
                }

                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: newPos }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                    let address = '';
                    if (status === 'OK' && results && results[0]) {
                        address = results[0].formatted_address;
                    } else {
                        address = `Mi ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    }
                    setAddressText(address);

                    const inZone = isInsideZone(lat, lng);
                    setIsInside(inZone);
                    onLocationSelected(address, newPos, inZone);
                    setLoadingLocation(false);
                });
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('No pudimos acceder a tu ubicación actual. Por favor búscala usando la barra de búsqueda superior.');
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    return (
        <div className="space-y-3 font-sans">
            <div className="relative flex gap-2">
                <div className="relative flex-1">
                    <Input
                        ref={inputRef}
                        type="text"
                        value={addressText}
                        onChange={(e) => setAddressText(e.target.value)}
                        placeholder="Busca tu dirección de envío..."
                        className="bg-white border-brand-yellow/30 text-brand-black text-xs font-bold h-11 pr-8 rounded-xl focus-visible:ring-brand-yellow placeholder:text-gray-400"
                    />
                    <MapPin className="absolute right-3 top-3.5 w-4 h-4 text-brand-yellow-vibrant" />
                </div>
                <Button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={loadingLocation}
                    className="h-11 px-3 bg-brand-charcoal text-brand-yellow hover:bg-brand-black rounded-xl cursor-pointer"
                    title="Obtener mi ubicación actual"
                >
                    <Navigation className={`w-4 h-4 ${loadingLocation ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Map Container */}
            <div 
                ref={mapRef} 
                className="w-full h-[250px] sm:h-[300px] rounded-[1.5rem] border border-gray-200 overflow-hidden shadow-inner bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400"
            >
                {!mapLoaded && <span>Cargando mapa interactivo...</span>}
            </div>

            {/* Status indicators */}
            {selectedPos && (
                <div className={`p-3.5 rounded-xl border text-[11px] font-bold leading-normal transition-all ${
                    isInside 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                        : 'bg-amber-50 border-amber-100 text-amber-800'
                }`}>
                    {isInside ? (
                        <p>✓ Ubicación dentro de la zona de cobertura estándar. El costo de transporte se calculará automáticamente en base a tu pedido.</p>
                    ) : (
                        <div>
                            <p className="font-extrabold uppercase">⚠️ Ubicación fuera de la zona de cobertura estándar</p>
                            <p className="mt-1 font-semibold normal-case text-amber-700">El pedido se registrará, pero el costo del transporte se coordinará manualmente contigo por WhatsApp (Tarifa Bs. 0 cotizada en web).</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
