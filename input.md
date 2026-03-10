# Mars Automation Platform - Input Documentation

# SYSTEM DESCRIPTION

Mars Automation Platform is a distributed system for monitoring and automating a Mars habitat, based on
heterogeneous IoT devices. 
The simulator supply some kinds of different devices, such as REST-based sensors that have to be polled, telemetry
devices that privide asynchronous data streams and REST-controlled actuators.

Since, as we said, devices are heterogeneous, they have incompatible data schemas, the platform collects incoming data
converts it into a unified internal  event format. These normalized events are processed to mantain the latest state of
the sensors of the habitat, to evaluate the evaluation rules, to control actuators automatically and to provide some
real-time monitoring thanks to a dashboard.

Lastly, the system works as a single-tenant platform without authentication. All of the sensors and all of the actuators
 are globally visible.

## USER STORIES:
 
1) As an operator , I want to select a sensor, an operator and a value to define an automation trigger.
2) As an operator , I want to link an actuator to a rule so that the system reacts automatically.
3) As a supervisor , I want to see all configured rules in a dedicated list.
4) As a system admin , I want the UI to prevent contradictory automation rules.
5) As an energy engineer , I want to view the Solar Array Power graph.
6) As a safety officer , I want to monitor Radiation Exposure trends.
7) As a user , I want LIVE indicators on charts to verify active streams.
8) As a botanist , I want sensor progress bars to change color when values become dangerous.
9) As a colonist , I want to see the greenhouse temperature in Celsius.
10) As a maintenance worker , I want to track entrance humidity levels.
11) As a life-support specialist , I want to monitor hall CO₂ concentration.
12) As an operator , I want to manually toggle actuators ON/OFF.
13) As a technician , I want to clearly see actuator states.
14) As a developer , I want newly discovered actuators to appear automatically in the UI.
15) As a crew member , I want to see the current SOL and Mars Local Time.
16) As a network admin , I want a broker connection indicator.
17) As a developer , I want a simulator health indicator.
18) As a supervisor , I want all system actions recorded in an event log.
19) As a user , I want color-coded log entries to quickly identify issues.
20) As a data analyst , I want each log entry to include a precise timestamp.

The graphic mockups for each user story can be found in the booklets folder and
referenced in the attached spreadsheet.

### STANDARD EVENT SCHEMA

All heterogeneous data from the simulator are normalized into a single JSON schema before publishing to the Kafka
topic `mars_normalized_events. 
Each event represents a single measurement point.

# JSON Structure

{
  "event_id": "d290f1ee-6c54-4b01-90e6-d701748f0851",     
  "ts": "2036-03-09T10:15:30Z",                           
  "sensor_id": "hydroponic_ph_ph_level",
  "value": 6.4,
  "unit": "pH",
  "metadata": {
    "metric": "ph_level",
    "status": "nominal"
  }
}

Our normalization rules works as follow.
Rest scalar sensors generate one event per payload and complex sensors (chemistry, particulate, level) generate one
event per measurement entry, since hese contain multiple metrics, using the format {device_id}_{metric} as the sensor_id.
Particulate sensors generate multiple events (pm1, pm2.5, pm10).
Level sensors generate events representing tank level metrics and telemetry topics are mapped using the topic name as
sensor identifier.
Telemetry topics are mapped using the base topic name combined with the specific metric to create a unique sensor_id.

#### RULE MODEL

The automation rules in the Mars Automation Platform are represented as JSON objects.
These rules are persisted in a SQLite database to survive database restars.
Each rule defines a condition and a corresponding action that the Rules Engine will execute.
So, automation rules follow an IF-THEN structure such as:
IF greenhouse_temperature > 28 C
THEN set cooling_fan to ON

The supported operators to do so are:
- `<`
- `<=`
- `>`
- `>=`
- `==`
- `!=`

# Rule JSON Schema

When creating a rule via the API, the service accepts a JSON object with a human‑readable description,
plus the condition and action as strings.  The backend will parse the condition (sensor, operator, threshold)
and the action (actuator and state) before storing it in the database.

Example payload:

```json
{
  "description": "High temperature cooling",
  "condition": "greenhouse_temperature > 28",
  "action": "set cooling_fan to ON"
}
```

These rules are evaluated whenever a new normalized event arrives. If the condition evaluates to `true`,
then the rules engine generates an actuator command and the actuator state is updated via the simulator API.
Rules are persisted so that the service can recover after restarts.
