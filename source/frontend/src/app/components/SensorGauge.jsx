export function SensorGauge({ title, value, unit, min, max }) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  const getColor = () => {
    if (percentage > 80) return '#ef4444';
    if (percentage > 60) return '#f59e0b';
    return '#3b82f6';
  };

  const color = getColor();

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
      <h3 className="text-white text-sm font-semibold mb-3">{title}</h3>
      
      <div className="text-5xl font-bold mb-2" style={{ color }}>
        {value.toFixed(1)}
      </div>
      
      <div className="text-gray-400 text-sm">{unit}</div>
      
      <div className="mt-3 bg-gray-700 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full transition-all duration-500"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
