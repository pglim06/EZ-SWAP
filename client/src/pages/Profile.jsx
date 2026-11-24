import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    X,
    Trash2,
    AlertTriangle,
    ShieldAlert
} from 'lucide-react';

export default function Profile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, loading: authLoading, deleteAccount } = useAuth();

    const profileUserId = id || currentUser?._id;
    const isOwner = Boolean(currentUser?._id && profileUserId && String(profileUserId) === String(currentUser._id));

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

    // 账号注销 (Delete Account) 模态框与双重确认 State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteStep, setDeleteStep] = useState(1); // 1 = First Warning, 2 = Final Typing & Checkbox
    const [deleteInputText, setDeleteInputText] = useState('');
    const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (authLoading) return;

        const fetchProfileData = async () => {
            if (!profileUserId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // 1. 获取用户信息
                const userRes = await fetch(`/api/users/${profileUserId}`);
                const userData = await userRes.json();
                if (!userRes.ok) throw new Error(userData.message || 'Failed to fetch user profile');
                const userProfile = userData.user || userData;
                setUser(userProfile);

                // 回填编辑表单初始值
                setEditForm({
                    name: userProfile.name || '',
                    universityId: userProfile.universityId || '',
                    bio: userProfile.bio || ''
                });

                // 2. 获取该用户发布的所有 Listings
                const listingsRes = await fetch(`/api/listings?sellerId=${profileUserId}&limit=50`);
                const listingsData = await listingsRes.json();
                if (listingsRes.ok) {
                    setListings(Array.isArray(listingsData) ? listingsData : (listingsData.listings || []));
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [profileUserId, authLoading]);

    // 用户选择了本地头像文件
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 校验文件类型与大小 (限制 5MB)
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file (JPEG, PNG, or WEBP).');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Avatar image size must be less than 5MB.');
            return;
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    // 移除已选中的本地新头像
    const handleRemoveSelectedAvatar = () => {
        setAvatarFile(null);
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
            setAvatarPreview('');
        }
    };

    // 提交保存个人资料修改
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            let finalAvatarUrl = user.profilePictureUrl;

            // 1. 如果用户选择了新的本地图片，先上传至 Cloudinary 存储
            if (avatarFile) {
                const formData = new FormData();
                formData.append('image', avatarFile);

                const uploadRes = await fetch('/api/upload/single', {
                    method: 'POST',
                    body: formData,
                });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.message || 'Failed to upload avatar to Cloudinary');
                finalAvatarUrl = uploadData.imageUrl;
            }

            // 2. 将更新后的数据保存至用户 profile 接口
            const updateRes = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: editForm.name,
                    universityId: editForm.universityId,
                    bio: editForm.bio,
                    profilePictureUrl: finalAvatarUrl
                })
            });
            const updateData = await updateRes.json();
            if (!updateRes.ok) throw new Error(updateData.message || 'Failed to update profile');

            // 3. 更新页面展示的 User 数据
            setUser(updateData.user);
            setSaveSuccess(true);
            handleRemoveSelectedAvatar();

            setTimeout(() => setSaveSuccess(false), 4000);
        } catch (err) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // 执行彻底删除账号
    const handleConfirmDeleteAccount = async () => {
        if (deleteInputText.trim().toUpperCase() !== 'DELETE' || !deleteAcknowledged) {
            setDeleteError('Please type DELETE and check the confirmation box.');
            return;
        }

        try {
            setIsDeleting(true);
            setDeleteError('');
            await deleteAccount();
            setShowDeleteModal(false);
            alert('Your account and all associated data have been permanently removed.');
            navigate('/login');
        } catch (err) {
            setDeleteError(err.message || 'Failed to delete account.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleOpenDeleteModal = () => {
        setDeleteStep(1);
        setDeleteInputText('');
        setDeleteAcknowledged(false);
        setDeleteError('');
        setShowDeleteModal(true);
    };

    if (loading || authLoading) {
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
                <Link to="/browse" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
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
                <Link to="/browse" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition">
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
                            (user.name || 'U').charAt(0).toUpperCase()
                        )}
                    </div>

                    {/* 基本信息 */}
                    <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                                    {user.name}
                                    {user.verificationStatus === 'verified' ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                            Verified UTM Student
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">
                                            Unverified User
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
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-blue-600" /> Edit Personal Information
                        </h2>

                        {saveSuccess && (
                            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Profile updated successfully!
                            </div>
                        )}

                        <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
                            {/* 头像上传 */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">
                                    Profile Picture
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
                                    {isSaving ? 'Saving Changes...' : 'Save Changes'}
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

                    {/* Danger Zone: Delete Account */}
                    <div className="pt-8 border-t border-slate-100">
                        <div className="bg-red-50/70 border border-red-200 rounded-2xl p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                        Danger Zone: Delete Account
                                    </h3>
                                    <p className="text-xs text-red-700 mt-1 max-w-xl leading-relaxed">
                                        Permanently delete your account. This will completely remove your personal profile, active listings, order records, and chat messages from the database.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleOpenDeleteModal}
                                    className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
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
                                                {item.condition === 'New' ? 'New' : 'Used'}
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

            {/* 双重确认注销账号弹窗 (Two-Way Confirmation Modal) */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Step 1: Initial Warning & Confirmation */}
                        {deleteStep === 1 && (
                            <div>
                                <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                                    <ShieldAlert className="w-8 h-8" />
                                </div>

                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-black text-slate-900">
                                        Are you sure you want to delete your account?
                                    </h3>
                                    <p className="text-xs text-red-600 font-bold uppercase tracking-wider mt-1">
                                        WARNING: This action is permanent and cannot be undone
                                    </p>
                                </div>

                                <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 mb-6 text-xs text-red-800 space-y-2">
                                    <p className="font-semibold">
                                        Deleting your account will completely and permanently wipe:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1 text-[11px] text-red-700">
                                        <li>Your student profile and email credentials ({user.email})</li>
                                        <li>All your active and completed marketplace listings ({listings.length} items)</li>
                                        <li>All chat conversations and messages with other students</li>
                                        <li>All order offers, meetup arrangements, and transaction histories</li>
                                        <li>Your reviews, ratings, and saved bookmarks</li>
                                    </ul>
                                </div>

                                <div className="space-y-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setDeleteStep(2)}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition text-sm shadow-xs cursor-pointer"
                                    >
                                        I Understand, Proceed to Final Confirmation →
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(false)}
                                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition text-xs cursor-pointer"
                                    >
                                        Cancel & Keep Account
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Final Confirmation with Typing & Checkbox Verification */}
                        {deleteStep === 2 && (
                            <div>
                                <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8" />
                                </div>

                                <div className="text-center mb-5">
                                    <h3 className="text-xl font-black text-slate-900">Final Confirmation</h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        To prevent accidental deletion, please complete the two-way verification below.
                                    </p>
                                </div>

                                {deleteError && (
                                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                        <span>{deleteError}</span>
                                    </div>
                                )}

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Type <span className="font-black text-red-600 font-mono">DELETE</span> to confirm:
                                        </label>
                                        <input
                                            type="text"
                                            value={deleteInputText}
                                            onChange={(e) => setDeleteInputText(e.target.value)}
                                            placeholder="DELETE"
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 uppercase tracking-widest text-center"
                                        />
                                    </div>

                                    <label className="flex items-start gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={deleteAcknowledged}
                                            onChange={(e) => setDeleteAcknowledged(e.target.checked)}
                                            className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                                        />
                                        <span className="text-xs text-slate-600 leading-snug">
                                            I confirm that I want to permanently delete my account for <strong>{user.email}</strong> and understand that all my database records will be erased forever.
                                        </span>
                                    </label>
                                </div>

                                <div className="space-y-2.5">
                                    <button
                                        type="button"
                                        onClick={handleConfirmDeleteAccount}
                                        disabled={deleteInputText.trim().toUpperCase() !== 'DELETE' || !deleteAcknowledged || isDeleting}
                                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition text-sm shadow-xs cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Erasing All Account Data...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                <span>Permanently Delete My Account</span>
                                            </>
                                        )}
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDeleteStep(1)}
                                            disabled={isDeleting}
                                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl transition text-xs"
                                        >
                                            ← Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteModal(false)}
                                            disabled={isDeleting}
                                            className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2 rounded-xl transition text-xs"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
