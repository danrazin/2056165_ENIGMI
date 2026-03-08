import json
import uuid

# counter for the events --> we will use a UUID
# event_counter = itertools.count(1) # live only in memory, so if the process restart
                                   # ,the counter return back to 1.


# It only adds an event id
def generate_event(ts, sensor_id, value, unit, metadata):
    return {
        # "event_id": next(event_counter),
        "event_id": str(uuid.uuid4()),
        "ts": ts,
        "sensor_id": sensor_id,
        "value": value,
        "unit": unit,
        "metadata": metadata
    }


# REST SCALAR
def normalize_rest_scalar(payload):
    return [generate_event(
        ts=payload["captured_at"],
        sensor_id=payload["sensor_id"],
        value=payload["value"],
        unit=payload["unit"],
        metadata={
            "metric": payload["metric"],
            "status": payload["status"]
        }
    )]


# REST CHEMISTRY (array)
def normalize_rest_chemistry(payload):

    events = []

    for m in payload["measurements"]:
        sensor_id = f'{payload["sensor_id"]}_{m["metric"]}'

        events.append(
            generate_event(
                ts=payload["captured_at"],
                sensor_id=sensor_id,
                value=m["value"],
                unit=m["unit"],
                metadata={
                    "metric": m["metric"],
                    "status": payload["status"]
                }
            )
        )

    return events


# REST PARTICULATE
def normalize_rest_particulate(payload):

    metrics = {
        "pm1_ug_m3": "ug/m3",
        "pm25_ug_m3": "ug/m3",
        "pm10_ug_m3": "ug/m3"
    }
    events = []

    for metric, unit in metrics.items():

        sensor_id = f'{payload["sensor_id"]}_{metric}'

        events.append(
            generate_event(
                ts=payload["captured_at"],
                sensor_id=sensor_id,
                value=payload[metric],
                unit=unit,
                metadata={
                    "metric": metric,
                    "status": payload["status"]
                }
            )
        )

    return events


# REST LEVEL
def normalize_rest_level(payload):

    metrics = {
        "level_pct": "%",
        "level_liters": "L"
    }

    events = []

    for metric, unit in metrics.items():

        sensor_id = f'{payload["sensor_id"]}_{metric}'

        events.append(
            generate_event(
                ts=payload["captured_at"],
                sensor_id=sensor_id,
                value=payload[metric],
                unit=unit,
                metadata={
                    "metric": metric,
                    "status": payload["status"]
                }
            )
        )

    return events


# TELEMETRY POWER
def normalize_topic_power(payload):

    metrics = {
        "power_kw": "kW",
        "voltage_v": "V",
        "current_a": "A",
        "cumulative_kwh": "kWh"
    }

    events = []

    topic_name = payload["topic"].split("/")[-1]

    for metric, unit in metrics.items():

        sensor_id = f"{topic_name}_{metric}"

        events.append(
            generate_event(
                ts=payload["event_time"],
                sensor_id=sensor_id,
                value=payload[metric],
                unit=unit,
                metadata={
                    "subsystem": payload["subsystem"]
                }
            )
        )

    return events


# TELEMETRY ENVIRONMENT
def normalize_topic_environment(payload):

    events = []

    topic_name = payload["topic"].split("/")[-1]

    for m in payload["measurements"]:

        sensor_id = f'{topic_name}_{m["metric"]}'

        events.append(
            generate_event(
                ts=payload["event_time"],
                sensor_id=sensor_id,
                value=m["value"],
                unit=m["unit"],
                metadata={
                    "system": payload["source"]["system"],
                    "segment": payload["source"]["segment"],
                    "status": payload["status"]
                }
            )
        )

    return events


# TELEMETRY THERMAL LOOP
def normalize_topic_thermal(payload):

    metrics = {
        "temperature_c": "C",
        "flow_l_min": "L/min"
    }

    events = []

    topic_name = payload["topic"].split("/")[-1]

    for metric, unit in metrics.items():

        sensor_id = f"{topic_name}_{payload['loop']}_{metric}"

        events.append(
            generate_event(
                ts=payload["event_time"],
                sensor_id=sensor_id,
                value=payload[metric],
                unit=unit,
                metadata={
                    "loop": payload["loop"],
                    "status": payload["status"]
                }
            )
        )

    return events


# TELEMETRY AIRLOCK
def normalize_topic_airlock(payload):

    events = []

    topic_name = payload["topic"].split("/")[-1]

    events.append(
        generate_event(
            ts=payload["event_time"],
            sensor_id=f"{topic_name}_{payload['airlock_id']}_cycles",
            value=payload["cycles_per_hour"],
            unit="cycles/hour",
            metadata={}
        )
    )
    events.append(
        generate_event(
            ts=payload["event_time"],
            sensor_id=f"{topic_name}_{payload['airlock_id']}_last_state",
            value=payload["last_state"],
            unit="string",
            metadata={}
        )
    )

    return events


# DISPATCHER
def normalize_event(schema_type, payload):

    if schema_type == "rest.scalar.v1":
        return normalize_rest_scalar(payload)

    if schema_type == "rest.chemistry.v1":
        return normalize_rest_chemistry(payload)

    if schema_type == "rest.particulate.v1":
        return normalize_rest_particulate(payload)

    if schema_type == "rest.level.v1":
        return normalize_rest_level(payload)

    if schema_type == "topic.power.v1":
        return normalize_topic_power(payload)

    if schema_type == "topic.environment.v1":
        return normalize_topic_environment(payload)

    if schema_type == "topic.thermal_loop.v1":
        return normalize_topic_thermal(payload)

    if schema_type == "topic.airlock.v1":
        return normalize_topic_airlock(payload)

    raise ValueError("Schema non supportato")
