import { TrendingDown, CheckCircle2, TrendingUp, Info } from 'lucide-react';

function formatRM(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 'RM 0';
    return Number.isInteger(num)
        ? `RM ${num}`
        : `RM ${num.toFixed(2).replace(/\.00$/, '')}`;
}

const STATUS_CONFIG = {
    below_market: {
        label: 'Below Average',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        dotClass: 'bg-sky-600 ring-4 ring-sky-500/20',
        pillClass: 'bg-sky-600 text-white',
        caretClass: 'border-t-sky-600',
        Icon: TrendingDown,
    },
    fair_price: {
        label: 'Fair Price',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-600 ring-4 ring-emerald-500/20',
        pillClass: 'bg-emerald-600 text-white',
        caretClass: 'border-t-emerald-600',
        Icon: CheckCircle2,
    },
    above_market: {
        label: 'Above Average',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500 ring-4 ring-amber-500/20',
        pillClass: 'bg-amber-500 text-white',
        caretClass: 'border-t-amber-500',
        Icon: TrendingUp,
    },
};

export default function PriceInsightCard({ priceInsight }) {
    if (!priceInsight || typeof priceInsight.q1 !== 'number' || typeof priceInsight.q3 !== 'number') {
        return null;
    }

    const {
        currentPrice,
        q1,
        median,
        q3,
        minAxis,
        maxAxis,
        sampleCount = 1,
        status = 'fair_price',
        scopeLabel,
    } = priceInsight;

    const config = STATUS_CONFIG[status] || STATUS_CONFIG.fair_price;
    const StatusIcon = config.Icon;

    const span = maxAxis - minAxis > 0 ? maxAxis - minAxis : 1;
    const clamp = (pct) => Math.max(0, Math.min(100, pct));

    const q1Pct = clamp(((q1 - minAxis) / span) * 100);
    const q3Pct = clamp(((q3 - minAxis) / span) * 100);
    const rangeWidthPct = Math.max(2, q3Pct - q1Pct);
    const currentPct = clamp(((currentPrice - minAxis) / span) * 100);

    // Prevent Q1 and Q3 labels from overlapping when the interquartile band is narrow
    const labelsClose = q3Pct - q1Pct < 18;
    const q1LabelTransform = labelsClose ? '-translate-x-3/4' : '-translate-x-1/2';
    const q3LabelTransform = labelsClose ? '-translate-x-1/4' : '-translate-x-1/2';

    const scopeText = scopeLabel ? `${scopeLabel} listings` : 'items';

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Price Insight</h3>
                    {typeof median === 'number' && (
                        <span className="text-[11px] font-medium text-slate-400">
                            · Median {formatRM(median)}
                        </span>
                    )}
                </div>
                <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${config.badgeClass}`}
                >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {config.label}
                </span>
            </div>

            {/* Visual Range Track */}
            <div className="pt-9 pb-7 px-2">
                <div className="relative h-2.5 w-full bg-slate-200 rounded-full">
                    {/* Highlighted Green Q1–Q3 Segment */}
                    <div
                        className="absolute top-0 h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{
                            left: `${q1Pct}%`,
                            width: `${rangeWidthPct}%`,
                        }}
                    />

                    {/* Current Price Marker + Floating Callout Pill */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all duration-300"
                        style={{ left: `${currentPct}%` }}
                    >
                        <div
                            className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm whitespace-nowrap ${config.pillClass}`}
                        >
                            {formatRM(currentPrice)}
                            <span
                                className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${config.caretClass}`}
                            />
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${config.dotClass}`} />
                    </div>

                    {/* Q1 Label */}
                    <div
                        className={`absolute top-full mt-2 ${q1LabelTransform} text-center whitespace-nowrap`}
                        style={{ left: `${q1Pct}%` }}
                    >
                        <span className="block text-[11px] font-semibold text-slate-700">
                            {formatRM(q1)}
                        </span>
                    </div>

                    {/* Q3 Label */}
                    <div
                        className={`absolute top-full mt-2 ${q3LabelTransform} text-center whitespace-nowrap`}
                        style={{ left: `${q3Pct}%` }}
                    >
                        <span className="block text-[11px] font-semibold text-slate-700">
                            {formatRM(q3)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer Note */}
            <div className="flex items-start gap-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <span>
                    Calculated based on {sampleCount} similar {scopeText} in our platform. Use as a guide.
                </span>
            </div>
        </div>
    );
}
