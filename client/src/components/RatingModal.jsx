import { useState } from 'react';
import { Star, X, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';

/**
 * T15: RatingModal
 * Props:
 *   transaction   — the completed Transaction object
 *   currentUserId — logged-in user's _id
 *   otherUser     — { name, profilePictureUrl } of the person being rated
 *   onClose()     — called when the modal is dismissed
 *   onSubmitted() — called after a successful submission (to refresh parent state)
 */
export default function RatingModal({ transaction, currentUserId, otherUser, onClose, onSubmitted }) {
  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [comment, setComment]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [submitted, setSubmitted] = useState(false);

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Please select a star rating before submitting.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          transactionId: transaction._id,
          userId: currentUserId,
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit review');
      setSubmitted(true);
      if (onSubmitted) setTimeout(onSubmitted, 1600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayStar = hovered || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90dvh] overflow-y-auto">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          /* ── Success state ── */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Review Submitted!</h3>
            <p className="text-sm text-slate-500">
              Thank you for rating {otherUser?.name || 'the other party'}. Your feedback helps keep the
              campus marketplace trustworthy. ⭐
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <Star className="w-8 h-8 text-amber-500 fill-amber-400" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Rate Your Experience</h3>
              <p className="text-xs text-slate-500 mt-1">
                How was your transaction with{' '}
                <span className="font-semibold text-slate-700">{otherUser?.name || 'the other party'}</span>?
              </p>
              {transaction?.transactionCode && (
                <span className="inline-block mt-2 text-[11px] font-semibold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">
                  Txn: {transaction.transactionCode}
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Picker */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-10 h-10 transition-colors ${
                          star <= displayStar
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200 fill-slate-100'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {displayStar > 0 && (
                  <span className="text-sm font-bold text-amber-600">
                    {ratingLabels[displayStar]}
                  </span>
                )}
              </div>

              {/* Comment box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  Comment (optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe your experience — was the item as described? Was the other party responsive and punctual?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
                />
                <span className="text-[11px] text-slate-400 block text-right mt-0.5">
                  {comment.length}/1000
                </span>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading || !rating}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-sm py-3 rounded-xl transition shadow-sm cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 fill-white" />
                      Submit Review
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 text-slate-600 hover:bg-slate-100 font-medium text-sm rounded-xl transition cursor-pointer"
                >
                  Skip
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
