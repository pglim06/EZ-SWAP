import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MakeOfferModal from '../components/MakeOfferModal';
import ServiceComments from '../components/ServiceComments';
import PriceInsightCard from '../components/PriceInsightCard';
import AiPhotoAnalysisCard from '../components/AiPhotoAnalysisCard';
import { FALLBACK_ITEMS } from './Browse';
import { recordView, fetchSimilarListings } from '../utils/viewHistory';
import {
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Star,
    MessageCircle,
    Tag,
    Clock,
    ShieldCheck,
    Pencil,
    Trash2,
    Loader2,
    X,
    Lock,
    Sparkles,
    Eye,
    Heart,
} from 'lucide-react';

export default function ListingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [listing, setListing] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [similarListings, setSimilarListings] = useState([]);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);
    const [bookmarkMessage, setBookmarkMessage] = useState('');
    const [bookmarkError, setBookmarkError] = useState(false);

    const { user } = useAuth();
    const currentUserId = user?._id || null;

    useEffect(() => {
        const fetchListing = async () => {
            try {
                setLoading(true);
                setError('');

                const res = await fetch(`/api/listings/${id}`);
                const data = await res.json();
                if (!res.ok) {
                    const fallback = FALLBACK_ITEMS.find((it) => it._id === id || it.id === id);
                    if (fallback) {
                        setListing(fallback);
                        return;
                    }
                    throw new Error(data.message || 'Listing not found');
                }
                const item = data.listing || data;
                setListing(item);

                // T17: Record student view event in background
                recordView(id, currentUserId);
            } catch (err) {
                // If network/database error, check demo items as fallback
                const fallback = FALLBACK_ITEMS.find((it) => it._id === id || it.id === id);
                if (fallback) {
                    setListing(fallback);
                } else {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        const loadSimilar = async () => {
            const items = await fetchSimilarListings(id, 4);
            setSimilarListings(items);
        };

        if (id) {
            fetchListing();
            loadSimilar();

            if (currentUserId) {
                fetch(`/api/bookmarks/check/${id}?userId=${currentUserId}`, { credentials: 'include' })
                    .then((res) => (res.ok ? res.json() : null))
                    .then((data) => {
                        if (data) setIsBookmarked(!!data.isBookmarked);
                    })
                    .catch(() => {});
            }
        }
    }, [id, currentUserId]);

    const handleToggleBookmark = async () => {
        if (!currentUserId) {
            setShowAuthModal(true);
            return;
        }
        const previous = isBookmarked;
        setIsBookmarked(!previous);
        setBookmarkMessage('');
        setBookmarkError(false);

        try {
            setBookmarkLoading(true);
            const res = await fetch('/api/bookmarks/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ listingId: id, userId: currentUserId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Could not update wishlist');
            setIsBookmarked(data.bookmarked);
            setBookmarkMessage(data.bookmarked ? 'Saved to your wishlist' : 'Removed from your wishlist');
        } catch (err) {
            setIsBookmarked(previous);
            setBookmarkError(true);
            setBookmarkMessage(err.message || 'Could not update wishlist');
        } finally {
            setBookmarkLoading(false);
        }
    };

    // 拦截 Guest 操作
    const handleActionClick = (actionName) => {
        if (!currentUserId) {
            setShowAuthModal(true);
            return;
        }

        if (actionName === 'offer') {
            setShowOfferModal(true);
        } else if (actionName === 'chat') {
            navigate(`/messages?listingId=${id}`);
        }
    };

    // 卖家删除商品处理
    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to remove this listing?')) return;

        try {
            const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to remove listing');
            navigate('/my-listings');
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Loading listing details...</span>
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="max-w-3xl mx-auto px-6 py-16 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Item Not Found</h2>
                <p className="text-sm text-slate-500 mb-6">{error || 'This listing might have been removed or sold.'}</p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Marketplace
                </Link>
            </div>
        );
    }

    const seller = typeof listing.sellerId === 'object' && listing.sellerId !== null
        ? listing.sellerId
        : { _id: listing.sellerId, name: listing.seller || 'Campus Seller' };
    const isOwner = currentUserId && (seller._id === currentUserId || listing.sellerId === currentUserId);
    const rawImages = listing.images && listing.images.length > 0
        ? listing.images.map((img) => (typeof img === 'string' ? img : img?.imageUrl || '')).filter(Boolean)
        : [];
    const images = rawImages.length > 0
        ? rawImages
        : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=60'];

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {/* 返回按钮 */}
            <div className="mb-6">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Marketplace
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 左侧：画廊与详情 */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        <div className="aspect-4/3 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                            <img
                                src={images[selectedImageIndex]}
                                alt={listing.title}
                                className="w-full h-full object-cover transition-all duration-200"
                            />
                        </div>

                        {images.length > 1 && (
                            <div className="p-4 flex gap-3 overflow-x-auto border-t border-slate-100">
                                {images.map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${selectedImageIndex === idx
                                            ? 'border-blue-600 scale-105 shadow-xs'
                                            : 'border-transparent opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Item Description</h2>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                            {listing.description || 'No additional description provided by the seller.'}
                        </p>
                    </div>

                    <AiPhotoAnalysisCard
                        listingId={listing._id || id}
                        imageUrl={images[selectedImageIndex]}
                        title={listing.title}
                        category={listing.category}
                        condition={listing.condition}
                        price={listing.price}
                    />

                    <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 flex items-start gap-3.5 text-blue-900">
                        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold">Campus Safety Reminder</h3>
                            <p className="text-xs text-blue-700/90 mt-1 leading-normal">
                                Always meet in well-lit public campus locations (e.g. UTM Library, Student Union, Arked Meranti). Inspect the item thoroughly before making final payment.
                            </p>
                        </div>
                    </div>

                    {listing.category === 'Services' && (
                        <ServiceComments
                            listingId={id}
                            currentUserId={currentUserId}
                            onRequireAuth={() => setShowAuthModal(true)}
                        />
                    )}
                </div>

                {/* 右侧：价格、行动栏与卖家卡片 */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1">
                                <Tag className="w-3 h-3" /> {listing.category}
                            </span>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                                Condition: {listing.condition === 'New' ? 'New' : 'Used'}
                            </span>
                            {listing.status === 'reserved' && (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    Reserved
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl font-black text-slate-900 leading-snug mb-3">
                            {listing.title}
                        </h1>

                        <div className="mb-4">
                            <span className="text-xs text-slate-400 block mb-0.5">Price</span>
                            <span className="text-3xl font-black text-blue-600">RM {listing.price}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 pb-6 border-b border-slate-100">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Posted on {new Date(listing.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                            {typeof listing.viewsCount === 'number' && (
                                <div className="flex items-center gap-1 text-slate-500 font-medium">
                                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{listing.viewsCount} views</span>
                                </div>
                            )}
                        </div>

                        {listing.tags && listing.tags.length > 0 && (
                            <div className="pt-3 pb-2 flex flex-wrap gap-1.5">
                                {listing.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="pt-6 space-y-3">
                            {!isOwner && (
                                <button
                                    onClick={handleToggleBookmark}
                                    disabled={bookmarkLoading}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition text-sm font-semibold cursor-pointer ${
                                        isBookmarked
                                            ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                                    {isBookmarked ? 'Saved in Wishlist' : 'Save to Wishlist'}
                                </button>
                            )}
                            {bookmarkMessage && (
                                <p className={`text-[11px] font-medium text-center ${bookmarkError ? 'text-red-600' : 'text-rose-600'}`}>
                                    {bookmarkMessage}
                                </p>
                            )}

                            {isOwner ? (
                                <div className="space-y-2.5">
                                    <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg font-medium">
                                        You are the author of this listing.
                                    </div>
                                    <Link
                                        to={`/edit-listing/${listing._id}`}
                                        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition text-sm shadow-xs"
                                    >
                                        <Pencil className="w-4 h-4" /> Edit Listing
                                    </Link>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-xl transition text-sm cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4" /> Remove Listing
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {listing.status === 'reserved' ? (
                                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-semibold text-center">
                                            🤝 Deal Agreed! Handover is currently being scheduled.
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleActionClick('offer')}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-xs transition text-sm flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            Make Offer
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleActionClick('chat')}
                                        className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <MessageCircle className="w-4 h-4 text-slate-500" /> Chat with Seller
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 价格区间洞察卡片 */}
                    {listing.priceInsight && (
                        <PriceInsightCard priceInsight={listing.priceInsight} />
                    )}

                    {/* 卖家信誉卡片 */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                            Seller Information
                        </h3>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-black text-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                                {seller.profilePictureUrl ? (
                                    <img
                                        src={seller.profilePictureUrl}
                                        alt={seller.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    (seller.name || 'W').charAt(0).toUpperCase()
                                )}
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                                    {seller.name || 'Campus Seller'}
                                </h4>

                                <div className="mt-1 flex items-center gap-2">
                                    {seller.verificationStatus === 'verified' ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                                            Unverified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between mb-4 text-xs">
                            <span className="text-slate-500 font-medium">Reputation</span>
                            <div className="flex items-center gap-1 font-bold text-slate-800">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{seller.averageRating ? seller.averageRating.toFixed(1) : '5.0'}</span>
                                <span className="text-slate-400 font-normal">
                                    ({seller.ratingsCount || 0} reviews)
                                </span>
                            </div>
                        </div>

                        {seller._id && (
                            <Link
                                to={`/profile/${seller._id}`}
                                className="block text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-2 rounded-lg hover:bg-blue-50 transition"
                            >
                                View Seller Profile →
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* T17: Similar Items / AI Recommendations */}
            {similarListings && similarListings.length > 0 && (
                <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                                <Sparkles className="w-4 h-4" />
                            </span>
                            <h2 className="text-base font-bold text-slate-900">Similar Items You Might Like</h2>
                            <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                AI Content Match
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {similarListings.map((item) => (
                            <Link
                                key={item._id || item.id}
                                to={`/listings/${item._id || item.id}`}
                                className="group border border-slate-200 hover:border-blue-400 rounded-xl overflow-hidden p-3 hover:shadow-md transition flex flex-col justify-between"
                            >
                                <div>
                                    <div className="aspect-4/3 bg-slate-100 rounded-lg overflow-hidden mb-2 relative">
                                        <img
                                            src={item.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60'}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        {item.similarityScore && (
                                            <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                <Sparkles className="w-2.5 h-2.5" /> {item.similarityScore}% Match
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-blue-600 font-semibold mb-0.5">{item.category}</div>
                                    <h3 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition">
                                        {item.title}
                                    </h3>
                                    {item.matchReason && (
                                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">
                                            {item.matchReason}
                                        </p>
                                    )}
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-black text-blue-600">RM {item.price}</span>
                                    <span className="text-[10px] text-slate-400">{item.condition}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Guest 弹窗 */}
            {showAuthModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
                        <button
                            onClick={() => setShowAuthModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-6 h-6" />
                        </div>

                        <div className="text-center mb-6">
                            <h3 className="text-lg font-black text-slate-900">Account Required</h3>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                You need to be registered and signed in to make offers or chat with sellers on EZ Swap UTM.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Link
                                to="/login"
                                className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition shadow-xs"
                            >
                                Register or Sign In
                            </Link>
                            <button
                                onClick={() => setShowAuthModal(false)}
                                className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700 py-2.5 transition"
                            >
                                Continue Browsing as Guest
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* T12: Make Offer 模态框 */}
            <MakeOfferModal
                isOpen={showOfferModal}
                onClose={() => setShowOfferModal(false)}
                listing={listing}
                currentUser={user}
                onOfferSuccess={(order) => {
                    setShowOfferModal(false);
                    navigate(`/messages?listingId=${id}`);
                }}
            />
        </div>
    );
}