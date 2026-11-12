import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const CATEGORIES = ['Textbooks', 'Electronics', 'Dorm', 'Services', 'Clothing', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
const STATUSES = ['active', 'reserved', 'sold'];

export default function EditListing() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        price: '',
        category: 'Textbooks',
        condition: 'Good',
        status: 'active',
        description: '',
    });
    const [existingImages, setExistingImages] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [newPreviews, setNewPreviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // 页面加载时拉取该商品的现有数据并回填表单
    useEffect(() => {
        const fetchListing = async () => {
            try {
                const res = await fetch(`/api/listings/${id}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Listing not found');

                setFormData({
                    title: data.title,
                    price: data.price,
                    category: data.category,
                    condition: data.condition,
                    status: data.status,
                    description: data.description,
                });
                setExistingImages(data.images || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchListing();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        if (existingImages.length + newFiles.length + selected.length > 5) {
            setError('Maximum 5 images allowed per listing.');
            return;
        }
        setError('');
        setNewFiles([...newFiles, ...selected]);
        setNewPreviews([...newPreviews, ...selected.map((f) => URL.createObjectURL(f))]);
    };

    const removeNewImage = (index) => {
        URL.revokeObjectURL(newPreviews[index]);
        setNewFiles(newFiles.filter((_, i) => i !== index));
        setNewPreviews(newPreviews.filter((_, i) => i !== index));
    };

    const removeExistingImage = (imgId) => {
        setExistingImages(existingImages.filter((img) => img._id !== imgId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('price', formData.price);
            data.append('category', formData.category);
            data.append('condition', formData.condition);
            data.append('status', formData.status);
            data.append('description', formData.description);
            data.append('keepImageIds', JSON.stringify(existingImages.map((img) => img._id)));

            newFiles.forEach((file) => {
                data.append('images', file);
            });

            const res = await fetch(`/api/listings/${id}`, {
                method: 'PUT',
                body: data,
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Failed to update listing');

            setSuccess(true);
            setTimeout(() => navigate('/my-listings'), 1000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading listing details...</span>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-6 py-10">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Listing</h1>

                {error && (
                    <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-6 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Listing updated! Redirecting...</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                        <input
                            type="text"
                            name="title"
                            required
                            maxLength={100}
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price (RM)</label>
                            <input
                                type="number"
                                name="price"
                                required
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Condition</label>
                            <select
                                name="condition"
                                value={formData.condition}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                            >
                                {CONDITIONS.map((cond) => (
                                    <option key={cond} value={cond}>{cond}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm bg-white capitalize"
                            >
                                {STATUSES.map((st) => (
                                    <option key={st} value={st}>{st}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                        <textarea
                            name="description"
                            required
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    {/* 已有图片展示 */}
                    {existingImages.length > 0 && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Current Photos</label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                {existingImages.map((img) => (
                                    <div key={img._id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                                        <img src={img.imageUrl} alt="Existing" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(img._id)}
                                            className="absolute top-1 right-1 bg-slate-900/70 text-white p-1 rounded-full hover:bg-red-600 transition"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 追加新图片 */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Add More Photos</label>
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-5 cursor-pointer hover:border-blue-500 transition">
                            <Upload className="w-6 h-6 text-slate-400 mb-1" />
                            <span className="text-sm text-slate-600">Select additional images</span>
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>

                        {newPreviews.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
                                {newPreviews.map((src, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                                        <img src={src} alt="New preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeNewImage(idx)}
                                            className="absolute top-1 right-1 bg-slate-900/70 text-white p-1 rounded-full hover:bg-red-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/my-listings')}
                            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-lg"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}