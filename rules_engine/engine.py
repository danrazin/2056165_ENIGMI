import json
import threading
from flask import Flask, request, jsonify
from kafka import KafkaConsumer

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
    
def process_sensor_data(event):
    sensor_id=event.get("sensor_id")
    value=event.get("value")
    if sensor_id is None or value is None:
        print("ERROR: Invalid sensor data format")
        return
    
    sensor_mem[sensor_id]=value
    rules=database.get_rules_for_sensor(sensor_id)

    for operator,threshold,actuator,action in rules:
        if evaluate_condition(value,operator,threshold):
            actuators.trigger_actuator(actuator,action)
        
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
    elif request.method=='POST':
        data=request.get_json()
        sensor_name=data.get("sensor_name")
        operator=data.get("operator")
        threshold=data.get("threshold")
        actuator=data.get("actuator")
        action=data.get("action")

        if not all([sensor_name,operator,threshold,actuator,action]):
            return jsonify({"error":"Missing fields"}),400
        
        database.add_rule(sensor_name,operator,threshold,actuator,action)
        return jsonify({"message":"Rule added successfully"}),201
    
@app.route("/api/rules/<int:rule_id>", methods=['DELETE'])
def api_delete_rule(rule_id):
    database.delete_rule(rule_id)
    return jsonify({"message":"Rule deleted successfully"}),200

def run_api():
    app.run(host='0.0.0.0', port=5000)

#KAFKA CONSUMER THREAD
def run_kafka_consumer():
    consumer=KafkaConsumer(
        'mars_normalized_events',
        bootstrap_servers=['kafka:9092'],
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    )

    for message in consumer:
        event=message.value
        process_sensor_data(event)

if __name__=="__main__":
    database.init_db()

    threading.Thread(target=run_api,daemon=True).start()

    run_kafka_consumer()