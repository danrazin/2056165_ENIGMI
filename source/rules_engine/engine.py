import json
import threading
import time
from flask import Flask, request, jsonify
from kafka import KafkaConsumer
import time
from kafka.errors import NoBrokersAvailable
from flask_cors import CORS

import database
import actuators

# LOCAL MEMORY TO  HAVE THE CURRENT VALUE OF THE SENSORS
sensor_mem={}

# EVALUATE IF A SENSOR RESPECT A CONDITION
def evaluate_condition(value,operator,threshold):
    if operator=="<":
        return value<threshold
    elif operator==">":
        return value>threshold
    elif operator=="==":
        return value==threshold
    elif operator=="<=":
        return value<=threshold
    elif operator==">=":
        return value>=threshold
    elif operator=="!=":
        return value!=threshold
    else:
        return False

# FIND THE RULES FOR THE SPECIFIC SENSOR AND CHECK IF THEY ARE VALID OR NOT
def process_sensor_data(event):
    sensor_id=event.get("sensor_id")
    value=event.get("value")
    if sensor_id is None or value is None:
        return
    
    sensor_mem[sensor_id]=value

    rules=database.get_rules_for_sensor(sensor_id)

    for rule in rules:
        if evaluate_condition(value,
                              rule[0],  # OPERATOR
                              rule[1] #THRESHOLD
                              ):
            actuators.trigger_actuator(
                rule[2],    # ACTUATOR
                rule[3]     # ACTION
                )
        # CHECK WHEN RULE IS NOT VALID ANYMORE
        else:
            inverse_action = "OFF" if rule[3].upper() == "ON" else "ON"
            actuators.trigger_actuator(rule[2], inverse_action)

        
# FLASK API
app=Flask(__name__)
CORS(app)

# TO GET THE VALUES OF THE SENSORS
@app.route("/api/state",methods=['GET'])
def api_get_state():
    return jsonify(sensor_mem),200

# TO GET THE STATE OF THE ACTUATORS
@app.route("/api/actuators", methods=['GET'])
def api_get_actuators_state():
    actuators_state = actuators.get_actuators_state()

    if "actuators" in actuators_state:
        actuators_state = actuators_state["actuators"]

    # ON/OFF -> true/false
    normalized = {
        k: (v.upper() == "ON") for k, v in actuators_state.items()
    }

    return jsonify(normalized), 200

@app.route("/api/actuators/toggle", methods=['POST'])
def api_toggle_actuator():
    data = request.json
    actuator = data.get("actuator")
    action = data.get("action")

    if actuator is None or action is None:
        return jsonify({"error": "invalid request"}), 400

    actuators.trigger_actuator(actuator, action)

    return jsonify({"status": "ok"}), 200

# MANAGER OF TH RULES
# GET -> RETURN ALL THE RULES THAT EXIST
# POST -> CREATE A NEW RULE, AND CHECK IF SOME SENSOR RESPECT IT
@app.route("/api/rules", methods=['GET','POST'])
def api_manage_rules():

    # GET METHOD
    if request.method=='GET':
        rules=database.get_all_rules()
        return jsonify(rules),200
    
    # POST METHOD
    elif request.method == 'POST':
        data = request.json

        try:
            # CONDITION ARRIVES LIKE "humidity > 25" -> SPLIT IT TO SEND IT CLEARLY INTO THE DATABASE AND CHECK IT
            # ACTION ARRIVES LIKE "cooling_fan ON" or "cooling_fan SET ON" -> SPLIT IT TO HAVE CLEARER INFO

            condition = data['condition'].strip()
            cond_parts = condition.split()
            
            sensor = cond_parts[0]
            op = cond_parts[1]
            threshold = float(cond_parts[2])

            action_str = data['action'].strip()
            # NORMALIZE THE ACTION STRING TO EXTRACT ACTUATOR AND ACTION
            #   SUPPORTED FORMATS:
            #   "cooling_fan ON"
            #   "set cooling_fan ON"
            #   "set cooling_fan to ON"
            #   "cooling_fan to OFF"
            parts = [tok for tok in action_str.split() if tok.upper() not in ("SET", "TO")]
            if len(parts) < 2:
                raise ValueError(f"invalid action format: '{action_str}'")
            actuator = parts[0]
            action = parts[1]

            description = data.get('description', f"Rule for {sensor}")
            
            if sensor in sensor_mem:
                current_value = sensor_mem[sensor]
                if evaluate_condition(current_value, op, threshold):
                    actuators.trigger_actuator(actuator, action)
                else:

                    # CHECK IF THE RULE IS NOT VALID ANYMORE
                    inverse_action = "OFF" if action.upper() == "ON" else "ON"
                    actuators.trigger_actuator(actuator, inverse_action)

            rule_id = database.add_rule(description, sensor, op, threshold, actuator, action) 
                         
            return jsonify({"status": "success", "message": "Rule added", "rule_id": rule_id}), 201
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 400
    
# TO DELETE A RULE
@app.route("/api/rules/<int:rule_id>", methods=['DELETE'])
def api_delete_rule(rule_id):
    database.delete_rule(rule_id)
    return jsonify({"message":"Rule deleted successfully"}),200

# RUN THE SERVICE
def run_api():
    app.run(host='0.0.0.0', port=5000, debug=False)

#KAFKA CONSUMER THREAD
def run_kafka_consumer():
    consumer = None
    while consumer is None:
        try:
            consumer = KafkaConsumer(
                'mars_normalized_events',   # KAFKA TOPIC
                bootstrap_servers=['kafka:9092'],   # CONTAINER
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='earliest',
                group_id='rules-engine-group'
            )
        except NoBrokersAvailable:
            time.sleep(0.5)

    # CHECK THE RULES WHEN NEW SENSOR VALUES ARRIVES
    for message in consumer:
        event = message.value
        process_sensor_data(event)

        # TO LET US CHECK IF ACTUATORS CHENGED
        time.sleep(0.1)


if __name__=="__main__":
    
    #INITIALIZE SB
    database.init_db()
    
    # CREATE A THREAD TO RUN FLASK AND KAFKA TOGETHER
    threading.Thread(target=run_api,daemon=True).start()

    # RUN KAFKA
    run_kafka_consumer()