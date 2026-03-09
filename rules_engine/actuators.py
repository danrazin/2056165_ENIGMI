import requests

#LOCAL TEST
SIMULATOR_URL = "http://localhost:8080/api/actuators"

# SET ACTUATOR STATE
def trigger_actuator(actuator_name,action_state):
    url = f"{SIMULATOR_URL}/{actuator_name}"
    payload = {"state":action_state}
    headers = {'Content-Type':'application/json'}

    try:
        resp = requests.post(url,json=payload, headers=headers, timeout=2)
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