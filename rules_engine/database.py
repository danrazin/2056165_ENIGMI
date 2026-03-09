import os
import sqlite3

#DEFINE DATABASE PATH INTO THE CURRENT DIRECTORY
DB_NAME = os.path.join(os.path.dirname(__file__), 'rules.db')

#INITIALIZE DATABASE AND CREATE TABLE IF NOT EXISTS
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
                CREATE TABLE IF NOT EXISTS rules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sensor_name TEXT NOT NULL,
                    operator TEXT NOT NULL,
                    threshold_value REAL NOT NULL,
                    actuator_name TEXT NOT NULL,
                    action_state TEXT NOT NULL
                )
            ''')
    conn.commit()
    conn.close()

#GET RULES FOR A SPECIFIC SENSOR
def get_rules_for_sensor(sensor_name):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT operator, threshold_value, actuator_name, action_state FROM rules WHERE sensor_name = ?", (sensor_name,))
    rules = cursor.fetchall()
    conn.close()
    return rules

#ADD NEW RULE
def add_rule(sensor_name, operator, threshold, actuator, action):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
                   INSERT INTO rules (sensor_name, operator,threshold_value, actuator_name, action_state)
                   VALUES(?,?,?,?,?)
                   ''', (sensor_name,operator,threshold,actuator,action))
    conn.commit()
    conn.close()

#DELETE RULE
def delete_rule(rule_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM rules WHERE id = ?", (rule_id,))
    conn.commit()
    conn.close()

#GET ALL RULES
def get_all_rules():
    conn=sqlite3.connect(DB_NAME)
    cursor=conn.cursor()
    cursor.execute("SELECT * FROM rules")
    rules=cursor.fetchall()
    conn.close()
    return [{"id":r[0],
             "sensor_name":r[1],
             "operator":r[2],
             "threshold":r[3],
             "actuator":r[4],
             "action":r[5]}
             for r in rules]