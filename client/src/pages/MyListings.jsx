import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, PlusCircle, PackageOpen, Loader2 } from 'lucide-react';

// 临时测试用 sellerId，需与 CreateListing.jsx 保持一致（等 T07 合并后替换为登录用户 ID）
const TEST_SELLER_ID = '650000000000000000000001';

export default function MyListings() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchMyListings = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/listings?sellerId=${TEST_SELLER_ID}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to load listings');
            setListings(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyListings();
    }, []);

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Are you sure you want to remove "${title}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/listings/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to delete listing');

            // 从当前页面列表中移除已下架的商品
            setListings((prev) => prev.filter((item) => item._id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading your listings...</span>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
                    <p className="text-sm text-slate-500">Manage, edit, or remove your active ads.</p>
                </div>
                <Link
                    to="/create-listing"
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                    <PlusCircle className="w-4 h-4" /> Post New Ad
                </Link>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {listings.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                    <PackageOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">You haven't posted any listings yet.</p>
                    <Link
                        to="/create-listing"
                        className="inline-block mt-4 text-sm text-blue-600 font-semibold hover:underline"
                    >
                        Create your first listing →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((item) => (
                        <div
                            key={item._id}
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col"
                        >
                            <div className="aspect-video bg-slate-100 relative">
                                {item.images && item.images.length > 0 ? (
                                    <img
                                        src={item.images[0].imageUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                        No Image
                                    </div>
                                )}
                                <span className="absolute top-2.5 right-2.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-slate-700 border border-slate-200 capitalize">
                                    {item.status}
                                </span>
                            </div>

                            <div className="p-4 flex-1 flex flex-col">
                                <div className="text-xs font-semibold text-blue-600 mb-1">
                                    {item.category} · {item.condition}
                                </div>
                                <h2 className="font-bold text-slate-900 line-clamp-1 mb-1">{item.title}</h2>
                                <p className="text-lg font-extrabold text-slate-800 mb-4">
                                    RM {Number(item.price).toFixed(2)}
                                </p>

                                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <Link
                                        to={`/edit-listing/${item._id}`}
                                        className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 rounded-lg transition"
                                    >
                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(item._id, item.title)}
                                        className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 py-2 rounded-lg transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}