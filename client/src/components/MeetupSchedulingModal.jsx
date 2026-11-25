import { useState } from 'react';
import {
    Calendar,
    MapPin,
    Clock,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Handshake,
    Truck,
    Building2,
    Copy,
    Check
} from 'lucide-react';
import LocationMapPicker from './LocationMapPicker';
import { resolveLocationCoords } from '../utils/utmLocations';

const UTM_CAMPUS_PRESETS = [
    { label: 'UTM Library (PSZ - Level 1 Entrance)', location: 'UTM Perpustakaan Sultanah Zanariah (PSZ)' },
    { label: 'Arked Cengal (Student Mall Cafe Area)', location: 'Arked Cengal, UTM' },
    { label: 'Arked Meranti (Courtyard)', location: 'Arked Meranti, UTM' },
    { label: 'Faculty of Computing (FC Foyer / N28)', location: 'Faculty of Computing (N28), UTM' },
    { label: 'Faculty of Built Environment (FABU)', location: 'FABU / B12 Foyer, UTM' },
    { label: 'Faculty of Electrical Engineering (FKE)', location: 'FKE / P19 Entrance, UTM' },
    { label: 'Kolej Rahman Putra (KRP Cafeteria)', location: 'Kolej Rahman Putra (KRP), UTM' },
    { label: 'Kolej Tun Dr. Ismail (KTDI Gazebo)', location: 'Kolej Tun Dr. Ismail (KTDI), UTM' },
    { label: 'Kolej Tun Fatimah (KTF Admin Area)', location: 'Kolej Tun Fatimah (KTF), UTM' },
    { label: 'Custom Campus Location', location: '' },
];

export default function MeetupSchedulingModal({ transaction, order, currentUser, onClose, onUpdated }) {
    const [handoverMethod, setHandoverMethod] = useState(
        transaction?.handoverMethod || order?.transactionMethod || 'meetup'
    );
    const [selectedPreset, setSelectedPreset] = useState(() => {
        const found = UTM_CAMPUS_PRESETS.find(p => p.location && p.location === transaction?.meetupLocation);
        return found ? found.location : (transaction?.meetupLocation ? 'CUSTOM' : UTM_CAMPUS_PRESETS[0].location);
    });
    const [customLocation, setCustomLocation] = useState(
        transaction?.meetupLocation || UTM_CAMPUS_PRESETS[0].location
    );
    const [meetupCoordinates, setMeetupCoordinates] = useState(() =>
        resolveLocationCoords(
            transaction?.meetupLocation || UTM_CAMPUS_PRESETS[0].location,
            transaction?.meetupCoordinates
        )
    );

    // Format initial date for datetime-local
    const formatInitialDateTime = (d) => {
        if (!d) return '';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [meetupTime, setMeetupTime] = useState(() => formatInitialDateTime(transaction?.meetupTime));
    const [meetupNotes, setMeetupNotes] = useState(transaction?.meetupNotes || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const transactionCode = transaction?.transactionCode || `TRX-${order?._id?.slice(-6).toUpperCase()}`;

    const handleCopyCode = () => {
        if (transactionCode) {
            navigator.clipboard.writeText(transactionCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const finalLocation = customLocation.trim();

        if (handoverMethod === 'meetup' && !finalLocation) {
            setError('Please specify a campus meetup location.');
            return;
        }

        if (handoverMethod === 'meetup' && !meetupTime) {
            setError('Please select a meetup date and time.');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/transactions/${transaction._id}/handover`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser?._id,
                    meetupLocation: finalLocation,
                    meetupCoordinates,
                    meetupTime: meetupTime ? new Date(meetupTime).toISOString() : null,
                    handoverMethod,
                    meetupNotes: meetupNotes.trim(),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to update handover schedule');
            }

            if (onUpdated) {
                onUpdated(data.transaction || data);
            }
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative border border-slate-100 my-4 sm:my-8 max-h-[90dvh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
                    title="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-start gap-3.5 mb-6">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Handshake className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-black text-slate-900">
                                Handover & Meetup Setup
                            </h2>
                            <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                                T13 Active
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Coordinate physical exchange location and schedule for this agreed deal.
                        </p>
                    </div>
                </div>

                {/* Transaction ID Pill */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-5 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Official Transaction ID
                        </span>
                        <span className="text-sm font-black font-mono text-blue-700">
                            {transactionCode}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition shadow-2xs cursor-pointer"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy ID</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Method Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Handover Method
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setHandoverMethod('meetup')}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                    handoverMethod === 'meetup'
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <Handshake className="w-4 h-4" /> Campus Meetup
                            </button>
                            <button
                                type="button"
                                onClick={() => setHandoverMethod('delivery')}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                    handoverMethod === 'delivery'
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <Truck className="w-4 h-4" /> Campus Delivery
                            </button>
                        </div>
                    </div>

                    {/* Location Map Picker */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-600" />
                            {handoverMethod === 'meetup' ? 'UTM Meetup Location (Pin on Map)' : 'Delivery Drop-off Point (Pin on Map)'}
                        </label>
                        <LocationMapPicker
                            location={customLocation}
                            coordinates={meetupCoordinates}
                            onChange={({ location, coordinates }) => {
                                setCustomLocation(location);
                                setMeetupCoordinates(coordinates);
                                setSelectedPreset(location);
                            }}
                            heightClass="h-44"
                        />
                    </div>

                    {/* Meetup Date and Time */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            Target Meetup Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={meetupTime}
                            onChange={(e) => setMeetupTime(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Instructions / Notes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Special Instructions / Identifying Note (Optional)
                        </label>
                        <textarea
                            rows="2"
                            value={meetupNotes}
                            onChange={(e) => setMeetupNotes(e.target.value)}
                            placeholder="e.g. Look for student with black laptop bag, or call when arriving at the entrance..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        ></textarea>
                    </div>

                    {/* Safety Tip */}
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                            Always meet in populated campus public areas during daylight or well-lit hours. Verify the item condition before completing payment.
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Saving Schedule...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Confirm Handover Details</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
