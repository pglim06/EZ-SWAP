import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, ExternalLink, Search, Loader2, X } from 'lucide-react';
import { UTM_CAMPUS_SPOTS, resolveLocationCoords } from '../utils/utmLocations';

function createPinIcon() {
    return L.divIcon({
        className: 'ezswap-map-pin',
        html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#2563eb;border:3px solid #ffffff;box-shadow:0 4px 10px rgba(15,23,42,0.35);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:50%;background:#ffffff;transform:rotate(45deg);"></div></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
    });
}

async function searchPlaces(query) {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const lower = trimmed.toLowerCase();
    const localMatches = UTM_CAMPUS_SPOTS.filter(
        (spot) =>
            spot.shortName.toLowerCase().includes(lower) ||
            spot.label.toLowerCase().includes(lower) ||
            spot.location.toLowerCase().includes(lower)
    ).map((spot) => ({
        id: `utm-${spot.shortName}`,
        name: spot.shortName,
        displayName: spot.location,
        lat: spot.lat,
        lng: spot.lng,
        source: 'utm',
    }));

    try {
        const params = new URLSearchParams({
            format: 'json',
            q: trimmed,
            countrycodes: 'my',
            limit: '5',
            addressdetails: '1',
            viewbox: '103.50,1.65,103.80,1.45',
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) return localMatches;
        const data = await res.json();
        const remoteMatches = (Array.isArray(data) ? data : []).map((item) => {
            const parts = String(item.display_name || '').split(',').map((s) => s.trim());
            return {
                id: `osm-${item.place_id}`,
                name: parts[0] || trimmed,
                displayName: parts.slice(0, 3).join(', '),
                lat: Number(item.lat),
                lng: Number(item.lon),
                source: 'osm',
            };
        });
        return [...localMatches, ...remoteMatches].slice(0, 7);
    } catch {
        return localMatches;
    }
}

async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { Accept: 'application/json' } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.display_name) return null;
        return String(data.display_name)
            .split(',')
            .map((s) => s.trim())
            .slice(0, 3)
            .join(', ');
    } catch {
        return null;
    }
}

