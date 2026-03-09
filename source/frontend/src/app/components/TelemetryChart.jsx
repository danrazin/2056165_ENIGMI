import { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export function TelemetryChart({ title, unit, color, generateValue }) {
  const [data, setData] = useState([]);
  const counterRef = useRef(0);

  useEffect(() => {
    const initialData = Array.from({ length: 10 }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      time: counterRef.current++,
      value: generateValue(),
    }));
    setData(initialData);

    const interval = setInterval(() => {
      setData((prevData) => {
        const newData = [...prevData.slice(1), {
          id: `${Date.now()}-${Math.random()}`,
          time: counterRef.current++,
          value: generateValue(),
        }];
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [generateValue]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold">{title}</h3>
          <p className="text-gray-400 text-sm">{unit}</p>
        </div>
        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">LIVE</span>
      </div>
      
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} key={title}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="time" stroke="#888" hide />
          <YAxis stroke="#b48c8c" />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}