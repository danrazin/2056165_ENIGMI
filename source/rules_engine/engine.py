import json
import threading
from flask import Flask, request, jsonify
from kafka import KafkaConsumer
import time
from kafka.errors import NoBrokersAvailable

import database
import actuators

sensor_mem={}

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
        print(f"ERROR: Invalid operator {operator}")
        return False
    
def process_sensor_data(event,all_rules):
    sensor_id=event.get("sensor_id")
    value=event.get("value")
    if sensor_id is None or value is None:
        print("ERROR: Invalid sensor data format")
        return
    
    sensor_mem[sensor_id]=value

    for rule in all_rules:
        if rule['sensor_name']==sensor_id:
            print(f"DEBUG:Valuto rule {rule['rule_id']} per {sensor_id}")

            if evaluate_condition(value,rule['operator'],rule['threshold']):
                actuators.trigger_actuator(rule['actuator'],rule['action'])


        
# FLASK API
app=Flask(__name__)

@app.route("/api/state",methods=['GET'])
def api_get_state():
    return jsonify(sensor_mem),200

@app.route("/api/actuators", methods=['GET'])
def api_get_actuators_state():
    actuators_state=actuators.get_actuators_state()
    return jsonify(actuators_state),200


@app.route("/api/rules", methods=['GET','POST'])
def api_manage_rules():
    if request.method=='GET':
        rules=database.get_all_rules()
        return jsonify(rules),200
    
    elif request.method == 'POST':
        data = request.json

        try:
            condition = data['condition'].strip()
            cond_parts = condition.split()
            
            sensor = cond_parts[0]
            op = cond_parts[1]
            threshold = float(cond_parts[2])

            action_str = data['action'].strip()
            act_parts = action_str.split()

            if "set" in action_str.lower():
                actuator = act_parts[1]
                action = act_parts[3]
            else:
                actuator = act_parts[0]
                action = act_parts[1]

            description = data.get('description', f"Rule for {sensor}")
            
            if sensor in sensor_mem:
                current_value = sensor_mem[sensor]
                print(f"DEBUG: Controllo immediato nuova regola per {sensor} con valore {current_value}")
                if evaluate_condition(current_value, op, threshold):
                    print(f"DEBUG: La nuova regola è già VERA! Attivo {actuator}")
                    actuators.trigger_actuator(actuator, action)

            database.add_rule(description, sensor, op, threshold, actuator, action) 
                         
            return jsonify({"status": "success", "message": "Rule added"}), 201
        except Exception as e:
            print(f"DEBUG ERROR: {str(e)}")
            return jsonify({"status": "error", "message": str(e)}), 400
    
@app.route("/api/rules/<int:rule_id>", methods=['DELETE'])
def api_delete_rule(rule_id):
    database.delete_rule(rule_id)
    return jsonify({"message":"Rule deleted successfully"}),200

def run_api():
    app.run(host='0.0.0.0', port=5000, debug=False)

#KAFKA CONSUMER THREAD
def run_kafka_consumer():
    consumer = None
    while consumer is None:
        try:
            consumer = KafkaConsumer(
                'mars_normalized_events',
                bootstrap_servers=['kafka:9092'],
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='earliest',
                group_id='rules-engine-group'
            )
            print("CONNESSO A KAFKA!")
        except NoBrokersAvailable:
            print("Kafka non pronto, riprovo in 5 secondi...")
            time.sleep(5)

    for message in consumer:
        event = message.value
        curr_rules=database.get_all_rules()
        process_sensor_data(event,curr_rules)

if __name__=="__main__":
    database.init_db()

    threading.Thread(target=run_api,daemon=True).start()

    run_kafka_consumer()