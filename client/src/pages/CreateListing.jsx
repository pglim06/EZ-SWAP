import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const CATEGORIES = ['Textbooks', 'Electronics', 'Dorm', 'Services', 'Clothing', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

export default function CreateListing() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        price: '',
        category: 'Textbooks',
        condition: 'Good',
        description: '',
    });
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 5) {
            setError('You can upload a maximum of 5 images.');
            return;
        }
        setError('');

        const newFiles = [...files, ...selectedFiles];
        setFiles(newFiles);

        const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeImage = (index) => {
        URL.revokeObjectURL(previews[index]); // 释放内存中的临时预览 URL
        setFiles(files.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // 包含文件上传时，必须使用 FormData（multipart/form-data），不能用 JSON
            const data = new FormData();
            data.append('title', formData.title);
            data.append('price', formData.price);
            data.append('category', formData.category);
            data.append('condition', formData.condition);
            data.append('description', formData.description);

            // TODO: 等 T07 (User Auth) 合并后，从登录态读取真实 user._id
            data.append('sellerId', '650000000000000000000001');

            files.forEach((file) => {
                data.append('images', file);
            });

            const response = await fetch('/api/listings', {
                method: 'POST',
                body: data,
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to create listing');
            }

            setSuccess(true);
            setTimeout(() => navigate('/browse'), 1200);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-6 py-10">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Post a Free Ad</h1>
                <p className="text-sm text-slate-500 mb-6">
                    List your item for fellow UTM students to buy or swap.
                </p>

                {error && (
                    <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-6 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Listing posted successfully! Redirecting...</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 商品标题 */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            maxLength={100}
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Engineering Mathematics Textbook (3rd Ed)"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    {/* 价格、分类与成色 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Price (RM) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="price"
                                required
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Condition <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="condition"
                                value={formData.condition}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                            >
                                {CONDITIONS.map((cond) => (
                                    <option key={cond} value={cond}>{cond}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 商品描述 */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            required
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe the item condition, pickup location on campus (e.g., KTHO / Arked Meranti), etc."
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    {/* 图片上传与预览 */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Photos (Max 5)
                        </label>

                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50/40 transition">
                            <Upload className="w-7 h-7 text-slate-400 mb-2" />
                            <span className="text-sm font-medium text-slate-600">
                                Click to select images (JPEG, PNG, WEBP)
                            </span>
                            <span className="text-xs text-slate-400 mt-1">Up to 5MB per image</span>
                            <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>

                        {previews.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                                {previews.map((src, idx) => (
                                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                                        <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-slate-900/70 text-white p-1 rounded-full hover:bg-red-600 transition"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 提交按钮 */}
                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/browse')}
                            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-xs transition"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSubmitting ? 'Uploading & Posting...' : 'Publish Listing'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}