import time
import requests
import json

from normalizer import normalize_event


BASE_URL = "http://localhost:8080"

# Sensor list with its own schema
REST_SENSORS = [
    ("rest.scalar.v1", "greenhouse_temperature"),
    ("rest.scalar.v1", "entrance_humidity"),
    ("rest.scalar.v1", "co2_hall"),
    ("rest.scalar.v1", "corridor_pressure"),

    ("rest.chemistry.v1", "hydroponic_ph"),
    ("rest.chemistry.v1", "air_quality_voc"),

    ("rest.particulate.v1", "air_quality_pm25"),

    ("rest.level.v1", "water_tank_level")
]


def collect_rest_sensors():

    while True:

        for schema, sensor in REST_SENSORS:

            url = f"{BASE_URL}/api/sensors/{sensor}"

            try:
                response = requests.get(url, timeout=5)
                response.raise_for_status()

                payload = response.json()

                events = normalize_event(schema, payload)

                for event in events:
                    print(json.dumps(event, indent=2))

            except Exception as e:
                print(f"Errore nel sensore {sensor}: {e}")

        # polling every 5 seconds
        time.sleep(5)


if __name__ == "__main__":
    collect_rest_sensors()
