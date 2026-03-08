import asyncio
import json
import websockets

from collectors.normalizer import normalize_event


BASE_WS = "ws://localhost:8080/api/telemetry/ws"

# topic e schema associato
TOPICS = [
    ("topic.power.v1", "mars/telemetry/solar_array"),
    ("topic.power.v1", "mars/telemetry/power_bus"),
    ("topic.power.v1", "mars/telemetry/power_consumption"),

    ("topic.environment.v1", "mars/telemetry/radiation"),
    ("topic.environment.v1", "mars/telemetry/life_support"),

    ("topic.thermal_loop.v1", "mars/telemetry/thermal_loop"),

    ("topic.airlock.v1", "mars/telemetry/airlock")
]

async def consume_topic(schema, topic):

    url = f"{BASE_WS}?topic={topic}"
    # ...

async def main():

    tasks = []

    for schema, topic in TOPICS:
        tasks.append(
            asyncio.create_task(
                consume_topic(schema, topic)
            )
        )

    await asyncio.gather(*tasks)


if __name__ == "__main__":
    asyncio.run(main())
