export function ActuatorControl({ name, label, isOn, onToggle }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h4 className="text-white font-semibold mb-3">{label}</h4>
      
      <button
        onClick={onToggle}
        className={`w-full py-3 rounded font-semibold transition-all ${
          isOn 
            ? 'bg-green-500 hover:bg-green-600 text-white' 
            : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
        }`}
      >
        {isOn ? 'ON' : 'OFF'}
      </button>
      
      <div className="mt-3 text-center">
        <span className={`text-xs ${isOn ? 'text-green-400' : 'text-gray-500'}`}>
          {isOn ? '● ACTIVE' : '○ OFFLINE'}
        </span>
      </div>
    </div>
  );
}
