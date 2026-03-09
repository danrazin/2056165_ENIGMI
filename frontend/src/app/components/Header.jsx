import { useEffect, useState } from 'react';

export function Header() {
  const [marsSolTime, setMarsSolTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setMarsSolTime(`SOL ${Math.floor(Date.now() / 86400000)} - ${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">MARS COLONY AUTOMATION</h1>
          <p className="text-gray-400 text-sm">Habitat Monitor System</p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-400">Mars Local Time</div>
          <div className="text-xl font-bold text-blue-400">{marsSolTime}</div>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-gray-300">Broker Connected</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-gray-300">Simulator Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
