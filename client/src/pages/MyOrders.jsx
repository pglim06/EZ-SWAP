import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Tag,
    Handshake,
    Truck,
    Clock,
    CheckCircle2,
    XCircle,
    RotateCcw,
    AlertCircle,
    Loader2,
    MessageSquare,
    DollarSign,
    ArrowRight,
    X
} from 'lucide-react';

export default function MyOrders() {
    const { user } = useAuth();
    const storedUser = localStorage.getItem('currentUser');
    const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);

    const [activeTab, setActiveTab] = useState('received'); // 'received' (Seller) | 'sent' (Buyer)
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 还价 Modal 弹窗状态 (针对 Seller 发起 Counter-Offer)
    const [counterModalOpen, setCounterModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [counterPriceInput, setCounterPriceInput] = useState('');
    const [counterNotesInput, setCounterNotesInput] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // 获取订单列表
    const fetchOrders = async () => {
        if (!currentUser?._id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');
            const role = activeTab === 'received' ? 'seller' : 'buyer';
            const res = await fetch(`/api/orders?userId=${currentUser._id}&role=${role}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
            setOrders(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [activeTab, currentUser?._id]);

    // 1. 卖家接受报价 / 买家接受还价 (Accept)
    const handleAccept = async (orderId) => {
        if (!window.confirm('Are you sure you want to accept this offer?')) return;
        try {
            setActionLoading(true);
            const res = await fetch(`/api/orders/${orderId}/accept`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to accept offer');
            fetchOrders();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // 2. 卖家拒绝报价 (Reject)
    const handleReject = async (orderId) => {
        if (!window.confirm('Are you sure you want to reject this offer?')) return;
        try {
            setActionLoading(true);
            const res = await fetch(`/api/orders/${orderId}/reject`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to reject offer');
            fetchOrders();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // 3. 买家取消报价 (Cancel)
    const handleCancel = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this offer?')) return;
        try {
            setActionLoading(true);
            const res = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser._id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to cancel offer');
            fetchOrders();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // 4. 打开卖家还价弹窗
    const openCounterModal = (order) => {
        setSelectedOrder(order);
        setCounterPriceInput(order.listingId?.price || '');
        setCounterNotesInput('');
        setCounterModalOpen(true);
    };

    // 提交还价
    const submitCounterOffer = async (e) => {
        e.preventDefault();
        if (!selectedOrder) return;

        try {
            setActionLoading(true);
            const res = await fetch(`/api/orders/${selectedOrder._id}/counter`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser._id,
                    counterPrice: Number(counterPriceInput),
                    notes: counterNotesInput,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to submit counter offer');

            setCounterModalOpen(false);
            setSelectedOrder(null);
            fetchOrders();
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // 状态徽章渲染辅助
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> Pending Response
                    </span>
                );
            case 'countered':
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                        <RotateCcw className="w-3.5 h-3.5" /> Counter-Offered
                    </span>
                );
            case 'accepted':
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Offer Accepted
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1 rounded-full border border-red-200">
                        <XCircle className="w-3.5 h-3.5" /> Offer Declined
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
                        Cancelled
                    </span>
                );
            default:
                return null;
        }
    };

    if (!currentUser) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Sign In Required</h2>
                <p className="text-sm text-slate-500 mb-6">
                    Please sign in with your UTM account to view and manage your offers.
                </p>
                <Link
                    to="/login"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-xs"
                >
                    Sign In Now
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">
            {/* 页面头部 */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Tag className="w-6 h-6 text-blue-600" />
                    Offers & Deals
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                    Manage price negotiations, review buyer proposals, and counter-offers
                </p>
            </div>

            {/* 买卖双方标签切换 */}
            <div className="flex border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('received')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${activeTab === 'received'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Offers Received (As Seller)
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${activeTab === 'sent'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Offers Sent (As Buyer)
                </button>
            </div>

            {/* 列表渲染 */}
            {loading ? (
                <div className="py-20 flex items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-sm">Loading offers...</span>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-xs">
                    <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800 mb-1">
                        {activeTab === 'received' ? 'No incoming offers yet' : 'You haven’t made any offers yet'}
                    </h3>
                    <p className="text-xs text-slate-500 mb-6">
                        {activeTab === 'received'
                            ? 'When students make an offer on your listings, they will appear here.'
                            : 'Browse active items on campus and propose your price to sellers!'}
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-xs"
                    >
                        Browse Marketplace <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const listing = order.listingId;
                        const otherParty = activeTab === 'received' ? order.buyerId : order.sellerId;
                        const coverImg =
                            listing?.images && listing.images.length > 0
                                ? listing.images[0].imageUrl
                                : 'https://via.placeholder.com/150';

                        return (
                            <div
                                key={order._id}
                                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-sm transition"
                            >
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-slate-100">
                                    {/* 商品信息与出价 */}
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={coverImg}
                                            alt={listing?.title || 'Listing'}
                                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                                        />
                                        <div>
                                            <Link
                                                to={`/listings/${listing?._id}`}
                                                className="text-sm font-bold text-slate-900 hover:text-blue-600 transition line-clamp-1"
                                            >
                                                {listing?.title || 'Item No Longer Available'}
                                            </Link>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                <span>Listing Price: RM {listing?.price}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1 font-semibold text-blue-600">
                                                    Offered: RM {order.offeredPrice}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 状态徽章 */}
                                    <div>{renderStatusBadge(order.status)}</div>
                                </div>

                                {/* 协商详情 (交接方式、还价、留言) */}
                                <div className="py-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 rounded-xl p-3 my-3">
                                    <div>
                                        <span className="text-slate-400 block font-medium">Handover Method</span>
                                        <span className="font-semibold text-slate-700 capitalize flex items-center gap-1 mt-0.5">
                                            {order.transactionMethod === 'meetup' ? (
                                                <>
                                                    <Handshake className="w-3.5 h-3.5 text-blue-600" /> Campus Meetup
                                                </>
                                            ) : (
                                                <>
                                                    <Truck className="w-3.5 h-3.5 text-blue-600" /> Delivery
                                                </>
                                            )}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-slate-400 block font-medium">
                                            {activeTab === 'received' ? 'Buyer Name' : 'Seller Name'}
                                        </span>
                                        <span className="font-semibold text-slate-700 mt-0.5 block">
                                            {otherParty?.name || 'UTM Student'}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-slate-400 block font-medium">Last Updated</span>
                                        <span className="font-semibold text-slate-700 mt-0.5 block">
                                            {new Date(order.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* 附言与还价信息 */}
                                {(order.notes || order.counterPrice) && (
                                    <div className="mb-4 text-xs space-y-1.5 bg-blue-50/50 border border-blue-100 p-3 rounded-xl">
                                        {order.notes && (
                                            <p className="text-slate-700 flex items-start gap-1.5">
                                                <MessageSquare className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                                                <span>
                                                    <strong className="font-semibold text-slate-800">Notes:</strong>{' '}
                                                    {order.notes}
                                                </span>
                                            </p>
                                        )}
                                        {order.counterPrice && (
                                            <p className="text-indigo-900 font-semibold flex items-center gap-1.5">
                                                <RotateCcw className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                                <span>Seller Counter-Offered: <strong>RM {order.counterPrice}</strong></span>
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* 操作按键区域 */}
                                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                                    {/* 卖家视角操作 */}
                                    {activeTab === 'received' && order.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleReject(order._id)}
                                                disabled={actionLoading}
                                                className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition cursor-pointer"
                                            >
                                                Decline
                                            </button>
                                            <button
                                                onClick={() => openCounterModal(order)}
                                                disabled={actionLoading}
                                                className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer"
                                            >
                                                Counter-Offer
                                            </button>
                                            <button
                                                onClick={() => handleAccept(order._id)}
                                                disabled={actionLoading}
                                                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer"
                                            >
                                                Accept Offer (RM {order.offeredPrice})
                                            </button>
                                        </>
                                    )}

                                    {/* 买家视角操作 */}
                                    {activeTab === 'sent' && order.status === 'pending' && (
                                        <button
                                            onClick={() => handleCancel(order._id)}
                                            disabled={actionLoading}
                                            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                                        >
                                            Cancel Offer
                                        </button>
                                    )}

                                    {/* 买家回应卖家的 Counter-Offer */}
                                    {activeTab === 'sent' && order.status === 'countered' && (
                                        <>
                                            <button
                                                onClick={() => handleCancel(order._id)}
                                                disabled={actionLoading}
                                                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                                            >
                                                Decline Counter
                                            </button>
                                            <button
                                                onClick={() => handleAccept(order._id)}
                                                disabled={actionLoading}
                                                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs cursor-pointer"
                                            >
                                                Accept Counter (RM {order.counterPrice})
                                            </button>
                                        </>
                                    )}

                                    {/* 已接受状态提示 */}
                                    {order.status === 'accepted' && (
                                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                            Deal Agreed! Handover ready (T13).
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 卖家 Counter-Offer 弹窗 */}
            {counterModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
                        <button
                            onClick={() => setCounterModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <DollarSign className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Propose Counter-Offer</h3>
                                <p className="text-[11px] text-slate-500">
                                    Buyer offered: RM {selectedOrder.offeredPrice}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={submitCounterOffer} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Counter Price (RM)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={counterPriceInput}
                                    onChange={(e) => setCounterPriceInput(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Message to Buyer (Optional)
                                </label>
                                <textarea
                                    rows="2"
                                    value={counterNotesInput}
                                    onChange={(e) => setCounterNotesInput(e.target.value)}
                                    placeholder="e.g. Can do RM 75 if we meet at PSZ Library..."
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-xs"
                            >
                                Send Counter-Offer
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}