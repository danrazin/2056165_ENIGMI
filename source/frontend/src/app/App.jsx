import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TelemetryChart } from './components/TelemetryChart';
import { SensorGauge } from './components/SensorGauge';
import { ActuatorControl } from './components/ActuatorControl';
import { RuleManager } from './components/RuleManager';
import { NotificationBar } from './components/NotificationBar';

export default function App() {
  const [rules, setRules] = useState([]);
  const [events, setEvents] = useState([]);
  const [actuators, setActuators] = useState({
    cooling_fan: false,
    habitat_heater: false,
    hall_ventilation: false,
  });
  const [sensorData, setSensorData] = useState({
    greenhouse_temperature: 22.5,
    entrance_humidity: 45.0,
    co2_hall: 450,
  });

  // Add notification
  const addNotification = useCallback((message, type = 'info') => {
    const now = new Date();
    const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    setEvents((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        message,
        timestamp,
        type,
      },
    ]);
  }, []);

  // Add rule
  const handleAddRule = useCallback((rule) => {
    const newRule = { ...rule, id: `rule-${Date.now()}` };
    setRules((prev) => [...prev, newRule]);
    addNotification(`Rule created: IF ${rule.sensor} ${rule.operator} ${rule.value} THEN ${rule.actuator} ON`, 'success');
  }, [addNotification]);

  // Delete rule
  const handleDeleteRule = useCallback((id) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    addNotification('Rule deleted', 'warning');
  }, [addNotification]);

  // Toggle actuator
  const toggleActuator = useCallback((actuator) => {
    setActuators((prev) => {
      const newState = !prev[actuator];
      addNotification(
        `Manual: ${actuator.replace('_', ' ').toUpperCase()} set to ${newState ? 'ON' : 'OFF'}`,
        'info'
      );
      return { ...prev, [actuator]: newState };
    });
  }, [addNotification]);

  // Simulate sensor data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData((prev) => ({
        greenhouse_temperature: prev.greenhouse_temperature + (Math.random() - 0.5) * 2,
        entrance_humidity: Math.max(20, Math.min(80, prev.entrance_humidity + (Math.random() - 0.5) * 5)),
        co2_hall: Math.max(300, Math.min(800, prev.co2_hall + (Math.random() - 0.5) * 20)),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Check rules and trigger actuators
  useEffect(() => {
    rules.forEach((rule) => {
      const sensorValue = sensorData[rule.sensor];
      if (sensorValue === undefined) return;

      let condition = false;
      switch (rule.operator) {
        case '>':
          condition = sensorValue > rule.value;
          break;
        case '<':
          condition = sensorValue < rule.value;
          break;
        case '>=':
          condition = sensorValue >= rule.value;
          break;
        case '<=':
          condition = sensorValue <= rule.value;
          break;
      }

      if (condition && !actuators[rule.actuator]) {
        setActuators((prev) => ({ ...prev, [rule.actuator]: true }));
        addNotification(
          `Rule triggered: ${rule.actuator.replace('_', ' ').toUpperCase()} activated`,
          'warning'
        );
      }
    });
  }, [sensorData, rules, actuators, addNotification]);

  // Initial welcome message
  useEffect(() => {
    addNotification('System initialized - All subsystems operational', 'success');
  }, [addNotification]);

  // Data generators for telemetry charts
  const generateSolarPower = useCallback(() => {
    return 8.5 + Math.random() * 2.5;
  }, []);

  const generateRadiation = useCallback(() => {
    return 0.25 + Math.random() * 0.15;
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-80 border-r border-gray-700 p-4 overflow-y-auto bg-gray-900">
          <RuleManager 
            rules={rules}
            onAddRule={handleAddRule}
            onDeleteRule={handleDeleteRule}
          />
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-4 overflow-y-auto bg-gray-900">
          <div className="space-y-6">
            {/* Telemetry Charts */}
            <section>
              <h2 className="text-white text-lg font-bold mb-3">Telemetry Streams</h2>
              <div className="grid grid-cols-2 gap-4">
                <TelemetryChart 
                  key="solar-power"
                  title="Solar Array Power"
                  unit="kW"
                  color="#f59e0b"
                  generateValue={generateSolarPower}
                />
                <TelemetryChart 
                  key="radiation"
                  title="Radiation Exposure"
                  unit="mSv/h"
                  color="#3b82f6"
                  generateValue={generateRadiation}
                />
              </div>
            </section>

            {/* Sensor Gauges */}
            <section>
              <h2 className="text-white text-lg font-bold mb-3">Environmental Sensors</h2>
              <div className="grid grid-cols-3 gap-4">
                <SensorGauge 
                  title="Greenhouse Temp"
                  value={sensorData.greenhouse_temperature}
                  unit="°C"
                  min={10}
                  max={35}
                />
                <SensorGauge 
                  title="Entrance Humidity"
                  value={sensorData.entrance_humidity}
                  unit="%"
                  min={0}
                  max={100}
                />
                <SensorGauge 
                  title="Hall CO₂"
                  value={sensorData.co2_hall}
                  unit="ppm"
                  min={300}
                  max={800}
                />
              </div>
            </section>

            {/* Actuator Controls */}
            <section>
              <h2 className="text-white text-lg font-bold mb-3">Actuator Controls</h2>
              <div className="grid grid-cols-3 gap-4">
                <ActuatorControl 
                  name="cooling_fan"
                  label="Cooling Fan"
                  isOn={actuators.cooling_fan}
                  onToggle={() => toggleActuator('cooling_fan')}
                />
                <ActuatorControl 
                  name="habitat_heater"
                  label="Habitat Heater"
                  isOn={actuators.habitat_heater}
                  onToggle={() => toggleActuator('habitat_heater')}
                />
                <ActuatorControl 
                  name="hall_ventilation"
                  label="Hall Ventilation"
                  isOn={actuators.hall_ventilation}
                  onToggle={() => toggleActuator('hall_ventilation')}
                />
              </div>
            </section>
          </div>
        </main>
      </div>
      
      {/* Notification Bar */}
      <NotificationBar events={events} />
    </div>
  );
}