# SYSTEM DESCRIPTION:

Mars Automation Platform (MAP) is a platform designed to automate and monitor enviromental and operational conditions
in a Mars habitat.
It integrates heterogeneous IoT devices, normalizes their data into a unified format and uses an event-driven engine
to evaluate automation rules.

The architecture follows this approach: we have an ingestion tier, dedicated collectors for REST polling and WebSocket
streams, a messaging tier in which apache Kafka guarantes event propagation and a logic tier, with an automation
engine that maintains real-time state and triggers actuators.
Persistence is than guaranted thanks to the automation rules that are stored in a AQLite database to survive restars.

The system is completely containerized and deployable using Docker Compose.

# USER STORIES:

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

# CONTAINERS:

## CONTAINER_NAME: ingestion_rest

### DESCRIPTION: 
A Python service responsable for periodically polling the simulator's REST sensors.

### USER STORIES:
9) As a colonist , I want to see the greenhouse temperature in Celsius.

10) As a maintenance worker , I want to track entrance humidity levels.

11) As a life-support specialist , I want to monitor hall CO₂ concentration.

### PORTS: 
No exposed ports, since it communicates internally to Kafka and Simulator.

### DESCRIPTION:
The ingestion_rest container runs a Python process that cycically queries the simulator's endopoints.
It uses a normalization module to transform heterogeneous payloads into standardized events before publishing them to
the Kafka broker.

### PERSISTENCE EVALUATION
Stateless. It doesn't memorize dates, it just converts them in real-time and sends them to the broker.

### EXTERNAL SERVICES CONNECTIONS
- simulator: HTTP GET on http://simulator:8080/api/sensors
- Kafka: producer on kafka:9092

### MICROSERVICES:

#### MICROSERVICE: collector_rest
- TYPE: backend
- DESCRIPTION: execute the polling cycle and the normalization of the REST data.
- PORTS: N/D.
- TECHNOLOGICAL SPECIFICATION: Python 3.10-slim, requests library for polling and kafka-python for sending messages.
- SERVICE ARCHITECTURE: infinite loop architecture with retry management for connecting to the broker.

## CONTAINER_NAME: ingestion_ws

### DESCRIPTION: 
Asynchronous service (asyncio) that manages persistent WebSocket connections for stream telemetry.

### USER STORIES:
5) As an energy engineer , I want to view the Solar Array Power graph.

6) As a safety officer , I want to monitor Radiation Exposure trends.

7) As a user , I want LIVE indicators on charts to verify active streams.

### PORTS: 
No exposed ports.

### DESCRIPTION:
The ingestion_ws container maintains persistent connections to the simulator to receive real-time (push) data.
Each received message is normalized and sent to the Kafka topic dedicated to habitat events.

### PERSISTENCE EVALUATION
Stateless. It hanldes continuos data flow withoout local persistence.

### EXTERNAL SERVICES CONNECTIONS
- simulator: WS on ws://simulator:8080/api/telemetry/ws
- kafka: producer on kafka:9092

#### MICROSERVICE: collector_telemetry_ws
- TYPE: backend
- DESCRIPTION: asynchronous WebSocket stream consumer.
- PORTS: N/D.
- TECHNOLOGICAL SPECIFICATION: Python, websockets library (asyncio) and kafka-python
- SERVICE ARCHITECTURE: based on asynchronous programming to handle multiple telemetry topics in parallel.

## CONTAINER_NAME: kafka_broker

### DESCRIPTION: 
Message broker (Apache Kafka in KRaft mode) for decoupling ingestion and processing.

### USER STORIES:
16) As a network admin , I want a broker connection indicator.

### PORTS: 
9092:9092

### DESCRIPTION:
Apache Kafka manages the transit of normalized events.
It acts as a buffer and ensures that the Engine can process data at its own pace without losing information produced by
collectors.

### PERSISTENCE EVALUATION
Ephemeral (configured via docker-compose with no external volumes in the provided file).

### EXTERNAL SERVICES CONNECTIONS
Accepts connections from ingestion_rest, ingestion_ws and engine.

#### MICROSERVICE: kafka-bus
- TYPE: middleware/message-broker.
- DESCRIPTION: it manages the communication channels (topics) between the various seervices of the system.
- PORTS: 9092
- TECHNOLOGICAL SPECIFICATION: the image used is confluentic/cp-kafka:latest.
It uses the KRaft (Kafta Raft) protocol for cluster management without the need for Zookeeper.
- SERVICE ARCHITECTURE: Distributed log-based architecture.
Uses a PLAINTEXT listener for internal communication within the mars_net Docker network.

## CONTAINER_NAME: engine

### DESCRIPTION: 
System logical core: manages the frontend API, rule persistence and event processing.

### USER STORIES:
1) As an operator , I want to select a sensor, an operator and a value to define an automation trigger.

2) As an operator , I want to link an actuator to a rule so that the system reacts automatically.

3) As a supervisor , I want to see all configured rules in a dedicated list.

4) As a system admin , I want the UI to prevent contradictory automation rules.

12) As an operator , I want to manually toggle actuators ON/OFF.

13) As a technician , I want to clearly see actuator states.

18) As a supervisor , I want all system actions recorded in an event log.

20) As a data analyst , I want each log entry to include a precise timestamp.

### PORTS: 
5000:5000

### DESCRIPTION:
The Engine acts as a central orchestrator. it listens for normalized events from Kafka, updates the state of the
sensors in memory (cache), and evaluates whether the conditions of the automation rules are met to trigger the actuators.
It also exposes the REST APIs used bu the Dashboard.

### PERSISTENCE EVALUATION
Persistent. Uses a local SQLite database to store automation rules (rules table).
This ensures that user-defined automations aren't lost when the containeer restars.

### EXTERNAL SERVICES CONNECTIONS
It connects to the Kakfa Broker (Consumer) and to the Simulator (POST for attuators).

#### MICROSERVICE: engine_api
- TYPE: backend.
- DESCRIPTION: exposes endpoints for system management and evaluates automation rules.
- PORTS: 5000
- TECHNOLOGICAL SPECIFICATION: Flask (Web Framework), SQLite3, Kafka Consumer.
- SERVICE ARCHITECTURE: multithreaded: one thread runs the Flask API server, a second thread constantly consumes messages
from Kafka.
- ENDPOINTS: 
		
	| HTTP METHOD | URL            | Description                                           | User Stories |
	| GET         | /api/state     | returns the last known state of all sensors           | 7,9,10,11    |
        | POST        | /api/rules     | creates a new rule of automation                      | 1,2          |
        | GET         | /api/rules     | returns the list of saved rules                       | 3            |
        | GET         | /api/actuators | returns the state of the actuators from the simulator | 13           |
        | DELETE      | /api/rules/{id}| deletes a rule                                        | 4            |
- DB STRUCTURE:
rules :	| rule_id | description | sensor_name | operator | threshold_value | actuator_name | action_state | enabled |

