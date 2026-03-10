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
    entrance_humidifier: false,
  });
  const [sensorData, setSensorData] = useState({
    greenhouse_temperature: 22.5,
    entrance_humidity: 45.0,
    co2_hall: 450,
    corridor_pressure: 0,
    hydroponic_ph_ph: 0,
    water_tank_level_level_liters: 0,
    air_quality_pm25_pm25_ug_m3: 0,
    air_quality_voc_voc_ppb: 0,
  });
  const [telemetryData, setTelemetryData] = useState({
    solar_array_power_kw: 0,
    radiation_radiation_uSv_h: 0,
    life_support_oxygen_percent: 0,
    thermal_loop_primary_temperature_c: 0,
    power_bus_power_kw: 0,
    power_consumption_power_kw: 0,
    'airlock_airlock-1_cycles': 0, 
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

  useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/state');

      if (!response.ok) {
        // Triggered if the server responds but with an error (e.g., 404 or 500)
        addNotification(`API Error: ${response.status} ${response.statusText}`, 'error');
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      

      setSensorData(data); 
      setTelemetryData(data);

    } catch (error) {
      // Triggered if the fetch fails entirely (e.g., Network Error, CORS issue, Server Down)
      console.error("Could not fetch sensor data:", error);
      addNotification("Failed to connect to Mars Station API", "error");
    }
  };

    fetchData();
    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, [addNotification]);

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
    return telemetryData.solar_array_power_kw;
  }, [telemetryData]);

  const generateRadiation = useCallback(() => {
    return telemetryData.radiation_radiation_uSv_h;
  }, [telemetryData]);

  const generateLife = useCallback(() => {
    return telemetryData.life_support_oxygen_percent;
  }, [telemetryData]);

  const generateThermal = useCallback(() => {
    return telemetryData.thermal_loop_primary_temperature_c;
  }, [telemetryData]);

  const generatePowerBus = useCallback(() => {
    return telemetryData.power_bus_power_kw;
  }, [telemetryData]);

  const generatePowerC = useCallback(() => {
    return telemetryData.power_consumption_power_kw;
  }, [telemetryData]);

  const generateAirlock = useCallback(() => {
    return telemetryData['airlock_airlock-1_cycles'];
  }, [telemetryData]);

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
              <h2 className="text-white text-lg font-bold mb-3"></h2>
              <div className="grid grid-cols-2 gap-4">
                <TelemetryChart 
                  key="solar-power"
                  title="Life Support"
                  unit="%"
                  color="#f59e0b"
                  generateValue={generateLife}
                />
                <TelemetryChart 
                  key="radiation"
                  title="Thermal Support"
                  unit="°C"
                  color="#3b82f6"
                  generateValue={generateThermal}
                />
              </div>
              <h2 className="text-white text-lg font-bold mb-3"></h2>
              <div className="grid grid-cols-2 gap-4">
                <TelemetryChart 
                  key="solar-power"
                  title="Power Bus"
                  unit="kw"
                  color="#f59e0b"
                  generateValue={generatePowerBus}
                />
                <TelemetryChart 
                  key="radiation"
                  title="Power Consumption"
                  unit="kw"
                  color="#3b82f6"
                  generateValue={generatePowerC}
                />
              </div>
              <h2 className="text-white text-lg font-bold mb-3"></h2>
              <div className="grid grid-cols-2 gap-4">
                <TelemetryChart 
                  key="solar-power"
                  title="Airlock"
                  unit="cycle/h"
                  color="#f59e0b"
                  generateValue={generateAirlock}
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
                  min={500}
                  max={1500}
                />
              </div>
              <h2 className="text-white text-lg font-bold mb-3"></h2>
              <div className="grid grid-cols-3 gap-4">
                <SensorGauge 
                  title="Hydroponic PH"
                  value={sensorData.hydroponic_ph_ph}
                  unit="ph"
                  min={0}
                  max={14}
                />
                <SensorGauge 
                  title="Water Tank Level"
                  value={sensorData.water_tank_level_level_liters}
                  unit="l"
                  min={2000}
                  max={4000}
                />
                <SensorGauge 
                  title="Corridor Pressure"
                  value={sensorData.corridor_pressure}
                  unit="bar"
                  min={50}
                  max={200}
                />
              </div>
              <h2 className="text-white text-lg font-bold mb-3"></h2>
              <div className="grid grid-cols-3 gap-4">
                <SensorGauge 
                  title="Air Quality PM25"
                  value={sensorData.air_quality_pm25_pm25_ug_m3}
                  unit="um/m3"
                  min={0}
                  max={50}
                />
                <SensorGauge 
                  title="Air Quality VOC"
                  value={sensorData.air_quality_voc_voc_ppb}
                  unit="ppb"
                  min={0}
                  max={500}
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
              <h2 className="text-white text-lg font-bold mb-3"></h2>
              <div className="grid grid-cols-3 gap-4">
                <ActuatorControl 
                  name="cooling_fan"
                  label="Entrance Humidifier"
                  isOn={actuators.entrance_humidifier}
                  onToggle={() => toggleActuator('entrance_humidifier')}
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