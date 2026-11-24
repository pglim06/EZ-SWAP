import { useState } from 'react';
import {
    AlertTriangle,
    X,
    Loader2,
    ShieldAlert,
    CheckCircle2,
    Building2,
    Copy,
    Check
} from 'lucide-react';

const DISPUTE_REASONS = [
    'Counterpart did not show up at scheduled meetup location',
    'Item condition or model differs significantly from description',
    'Item is defective, damaged, or missing essential parts',
    'Payment or pricing disagreement during exchange',
    'Suspected fraudulent or counterfeit item',
    'Other issue or safety violation',
];

export default function DisputeModal({ transaction, currentUser, onClose, onSuccess }) {
    const [selectedReason, setSelectedReason] = useState(DISPUTE_REASONS[0]);
    const [customReason, setCustomReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const transactionCode = transaction?.transactionCode || 'TRX-UNKNOWN';

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

        const combinedReason = customReason.trim()
            ? `${selectedReason}: ${customReason.trim()}`
            : selectedReason;

        if (!combinedReason.trim()) {
            setError('Please provide a reason for the dispute.');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/transactions/${transaction._id}/dispute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser?._id,
                    reason: combinedReason,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to submit dispute');
            }

            if (onSuccess) {
                onSuccess(data.transaction || data, data.report);
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
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative border border-slate-100 my-8">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
                    title="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-start gap-3.5 mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-black text-slate-900">
                                Flag Transaction Dispute
                            </h2>
                            <span className="text-[11px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-md border border-red-200">
                                T14 Protection
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Submit a report to flag incomplete, unsafe, or contested handovers to campus admin.
                        </p>
                    </div>
                </div>

                {/* Transaction ID Pill */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-5 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Disputed Transaction ID
                        </span>
                        <span className="text-sm font-black font-mono text-red-700">
                            {transactionCode}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-300 transition shadow-2xs cursor-pointer"
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
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Reason Category Presets */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                            Reason for Dispute
                        </label>
                        <div className="space-y-2">
                            {DISPUTE_REASONS.map((reason, idx) => (
                                <label
                                    key={idx}
                                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition ${
                                        selectedReason === reason
                                            ? 'bg-red-50/60 border-red-200 text-red-900 font-semibold'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="disputeReason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={() => setSelectedReason(reason)}
                                        className="mt-0.5 text-red-600 focus:ring-red-500"
                                    />
                                    <span>{reason}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Notes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Additional Details / Context for Admin
                        </label>
                        <textarea
                            rows="3"
                            required
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            placeholder="Please provide specifics (e.g. waited 30 minutes at PSZ library, item had crack not visible in pictures, etc.)..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                        ></textarea>
                    </div>

                    {/* Notice */}
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                            Flagging a dispute pauses transaction completion and alerts the EZ Swap admin team to mediate. An entry will be posted into your trade chat.
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
                            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Submitting Dispute...</span>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>Submit Dispute Flag</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
