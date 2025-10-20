import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function StockChart({ symbol, interval }) {
  const [data, setData] = useState([]);
  const [ticks, setTicks] = useState([]);
  const API_KEY = import.meta.env.VITE_FMP_API_KEY;

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const url = `https://financialmodelingprep.com/api/v3/historical-chart/${interval}/${symbol}?apikey=${API_KEY}`;
        const response = await fetch(url);
        const rawData = await response.json();

        if (Array.isArray(rawData)) {
          const formatted = rawData.reverse().map(entry => ({
            time: entry.date,
            price: parseFloat(entry.close),
          }));
          setData(formatted);
          setTicks(generateNiceTicks(formatted, interval));
        } else {
          setData([]);
          setTicks([]);
        }
      } catch (error) {
        console.error('Chart data fetch failed:', error);
        setData([]);
        setTicks([]);
      }
    };

    fetchChartData();
  }, [symbol, interval, API_KEY]);

  const generateNiceTicks = (formattedData, interval) => {
    if (formattedData.length === 0) return [];

    const isMinute = interval.includes('min');

    if (isMinute) {
      const result = [];
      const step = {
        '1min': 15,
        '5min': 30,
        '15min': 60,
        '30min': 60,
      }[interval] || 30;

      for (const point of formattedData) {
        const date = new Date(point.time);
        const minutes = date.getMinutes();
        if (minutes % step === 0) {
          result.push(point.time);
        }
      }

      return result;
    }

    // For hour/day intervals – just show ~6 ticks spaced out
    const count = 6;
    const total = formattedData.length;
    const step = Math.floor(total / count);
    const result = [];

    for (let i = 0; i < total; i += step) {
      result.push(formattedData[i].time);
    }

    return result;
  };

  const formatTime = (value) => {
    const date = new Date(value);

    if (interval.includes('min') || interval.includes('hour')) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
        });
    } else {
      return date.toLocaleDateString("en-US", {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit'
    });
  }
  };

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            ticks={ticks}
            minTickGap={20}
          />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip
            labelFormatter={(label) => formatTime(label)}
            formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}

            contentStyle={{
              backgroundColor: '#222',
              border: 'none',
              borderRadius: '6px'
            }}
            labelStyle={{ color: '#aaa' }}
            itemStyle={{ color: '#fff' }}
          />
          <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StockChart;