export default function LocationMapPicker({
    location = '',
    coordinates = null,
    onChange,
    readOnly = false,
    heightClass = 'h-56',
    placeholder = 'Search a location (e.g. Arked Meranti, AEON Taman U, PSZ)...',
}) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const onChangeRef = useRef(onChange);
    const wrapperRef = useRef(null);

    const [searchText, setSearchText] = useState(location || '');
    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [locating, setLocating] = useState(false);
    const [geoError, setGeoError] = useState('');

    onChangeRef.current = onChange;

    const resolved = resolveLocationCoords(location, coordinates);

    // Keep input synced when parent updates location externally (e.g. on EditListing load)
    useEffect(() => {
        setSearchText(location || '');
    }, [location]);

    // Close suggestions dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initialize Leaflet map
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [resolved.lat, resolved.lng],
            zoom: 16,
            scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([resolved.lat, resolved.lng], {
            icon: createPinIcon(),
            draggable: !readOnly,
        }).addTo(map);

        if (location) {
            marker.bindPopup(location);
        }

        const handlePinMove = async (lat, lng) => {
            const rounded = {
                lat: Number(lat.toFixed(6)),
                lng: Number(lng.toFixed(6)),
            };
            marker.setLatLng([rounded.lat, rounded.lng]);
            const fallbackLabel = `Pinned (${rounded.lat.toFixed(4)}, ${rounded.lng.toFixed(4)})`;
            setSearchText(fallbackLabel);
            onChangeRef.current?.({
                location: fallbackLabel,
                coordinates: rounded,
            });

            const placeName = await reverseGeocode(rounded.lat, rounded.lng);
            if (placeName) {
                setSearchText(placeName);
                marker.bindPopup(placeName);
                onChangeRef.current?.({
                    location: placeName,
                    coordinates: rounded,
                });
            }
        };

        if (!readOnly) {
            map.on('click', (e) => {
                handlePinMove(e.latlng.lat, e.latlng.lng);
            });

            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                handlePinMove(pos.lat, pos.lng);
            });
        }

        mapInstanceRef.current = map;
        markerRef.current = marker;

        setTimeout(() => map.invalidateSize(), 150);

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [readOnly]);

    // Smoothly fly map & update pin whenever coordinates or location change
    useEffect(() => {
        const map = mapInstanceRef.current;
        const marker = markerRef.current;
        if (!map || !marker) return;

        marker.setLatLng([resolved.lat, resolved.lng]);
        if (location) {
            marker.bindPopup(location);
        }
        map.flyTo([resolved.lat, resolved.lng], 16, { duration: 0.6 });
    }, [resolved.lat, resolved.lng, location]);

    // Debounced Grab-style search as user types
    useEffect(() => {
        if (readOnly || !showDropdown) return;

        const trimmed = searchText.trim();
        if (!trimmed) {
            setSuggestions(
                UTM_CAMPUS_SPOTS.slice(0, 5).map((spot) => ({
                    id: `utm-${spot.shortName}`,
                    name: spot.shortName,
                    displayName: spot.location,
                    lat: spot.lat,
                    lng: spot.lng,
                    source: 'utm',
                }))
            );
            setSearching(false);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            const results = await searchPlaces(trimmed);
            setSuggestions(results);
            setSearching(false);
        }, 350);

        return () => clearTimeout(timer);
    }, [searchText, showDropdown, readOnly]);

    const selectSuggestion = (item) => {
        setGeoError('');
        setSearchText(item.displayName);
        setShowDropdown(false);
        onChange?.({
            location: item.displayName,
            coordinates: { lat: item.lat, lng: item.lng },
        });
    };

    const handleSearchKeyDown = async (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (suggestions.length > 0) {
            selectSuggestion(suggestions[0]);
            return;
        }
        if (searchText.trim()) {
            setSearching(true);
            const results = await searchPlaces(searchText);
            setSearching(false);
            if (results.length > 0) {
                selectSuggestion(results[0]);
            }
        }
    };

    const handleSelectSpot = (spot) => {
        if (readOnly || !onChange) return;
        setGeoError('');
        setSearchText(spot.location);
        setShowDropdown(false);
        onChange({
            location: spot.location,
            coordinates: { lat: spot.lat, lng: spot.lng },
        });
    };

    const handleUseMyLocation = () => {
        if (readOnly || !onChange) return;
        if (!navigator.geolocation) {
            setGeoError('Geolocation is not supported by your browser.');
            return;
        }
        setLocating(true);
        setGeoError('');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const rounded = {
                    lat: Number(pos.coords.latitude.toFixed(6)),
                    lng: Number(pos.coords.longitude.toFixed(6)),
                };
                const placeName =
                    (await reverseGeocode(rounded.lat, rounded.lng)) ||
                    `Current Location (${rounded.lat.toFixed(4)}, ${rounded.lng.toFixed(4)})`;
                setSearchText(placeName);
                setShowDropdown(false);
                onChange({
                    location: placeName,
                    coordinates: rounded,
                });
                setLocating(false);
            },
            () => {
                setGeoError('Could not access GPS. Please search or click on the map.');
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${resolved.lat},${resolved.lng}`;

    return (
        <div ref={wrapperRef} className="space-y-2.5">
            {!readOnly && (
                <>
                    {/* Quick UTM Landmark Pills */}
                    <div className="flex flex-wrap gap-1.5">
                        {UTM_CAMPUS_SPOTS.map((spot) => {
                            const isSelected = location === spot.location;
                            return (
                                <button
                                    key={spot.shortName}
                                    type="button"
                                    onClick={() => handleSelectSpot(spot)}
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                                        isSelected
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                                    }`}
                                >
                                    {spot.shortName}
                                </button>
                            );
                        })}
                    </div>

                    {/* Grab-style Location Search Input + GPS Button */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={searchText}
                                onFocus={() => setShowDropdown(true)}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSearchText(val);
                                    setShowDropdown(true);
                                    onChange?.({
                                        location: val,
                                        coordinates: coordinates || resolved,
                                    });
                                }}
                                onKeyDown={handleSearchKeyDown}
                                placeholder={placeholder}
                                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {searching ? (
                                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                            ) : (
                                searchText && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchText('');
                                            setShowDropdown(true);
                                            onChange?.({ location: '', coordinates: null });
                                        }}
                                        className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                                        title="Clear location"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )
                            )}

                            {/* Autocomplete Suggestions Dropdown */}
                            {showDropdown && suggestions.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                                    {suggestions.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => selectSuggestion(item)}
                                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50/70 transition flex items-start gap-2.5 cursor-pointer"
                                        >
                                            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold text-slate-900 truncate">
                                                        {item.name}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                                                            item.source === 'utm'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {item.source === 'utm' ? 'UTM Spot' : 'Map'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 truncate">
                                                    {item.displayName}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleUseMyLocation}
                            disabled={locating}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition shrink-0 cursor-pointer disabled:opacity-50"
                        >
                            <Navigation className="w-3.5 h-3.5 text-blue-600" />
                            {locating ? 'Locating...' : 'Use My GPS'}
                        </button>
                    </div>
                </>
            )}

            {geoError && (
                <p className="text-[11px] text-amber-600 font-medium">{geoError}</p>
            )}

            {/* Interactive Map */}
            <div className={`w-full ${heightClass} rounded-xl overflow-hidden border border-slate-200 relative z-0`}>
                <div ref={mapContainerRef} className="w-full h-full" />
            </div>

            {/* Footer Coordinates + Google Maps Link */}
            <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                    {readOnly ? (
                        <>Pinned: <strong className="text-slate-700">{location || 'UTM Skudai Campus'}</strong></>
                    ) : (
                        <>Type to search, click map, or drag pin ({resolved.lat.toFixed(4)}, {resolved.lng.toFixed(4)})</>
                    )}
                </span>
                <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                >
                    Open in Google Maps <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    );
}
