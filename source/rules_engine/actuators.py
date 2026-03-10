import requests

#LOCAL TEST
SIMULATOR_URL = "http://simulator:8080/api/actuators"

# TRIGGER ACTUATOR STATE
def trigger_actuator(actuator_name, action_state):
    url = f"http://simulator:8080/api/actuators/{actuator_name.strip()}"
    
    state_str = action_state.upper().strip()
    
    payload = {"state": state_str}
    
    try:
        resp = requests.post(url, json=payload, timeout=5)
        
        if resp.status_code == 200:
            print(f"SUCCESS: {actuator_name} set on {state_str}")
        else:
            print(f"ERROR {resp.status_code}: {resp.text}")
            
    except Exception as e:
        print(f"NETWORK ERROR: {e}")
    
# GET CURRENT STATE OF ALL ACTUATORS
def get_actuators_state():
    try:
        resp=requests.get(SIMULATOR_URL,timeout=2)
        if resp.status_code==200:
            return resp.json()
        return {"actuators":{}}
    except requests.exceptions.RequestException:
        return {"actuators":{}}