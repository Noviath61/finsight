// src/StockChart.jsx
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const intervalToOutputSize = {
  "1d": 1,
  "5d": 5,
  "30d": 30,
  "3m": 90,
  "1y": 365,
};

const StockChart = ({ symbol, interval = "1d" }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!symbol) return;

    const fetchChartData = async () => {
      try {
        const outputsize = intervalToOutputSize[interval] || 30;

        const res = await fetch(
          `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=${outputsize}&apikey=${import.meta.env.VITE_TWELVE_API_KEY}`
        );
        const json = await res.json();

        if (!json?.values) return;

        const formatted = json.values
          .map((item) => ({
            label: new Date(item.datetime).toLocaleDateString("en-US", {
              month: "numeric",
              day: "numeric",
            }),
            close: parseFloat(item.close),
          }))
          .reverse();

        setData(formatted);
      } catch (err) {
        console.error("Chart fetch error:", err);
        setData([]);
      }
    };

    fetchChartData();
  }, [symbol, interval]);

  if (data.length === 0) return null;

  const color =
    data[data.length - 1].close >= data[0].close ? "#00c176" : "#ff4d4f";

  return (
    <div style={{ width: "100%", height: 300, marginTop: 40 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(v) => Math.round(v)}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
