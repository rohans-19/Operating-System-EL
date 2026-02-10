from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import subprocess
import threading
import queue
import os

app = Flask(__name__)
CORS(app)

SANDBOX = "./sandbox"
CODE_FILE = "./tmp/user.c"
BIN_FILE = "./tmp/user.bin"

proc = None
output_queue = queue.Queue()

def reader(pipe, q):
    for line in iter(pipe.readline, ''):
        q.put(line)
    pipe.close()

@app.route("/")
def index():
    return "Backend is running!"

@app.route("/run", methods=["POST"])
def run_code():
    global proc, output_queue
    
    code = request.json["code"]
    
    os.makedirs("./tmp", exist_ok=True)
    
    with open(CODE_FILE, "w") as f:
        f.write(code)
    
    compile_proc = subprocess.run(
        ["gcc", CODE_FILE, "-o", BIN_FILE],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    if compile_proc.returncode != 0:
        return jsonify({
            "output": compile_proc.stderr,
            "status": "COMPILATION ERROR"
        })
    
    proc = subprocess.Popen(
        ["stdbuf", "-o0", SANDBOX, BIN_FILE],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    output_queue = queue.Queue()
    threading.Thread(target=reader, args=(proc.stdout, output_queue), daemon=True).start()
    
    return jsonify({"status": "RUNNING"})

@app.route("/stdin", methods=["POST"])
def send_input():
    global proc
    
    if proc is None or proc.poll() is not None:
        return jsonify({"status": "NO PROCESS"})
    
    data = request.json["input"]
    proc.stdin.write(data + "\n")
    proc.stdin.flush()
    
    return jsonify({"status": "SENT"})

@app.route("/stdout", methods=["GET"])
def get_output():
    global proc
    
    out = ""
    while not output_queue.empty():
        out += output_queue.get()
    
    if proc and proc.poll() is not None:
        return jsonify({"output": out, "status": "FINISHED"})
    
    return jsonify({"output": out, "status": "RUNNING"})

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
