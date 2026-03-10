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
    greenhouse_temperature: 0,
    entrance_humidity: 0,
    co2_hall: 0,
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
  const handleAddRule = useCallback(async (rule) => {
    const payload = {
      condition: `${rule.sensor} ${rule.operator} ${rule.value}`,
      action: `${rule.actuator} ON`,
      description: `Rule for ${rule.sensor}`
    };

    try {
      const response = await fetch('http://localhost:5000/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Crea l'oggetto regola completo usando l'ID ricevuto dal server
        const newRule = {
          id: result.rule_id, // L'ID che abbiamo appena aggiunto al backend
          sensor: rule.sensor,
          operator: rule.operator,
          value: rule.value,
          actuator: rule.actuator,
          action: rule.action,
          description: payload.description
        };

        // Aggiorna lo stato aggiungendo la nuova regola a quelle esistenti
        setRules((prevRules) => [...prevRules, newRule]);

        // sincronizza subito gli actuators
        const actRes = await fetch('http://localhost:5000/api/actuators');
        if (actRes.ok) {
          const actData = await actRes.json();
          setActuators(actData);
        }

        addNotification(`Rule Created (ID: ${result.rule_id})`, 'success');
      }
    } catch (error) {
      addNotification(`Error saving rule`, 'error');
    }
  }, [addNotification]);

  // Delete rule
  const handleDeleteRule = useCallback(async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/rules/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRules((prev) => prev.filter((r) => r.id !== id));
        addNotification('Rule deleted from database', 'warning');
      }
    } catch (error) {
      addNotification('Error in deletion', 'error');
    }
  }, [addNotification]);

  // Toggle actuator
  const toggleActuator = useCallback(async (actuator) => {
    const nextState = !actuators[actuator];
    const actionString = nextState ? 'ON' : 'OFF';

    try {
      // Usa l'endpoint corretto /api/actuators
      const response = await fetch('http://localhost:5000/api/actuators/toggle', {
        method: 'POST', // Il backend deve gestire il POST su questa rotta
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          actuator: actuator, 
          action: actionString 
        }),
      });

      if (response.ok) {
        // Aggiorna lo stato locale solo se il server conferma
        setActuators((prev) => ({ ...prev, [actuator]: nextState }));
        addNotification(`${actuator} set to ${actionString}`, 'success');
      }
    } catch (error) {
      console.error("Error toggling actuator:", error);
      addNotification(`Connection error`, 'error');
    }
  }, [actuators, addNotification]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Carica le regole dal DB
        const rulesRes = await fetch('http://localhost:5000/api/rules');
        if (rulesRes.ok) {
          const data = await rulesRes.json();
          // Mappa il formato array del DB nel formato oggetto del frontend
          const formattedRules = data.map(r => ({
            id: r[0],
            description: r[1],
            sensor: r[2],
            operator: r[3],
            value: r[4],
            actuator: r[5],
            action: r[6]
          }));
          setRules(formattedRules);
        }
        
        // Carica lo stato attuale degli attuatori
        const actRes = await fetch('http://localhost:5000/api/actuators');
        if (actRes.ok) {
          const actData = await actRes.json();
          setActuators(actData);
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };
      fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Sensori
        const sensorRes = await fetch('http://localhost:5000/api/state');
        if (sensorRes.ok) {
          const data = await sensorRes.json();
          setSensorData(data); 
          setTelemetryData(data);
        }

        const actuatorRes = await fetch('http://localhost:5000/api/actuators');
        if (actuatorRes.ok) {
          const actData = await actuatorRes.json();
          setActuators(actData); 
        }

      } catch (error) {
        console.error("Could not fetch data:", error);
        addNotification("Failed to connect to Mars Station API", "error");
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [addNotification]);

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
                  min={75}
                  max={200}
                />
                <TelemetryChart 
                  key="radiation"
                  title="Radiation Exposure"
                  unit="mSv/h"
                  color="#3b82f6"
                  generateValue={generateRadiation}
                  min={0}
                  max={1}
                />
              </div>
              <h2 className="text-white text-lg font-bold mb-3"></h2>
              <div className="grid grid-cols-2 gap-4">
                <TelemetryChart 
                  key="life-support"
                  title="Life Support"
                  unit="%"
                  color="#f59e0b"
                  generateValue={generateLife}
                  min={18}
                  max={24}
                />
                <TelemetryChart 
                  key="thermal-support"
                  title="Thermal Support"
                  unit="°C"
                  color="#3b82f6"
                  generateValue={generateThermal}
                  min={10}
                  max={100}
                />
              </div>
              <h2 className="text-white text-lg font-bold mb-3"></h2>
              <div className="grid grid-cols-2 gap-4">
                <TelemetryChart 
                  key="power-bus"
                  title="Power Bus"
                  unit="kw"
                  color="#f59e0b"
                  generateValue={generatePowerBus}
                  min={20}
                  max={100}
                />
                <TelemetryChart 
                  key="power-consumption"
                  title="Power Consumption"
                  unit="kw"
                  color="#3b82f6"
                  generateValue={generatePowerC}
                  min={100}
                  max={200}
                />
              </div>
              <h2 className="text-white text-lg font-bold mb-3"></h2>
              <div className="grid grid-cols-2 gap-4">
                <TelemetryChart 
                  key="airlock"
                  title="Airlock"
                  unit="cycle/h"
                  color="#f59e0b"
                  generateValue={generateAirlock}
                  min={0}
                  max={10}
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
                  min={18}
                  max={28}
                />
                <SensorGauge 
                  title="Entrance Humidity"
                  value={sensorData.entrance_humidity}
                  unit="%"
                  min={20}
                  max={60}
                />
                <SensorGauge 
                  title="Hall CO₂"
                  value={sensorData.co2_hall}
                  unit="ppm"
                  min={400}
                  max={1000}
                />
              </div>
              <h2 className="text-white text-lg font-bold mb-3"></h2>
              <div className="grid grid-cols-3 gap-4">
                <SensorGauge 
                  title="Hydroponic PH"
                  value={sensorData.hydroponic_ph_ph}
                  unit="ph"
                  min={5.5}
                  max={6.5}
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
                  unit="ug/m3"
                  min={15}
                  max={35}
                />
                <SensorGauge 
                  title="Air Quality VOC"
                  value={sensorData.air_quality_voc_voc_ppb}
                  unit="ppb"
                  min={200}
                  max={600}
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
                  name="entrance_humidifier"
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