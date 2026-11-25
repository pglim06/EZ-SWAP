import { useEffect, useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, ClipboardCheck, RefreshCw, AlertCircle } from 'lucide-react';

export default function AiPhotoAnalysisCard({ listingId, imageUrl, title, category, condition, price }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const runAnalysis = async (targetUrl) => {
        if (!targetUrl) return;
        try {
            setLoading(true);
            setError('');

            const isFallback = !listingId || String(listingId).startsWith('sample-');
            const endpoint = isFallback
                ? '/api/listings/analyze-image'
                : `/api/listings/${listingId}/ai-analysis`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: targetUrl,
                    title,
                    category,
                    condition,
                    price,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Could not analyze product photo');
            }
            setAnalysis(data.analysis);
        } catch (err) {
            setError(err.message || 'AI photo analysis is temporarily unavailable.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (imageUrl) {
            runAnalysis(imageUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listingId, imageUrl]);

    return (
        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 border border-indigo-100 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 leading-tight">
                            AI Product Photo Analysis
                        </h2>
                        <p className="text-[11px] text-slate-500">
                            Powered by Gemini Vision to help buyers inspect this item first
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => runAnalysis(imageUrl)}
                    disabled={loading || !imageUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 transition cursor-pointer"
                >
                    {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    {loading ? 'Analyzing...' : 'Re-analyze'}
                </button>
            </div>

            {loading && !analysis && (
                <div className="flex items-center gap-2.5 py-6 text-sm text-indigo-700">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Inspecting product photo and generating buyer summary...</span>
                </div>
            )}

            {error && !loading && (
                <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => runAnalysis(imageUrl)}
                        className="font-semibold underline shrink-0 cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

            {analysis && (
                <div className="space-y-4 mt-3">
                    {/* Product Summary */}
                    <div className="bg-white/90 border border-slate-200/80 rounded-xl p-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1.5">
                            What&apos;s in this Photo
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {analysis.productSummary}
                        </p>
                    </div>

                    {/* Visible Condition */}
                    {analysis.visualCondition && (
                        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="text-xs font-bold text-emerald-900 block">
                                    Visible Condition Check
                                </span>
                                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                                    {analysis.visualCondition}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Key Highlights & Buyer Checklist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analysis.keyHighlights?.length > 0 && (
                            <div className="bg-white/90 border border-slate-200/80 rounded-xl p-3.5">
                                <h4 className="text-xs font-bold text-slate-800 mb-2">
                                    Key Product Details
                                </h4>
                                <ul className="space-y-1.5">
                                    {analysis.keyHighlights.map((item, idx) => (
                                        <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {analysis.buyerChecklist?.length > 0 && (
                            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
                                <h4 className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                                    <ClipboardCheck className="w-3.5 h-3.5 text-amber-600" />
                                    Before You Buy (Checklist)
                                </h4>
                                <ul className="space-y-1.5">
                                    {analysis.buyerChecklist.map((tip, idx) => (
                                        <li key={idx} className="text-xs text-amber-900/90 flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
