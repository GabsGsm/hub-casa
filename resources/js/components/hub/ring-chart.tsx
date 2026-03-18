type RingChartProps = {
    value: number;
    max: number;
    color: string;
};

export function RingChart({ value, max, color }: RingChartProps) {
    const r = 16;
    const circ = 2 * Math.PI * r;
    const fill = max > 0 ? (value / max) * circ : 0;
    return (
        <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r={r} fill="none" stroke="#F0EFED" strokeWidth="3" />
            <circle
                cx="20" cy="20" r={r} fill="none"
                stroke={color} strokeWidth="3"
                strokeDasharray={`${fill} ${circ}`}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
                style={{ transition: 'stroke-dasharray 400ms ease-out' }}
            />
        </svg>
    );
}
