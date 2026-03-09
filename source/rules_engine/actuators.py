import requests

#LOCAL TEST
SIMULATOR_URL = "http://simulator:8080/api/actuators"

# SET ACTUATOR STATE
def trigger_actuator(actuator_name,action_state):
    url = f"{SIMULATOR_URL}/{actuator_name}"

    val = 1 if action_state=="ON" else 0
    payload = {"value": val}

    try:
        resp = requests.post(url,json=payload, timeout=2)
        if resp.status_code == 200:
            print(f"SUCCESS : Actuator {actuator_name} set on {action_state}")
        else:
            print(f"ERROR -> Simulator response: {resp.status_code}")
    except requests.exceptions.RequestException:
        print(f"NETWORK ERROR")
    
# GET CURRENT STATE OF ALL ACTUATORS
def get_actuators_state():
    try:
        resp=requests.get(SIMULATOR_URL,timeout=2)
        if resp.status_code==200:
            return resp.json()
        return {"actuators":{}}
    except requests.exceptions.RequestException:
        return {"actuators":{}}