import { useState } from 'react';

const SENSORS = [
  { value: 'greenhouse_temperature', label: 'Greenhouse Temperature' },
  { value: 'entrance_humidity', label: 'Entrance Humidity' },
  { value: 'co2_hall', label: 'Hall CO₂' },
];

const OPERATORS = [
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
];

const ACTUATORS = [
  { value: 'cooling_fan', label: 'Cooling Fan' },
  { value: 'habitat_heater', label: 'Habitat Heater' },
  { value: 'hall_ventilation', label: 'Hall Ventilation' },
];

export function RuleManager({ rules, onAddRule, onDeleteRule }) {
  const [sensor, setSensor] = useState(SENSORS[0].value);
  const [operator, setOperator] = useState(OPERATORS[0].value);
  const [value, setValue] = useState('');
  const [actuator, setActuator] = useState(ACTUATORS[0].value);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value) return;
    
    onAddRule({
      sensor,
      operator,
      value: parseFloat(value),
      actuator,
    });
    
    setValue('');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-4">
        <h2 className="text-white font-bold text-lg mb-4">Create Rule</h2>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Sensor</label>
            <select
              value={sensor}
              onChange={(e) => setSensor(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              {SENSORS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Operator</label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-1">Value</label>
              <input
                type="number"
                step="0.1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="0.0"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-1">Then Actuator</label>
            <select
              value={actuator}
              onChange={(e) => setActuator(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              {ACTUATORS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-semibold"
          >
            Add Rule
          </button>
        </form>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex-1 overflow-hidden flex flex-col">
        <h3 className="text-white font-bold mb-3">Active Rules ({rules.length})</h3>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {rules.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">
              No rules configured
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-gray-700 rounded p-3 flex items-start justify-between"
              >
                <div className="text-sm text-white">
                  <div>IF <span className="text-blue-400">{rule.sensor}</span></div>
                  <div className="my-1">{rule.operator} <span className="text-amber-400">{rule.value}</span></div>
                  <div>THEN <span className="text-green-400">{rule.actuator}</span> → ON</div>
                </div>
                
                <button
                  onClick={() => onDeleteRule(rule.id)}
                  className="text-red-400 hover:text-red-300 ml-2"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
