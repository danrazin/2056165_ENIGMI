import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TelemetryChart } from './components/TelemetryChart';
import { SensorGauge } from './components/SensorGauge';
import { ActuatorControl } from './components/ActuatorControl';
import { RuleManager } from './components/RuleManager';
import { NotificationBar } from './components/NotificationBar';

export default function App() {
  const [sensorData, setSensorData] = useState({
    greenhouse_temperature: 22.5,
    entrance_humidity: 45.0,
    co2_hall: 450,
  });

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

            
          </div>
        </main>
      </div>
      
      {/* Notification Bar */}
      <NotificationBar events={events} />
    </div>
  );
}