import { useState } from 'react';
import { X, Tag, Handshake, Truck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function MakeOfferModal({ isOpen, onClose, listing, currentUser, onOfferSuccess }) {
    if (!isOpen || !listing) return null;

    const originalPrice = Number(listing.price) || 0;
    const [offeredPrice, setOfferedPrice] = useState(originalPrice);
    const [transactionMethod, setTransactionMethod] = useState('meetup');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // 快捷计算折扣价格
    const handleQuickPrice = (percentage) => {
        const discounted = Math.round(originalPrice * percentage);
        setOfferedPrice(discounted);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (Number(offeredPrice) <= 0) {
            setError('Please enter a valid offer price');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    buyerId: currentUser?._id,
                    listingId: listing._id,
                    offeredPrice: Number(offeredPrice),
                    transactionMethod,
                    notes,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to submit offer');
            }

            setSuccess(true);
            if (onOfferSuccess) {
                onOfferSuccess(data);
            }

            // 1.5 秒后自动关闭弹窗
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1500);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative border border-slate-100 max-h-[90dvh] overflow-y-auto">
                {/* 关闭按钮 */}
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* 标题 */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Tag className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Make an Offer</h3>
                        <p className="text-xs text-slate-500">Propose your price and handover preferences</p>
                    </div>
                </div>

                {/* 商品简略信息卡片 */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-3 mb-5">
                    {listing.images && listing.images.length > 0 ? (
                        <img
                            src={listing.images[0].imageUrl}
                            alt={listing.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 text-slate-400 text-xs font-bold">
                            No Img
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">{listing.title}</h4>
                        <p className="text-xs text-slate-500">
                            Listing Price: <span className="font-bold text-slate-700">RM {originalPrice}</span>
                        </p>
                    </div>
                </div>

                {/* 成功状态 */}
                {success ? (
                    <div className="py-8 text-center space-y-2">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <h4 className="text-base font-bold text-slate-900">Offer Sent!</h4>
                        <p className="text-xs text-slate-500">
                            The seller will be notified and can accept, counter, or decline.
                        </p>
                    </div>
                ) : (
                    /* 表单 */
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* 出价金额 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Your Offer Price (RM)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                                    RM
                                </span>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    required
                                    value={offeredPrice}
                                    onChange={(e) => setOfferedPrice(e.target.value)}
                                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder="Enter price"
                                />
                            </div>

                            {/* 快捷报价按钮 */}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => handleQuickPrice(1)}
                                    className="text-[11px] font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                                >
                                    Full Price (RM {originalPrice})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuickPrice(0.9)}
                                    className="text-[11px] font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                                >
                                    -10% (RM {Math.round(originalPrice * 0.9)})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleQuickPrice(0.8)}
                                    className="text-[11px] font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                                >
                                    -20% (RM {Math.round(originalPrice * 0.8)})
                                </button>
                            </div>
                        </div>

                        {/* 交付方式 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Preferred Handover Method
                            </label>
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setTransactionMethod('meetup')}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${transactionMethod === 'meetup'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                        }`}
                                >
                                    <Handshake className="w-4 h-4" /> Campus Meetup
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTransactionMethod('delivery')}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${transactionMethod === 'delivery'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                        }`}
                                >
                                    <Truck className="w-4 h-4" /> Delivery / Post
                                </button>
                            </div>
                        </div>

                        {/* 留言或建议地点 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Notes & Meetup Preference (Optional)
                            </label>
                            <textarea
                                rows="2"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={
                                    transactionMethod === 'meetup'
                                        ? 'e.g. Can meet at UTM PSZ Library or Arked Meranti on weekdays...'
                                        : 'e.g. Delivery address or mailing details...'
                                }
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                            ></textarea>
                        </div>

                        {/* 提交按钮 */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending Offer...
                                    </>
                                ) : (
                                    'Send Offer to Seller'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}