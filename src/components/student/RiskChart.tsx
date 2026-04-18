"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface RiskHistoryPoint {
  score: number;
  riskLevel: string;
  date: string;
}

interface RiskChartProps {
  history: RiskHistoryPoint[];
}

function formatWeekLabel(_: string, index: number, total: number) {
  return `W${total - index}`;
}

export default function RiskChart({ history }: RiskChartProps) {
  if (!history || history.length < 2) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-secondary">Not enough data to display.</p>
      </div>
    );
  }

  const chartData = history.map((h, i) => ({
    week: formatWeekLabel(h.date, i, history.length),
    score: h.score,
    date: new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />

        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: "#6B7280" }}
          tickLine={false}
          axisLine={{ stroke: "#E5E7EB" }}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={{ fontSize: 11, fill: "#6B7280" }}
          tickLine={false}
          axisLine={false}
        />

        {/* Threshold reference lines */}
        <ReferenceLine y={25} stroke="#10b981" strokeDasharray="6 4" strokeOpacity={0.4} />
        <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="6 4" strokeOpacity={0.4} />
        <ReferenceLine y={75} stroke="#f97316" strokeDasharray="6 4" strokeOpacity={0.4} />

        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            fontSize: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
          formatter={(value: number) => {
            const level = value <= 25 ? "Low" : value <= 50 ? "Medium" : value <= 75 ? "High" : "Critical";
            return [`${value} (${level})`, "Risk Score"];
          }}
          labelFormatter={(label: string, payload) => {
            if (payload && payload.length > 0) {
              return payload[0].payload.date;
            }
            return label;
          }}
        />

        <Area
          type="monotone"
          dataKey="score"
          stroke="#2563EB"
          strokeWidth={2.5}
          fill="url(#riskGradient)"
          dot={{ r: 4, fill: "#2563EB", stroke: "#fff", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: "#2563EB", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
