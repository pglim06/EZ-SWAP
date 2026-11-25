import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, MessageSquare, Send } from 'lucide-react';

export default function ServiceComments({ listingId, currentUserId, onRequireAuth }) {
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        const loadComments = async () => {
            try {
                const res = await fetch(`/api/comments/${listingId}`, { credentials: 'include' });
                const data = await res.json();
                if (active && res.ok) setComments(data.comments || []);
            } catch {
                if (active) setError('Could not load comments.');
            } finally {
                if (active) setLoading(false);
            }
        };
        loadComments();
        return () => { active = false; };
    }, [listingId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUserId) {
            onRequireAuth?.();
            return;
        }
        const text = content.trim();
        if (!text) return;

        try {
            setSubmitting(true);
            setError('');
            const res = await fetch(`/api/comments/${listingId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content: text }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to post comment');
            setComments((prev) => [...prev, data.comment]);
            setContent('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-5">
                <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                    <MessageSquare className="w-4 h-4" />
                </span>
                <h2 className="text-base font-bold text-slate-900">Service Comments</h2>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    {comments.length}
                </span>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Loading comments...
                </div>
            ) : comments.length > 0 ? (
                <div className="space-y-3 mb-5">
                    {comments.map((comment) => {
                        const author = comment.userId || {};
                        return (
                            <div key={comment._id} className="flex gap-3 border border-slate-100 rounded-xl p-3">
                                {author.profilePictureUrl ? (
                                    <img src={author.profilePictureUrl} alt={author.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                ) : (
                                    <span className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">
                                        {(author.name || '?').charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-bold text-slate-800 truncate">{author.name || 'Campus Student'}</span>
                                        <span className="text-[10px] text-slate-400 shrink-0">
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mt-1 break-words">
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-xs text-slate-500 mb-5">No comments yet. Ask the seller about this service.</p>
            )}

            {error && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
                </div>
            )}

            {currentUserId ? (
                <form onSubmit={handleSubmit} className="space-y-2">
                    <textarea
                        rows={3}
                        maxLength={1000}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share a question or experience about this service..."
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">{content.length}/1000</span>
                        <button
                            type="submit"
                            disabled={submitting || !content.trim()}
                            className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer disabled:cursor-not-allowed"
                        >
                            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            {submitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    type="button"
                    onClick={() => onRequireAuth?.()}
                    className="w-full border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold py-2.5 rounded-xl transition cursor-pointer"
                >
                    Sign in to leave a comment
                </button>
            )}
        </div>
    );
}
