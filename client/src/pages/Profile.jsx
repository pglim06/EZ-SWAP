import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    CheckCircle2,
    Star,
    Calendar,
    School,
    Package,
    Pencil,
    Save,
    Loader2,
    AlertCircle,
    ArrowLeft,
    Tag,
    Clock,
    Camera,
    Upload,
    X
} from 'lucide-react';

const CURRENT_USER_ID = '650000000000000000000001';

export default function Profile() {
    const { id } = useParams();
    const profileUserId = id || CURRENT_USER_ID;

    const [user, setUser] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'edit'

    // 编辑表单 State
    const [editForm, setEditForm] = useState({
        name: '',
        universityId: '',
        bio: ''
    });
    // 本地选择的头像文件与预览 URL
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const isOwner = CURRENT_USER_ID && profileUserId === CURRENT_USER_ID;

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                setError('');

                // 1. 获取用户信息
                const userRes = await fetch(`/api/users/${profileUserId}`);
                const userData = await userRes.json();
                if (!userRes.ok) throw new Error(userData.message || 'User not found');
                setUser(userData);
                setEditForm({
                    name: userData.name || '',
                    universityId: userData.universityId || '',
                    bio: userData.bio || ''
                });

                // 2. 获取该用户的全部活跃商品
                const listingsRes = await fetch(`/api/listings?sellerId=${profileUserId}`);
                const listingsData = await listingsRes.json();
                if (listingsRes.ok) {
                    setListings(listingsData);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (profileUserId) {
            fetchProfileData();
        }
    }, [profileUserId]);

    // 处理用户选择本地图片
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please upload a valid image file (JPEG, PNG, WEBP).');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('File size exceeds 5MB limit.');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    // 取消选择的新图片
    const handleRemoveSelectedAvatar = () => {
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarFile(null);
        setAvatarPreview('');
    };

    // 提交保存个人资料更新 (使用 FormData 支持图片二进制流上传)
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            setSaveSuccess(false);

            const formData = new FormData();
            formData.append('name', editForm.name);
            formData.append('universityId', editForm.universityId);
            formData.append('bio', editForm.bio);

            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            // 发送 PUT 请求 (注意：当使用 FormData 时不要设置 Content-Type，浏览器会自动设置带 boundary 的 header)
            const res = await fetch(`/api/users/${profileUserId}`, {
                method: 'PUT',
                body: formData
            });

            const updatedData = await res.json();
            if (!res.ok) throw new Error(updatedData.message || 'Failed to update profile');

            setUser(updatedData);
            handleRemoveSelectedAvatar(); // 释放临时内存
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Loading profile...</span>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-16 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">User Not Found</h2>
                <p className="text-sm text-slate-500 mb-6">{error || 'This user profile does not exist.'}</p>
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
                    <ArrowLeft className="w-4 h-4" /> Return to Marketplace
                </Link>
            </div>
        );
    }

    // 展示用的头像（若有新选中的预览则优先展示预览，否则展示数据库已有头像）
    const displayAvatar = avatarPreview || user.profilePictureUrl;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-6">
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition">
                    <ArrowLeft className="w-4 h-4" /> Back to Marketplace
                </Link>
            </div>

            {/* 用户个人头部卡片 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* 头像 */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-blue-100 text-blue-700 font-black text-3xl flex items-center justify-center overflow-hidden shrink-0 border-4 border-white shadow-sm relative group">
                        {displayAvatar ? (
                            <img src={displayAvatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            (user.name || 'W').charAt(0).toUpperCase()
                        )}
                    </div>

                    {/* 基本信息 */}
                    <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                                    {user.name}
                                    {user.verificationStatus === 'verified' ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">
                                            Unverified
                                        </span>
                                    )}
                                </h1>
                                <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                            </div>

                            {isOwner && (
                                <button
                                    onClick={() => {
                                        setActiveTab(activeTab === 'edit' ? 'listings' : 'edit');
                                        handleRemoveSelectedAvatar();
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition cursor-pointer self-center sm:self-auto"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    {activeTab === 'edit' ? 'View Listings' : 'Edit Profile'}
                                </button>
                            )}
                        </div>

                        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed pt-1">
                            {user.bio || 'This student has not written a bio yet.'}
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-500">
                            {user.universityId && (
                                <span className="flex items-center gap-1.5">
                                    <School className="w-4 h-4 text-slate-400" /> Matric ID: {user.universityId}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-slate-400" /> Joined {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 评分与在售统计 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-100 mt-6 pt-6 text-center">
                    <div className="p-3 bg-slate-50 rounded-2xl">
                        <div className="flex items-center justify-center gap-1 text-base font-bold text-slate-900">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span>{user.averageRating ? user.averageRating.toFixed(1) : '5.0'}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Reputation Rating</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl">
                        <div className="text-base font-bold text-slate-900">{user.ratingsCount || 0}</div>
                        <span className="text-[11px] text-slate-400">Reviews Received</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl col-span-2 sm:col-span-1">
                        <div className="text-base font-bold text-blue-600">{listings.length}</div>
                        <span className="text-[11px] text-slate-400">Active Listings</span>
                    </div>
                </div>
            </div>

            {/* 标签内容区域 */}
            {activeTab === 'edit' && isOwner ? (
                /* 编辑资料卡片 */
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Pencil className="w-5 h-5 text-blue-600" /> Edit Personal Information
                    </h2>

                    {saveSuccess && (
                        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Profile updated successfully with Cloudinary!
                        </div>
                    )}

                    <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
                        {/* 真正的图片文件上传组件 */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-2">
                                Profile Picture (Upload from Computer)
                            </label>

                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                    {displayAvatar ? (
                                        <img src={displayAvatar} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="w-6 h-6 text-slate-400" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition">
                                        <Upload className="w-4 h-4 text-blue-600" />
                                        <span>Choose New Photo</span>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>

                                    {avatarFile && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                            <span className="font-medium text-slate-700 truncate max-w-[200px]">{avatarFile.name}</span>
                                            <button
                                                type="button"
                                                onClick={handleRemoveSelectedAvatar}
                                                className="text-red-500 hover:text-red-700 p-0.5"
                                                title="Cancel file"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        JPEG, PNG or WEBP (Max 5MB). Automatically hosted on Cloudinary.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">University Matric ID</label>
                            <input
                                type="text"
                                placeholder="e.g. A25CS0390"
                                value={editForm.universityId}
                                onChange={(e) => setEditForm({ ...editForm, universityId: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bio (About Me)</label>
                            <textarea
                                rows={4}
                                maxLength={500}
                                placeholder="Tell fellow campus peers about your faculty, hobbies, or trading preferences..."
                                value={editForm.bio}
                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
                            />
                            <span className="text-[11px] text-slate-400 block text-right mt-1">
                                {editForm.bio.length}/500 characters
                            </span>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isSaving ? 'Uploading to Cloudinary...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('listings');
                                    handleRemoveSelectedAvatar();
                                }}
                                className="text-slate-600 hover:bg-slate-100 text-sm font-medium px-4 py-2.5 rounded-xl transition cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* 在售商品列表 */
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            Active Listings by {user.name}
                            <span className="text-xs font-normal text-slate-400">({listings.length})</span>
                        </h2>
                    </div>

                    {listings.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">No active listings available from this seller right now.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {listings.map((item) => {
                                const coverImg = item.images && item.images.length > 0
                                    ? item.images[0].imageUrl
                                    : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60';

                                return (
                                    <Link
                                        key={item._id}
                                        to={`/listings/${item._id}`}
                                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group"
                                    >
                                        <div className="aspect-video bg-slate-100 overflow-hidden relative">
                                            <img
                                                src={coverImg}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                            />
                                            <span className="absolute bottom-2 left-2 text-[10px] font-semibold bg-slate-900/75 backdrop-blur-xs text-white px-2 py-0.5 rounded-md">
                                                {item.condition}
                                            </span>
                                        </div>

                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold mb-1">
                                                    <Tag className="w-3 h-3" /> {item.category}
                                                </div>
                                                <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-blue-600 transition mb-2">
                                                    {item.title}
                                                </h3>
                                            </div>

                                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-base font-black text-blue-600">RM {item.price}</span>
                                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}