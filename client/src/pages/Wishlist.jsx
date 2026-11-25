import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  Tag,
  Star,
  Clock,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

export default function Wishlist() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/bookmarks', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load wishlist');
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchBookmarks();
    } else {
      setLoading(false);
    }
  }, [user?._id]);

  const handleRemove = async (e, listingId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setRemovingId(listingId);
      const res = await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listingId, userId: user._id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to remove from wishlist');
      }
      setBookmarks((prev) => prev.filter((b) => b.listingId?._id !== listingId));
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
        <span className="text-sm">Loading your wishlist...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            My Wishlist
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Items you have saved for later ({bookmarks.length} {bookmarks.length === 1 ? 'item' : 'items'})
          </p>
        </div>
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition w-fit"
        >
          <ShoppingBag className="w-4 h-4" /> Browse More Ads
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {bookmarks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-xs">
          <Heart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Your wishlist is empty</h3>
          <p className="text-xs text-slate-500 mb-6">
            Tap the heart icon on any listing in the marketplace to save it here.
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bm) => {
            const item = bm.listingId;
            if (!item) return null;
            const image =
              item.images && item.images.length > 0
                ? item.images[0].imageUrl
                : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60';
            const seller = item.sellerId;

            return (
              <div
                key={bm._id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="h-48 bg-slate-100 overflow-hidden relative">
                    <Link to={`/listings/${item._id}`}>
                      <img
                        src={image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </Link>
                    <button
                      onClick={(e) => handleRemove(e, item._id)}
                      disabled={removingId === item._id}
                      title="Remove from Wishlist"
                      className="absolute top-3 right-3 p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-full shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      {removingId === item._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <span className="absolute bottom-3 left-3 text-[11px] font-semibold bg-slate-900/75 backdrop-blur-xs text-white px-2 py-0.5 rounded-md">
                      {item.condition === 'New' ? 'New' : 'Used'}
                    </span>
                    {item.status !== 'active' && (
                      <span className="absolute bottom-3 right-3 text-[10px] font-bold uppercase bg-amber-500 text-white px-2 py-0.5 rounded-md">
                        {item.status}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-blue-600 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" /> {item.category}
                      </span>
                      <span className="text-amber-500 flex items-center gap-0.5 text-[11px]">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {(seller?.averageRating || 5.0).toFixed(1)}
                      </span>
                    </div>

                    <Link to={`/listings/${item._id}`}>
                      <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition">
                        {item.title}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>{seller?.name || 'Verified Student'}</span>
                      {seller?.verificationStatus === 'verified' && (
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <span className="text-lg font-black text-blue-600">RM {item.price}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(bm.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/listings/${item._id}`}
                      className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
