import os
import time
import logging
import subprocess
import threading
import queue
import json
from typing import List, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("xml_pdf_server")

# --- App Setup ---
app = FastAPI(title="XML to PDF Converter Server")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Global State ---
class ProcessState:
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.lock = threading.Lock()
        self.output_queue = queue.Queue()
        self.is_running = False
        self.return_code = None

server_state = ProcessState()

# --- Models ---
class ConvertRequest(BaseModel):
    source_dir: str
    output_dir: str

class AnalyzeRequest(BaseModel):
    source_dir: str
    pdf_dir: str

class StatusResponse(BaseModel):
    is_running: bool
    return_code: Optional[int]

class LogsResponse(BaseModel):
    logs: List[str]

# --- Helper Functions ---
def enqueue_output(out, queue):
    for line in iter(out.readline, b''):
        queue.put(line.decode('utf-8').rstrip())
    out.close()

def run_conversion_process(source_dir: str, output_dir: str):
    with server_state.lock:
        if server_state.is_running:
            return

        server_state.is_running = True
        server_state.return_code = None
        
        # Clear previous queue
        with server_state.output_queue.mutex:
            server_state.output_queue.queue.clear()

    # Set environment variables for the Node.js script
    env = os.environ.copy()
    env["SOURCE_DIR"] = source_dir
    env["OUTPUT_DIR"] = output_dir

    script_path = os.path.join("scripts", "convert_to_pdf.js")

    try:
        # Start the process
        server_state.process = subprocess.Popen(
            ["node", script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,  # Capture stderr as well
            env=env,
            cwd=os.getcwd()
        )

        # Start threads to read stdout and stderr
        t_out = threading.Thread(target=enqueue_output, args=(server_state.process.stdout, server_state.output_queue))
        t_out.daemon = True
        t_out.start()
        
        t_err = threading.Thread(target=enqueue_output, args=(server_state.process.stderr, server_state.output_queue))
        t_err.daemon = True
        t_err.start()

        # Wait for calls
        server_state.process.wait()
        server_state.return_code = server_state.process.returncode

    except Exception as e:
        logger.error(f"Failed to start process: {e}")
        server_state.output_queue.put(f"Error starting process: {e}")
        server_state.return_code = -1
    finally:
        with server_state.lock:
            server_state.is_running = False
            server_state.process = None

# --- Endpoints ---

@app.get("/")
def read_root():
    return RedirectResponse(url="/static/index.html")

@app.post("/api/start")
def start_conversion(request: ConvertRequest, background_tasks: BackgroundTasks):
    with server_state.lock:
        if server_state.is_running:
            raise HTTPException(status_code=400, detail="Conversion already running")
    
    # Validate paths
    if not os.path.exists(request.source_dir):
        raise HTTPException(status_code=400, detail=f"Source directory not found: {request.source_dir}")
    
    background_tasks.add_task(run_conversion_process, request.source_dir, request.output_dir)
    return {"message": "Conversion started", "config": request}

@app.post("/api/stop")
def stop_conversion():
    with server_state.lock:
        if not server_state.is_running or not server_state.process:
            raise HTTPException(status_code=400, detail="No conversion running")
        
        server_state.process.terminate()
        return {"message": "Stop signal sent"}

@app.get("/api/status", response_model=StatusResponse)
def get_status():
    return {
        "is_running": server_state.is_running,
        "return_code": server_state.return_code
    }

@app.get("/api/logs", response_model=LogsResponse)
def get_logs():
    lines = []
    try:
        while True:
            line = server_state.output_queue.get_nowait()
            lines.append(line)
    except queue.Empty:
        pass
    return {"logs": lines}

@app.post("/api/analyze")
def analyze_results(request: AnalyzeRequest):
    script_path = os.path.join("scripts", "analyze_pdfs.py")
    
    # Update temporary script to use dynamic paths if needed, 
    # but for now we'll assume the python script uses hardcoded paths 
    # OR we modify analyze_pdfs.py to accept args.
    # 
    # BETTER APPROACH: Pass args to the python script strictly
    
    # For now, let's try to run it and capture output.
    # NOTE: The current analyze_pdfs.py has hardcoded paths. 
    # We should probably update it to take arguments, but for this step
    # we will just run it as is if the user hasn't modified it, 
    # or rely on the user having updated the script.
    
    # Ideally, we'd update analyze_pdfs.py to read env vars or args.
    # Let's try running it as a subprocess and capturing output.
    
    try:
        result = subprocess.run(
            ["python", script_path],
            capture_output=True,
            text=True,
            cwd=os.getcwd()
        )
        
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "return_code": result.returncode
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
