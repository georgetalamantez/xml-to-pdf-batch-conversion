const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const logContainer = document.getElementById('logContainer');
const statusIndicator = document.getElementById('statusIndicator');
const sourceDirInput = document.getElementById('sourceDir');
const outputDirInput = document.getElementById('outputDir');
const analysisResult = document.getElementById('analysisResult');
const analysisContent = document.getElementById('analysisContent');

let pollInterval = null;
let isRunning = false;

// --- Helper Functions ---

function updateStatus(running) {
    isRunning = running;
    const dot = statusIndicator.querySelector('span:first-child');
    const text = statusIndicator.querySelector('span:last-child');

    if (running) {
        dot.className = "h-3 w-3 rounded-full bg-green-500 animate-pulse";
        text.textContent = "Running";
        text.className = "text-sm text-green-600 font-medium";
        startBtn.disabled = true;
        stopBtn.disabled = false;
        sourceDirInput.disabled = true;
        outputDirInput.disabled = true;
    } else {
        dot.className = "h-3 w-3 rounded-full bg-gray-400";
        text.textContent = "Idle";
        text.className = "text-sm text-gray-500 font-medium";
        startBtn.disabled = false;
        stopBtn.disabled = true;
        sourceDirInput.disabled = false;
        outputDirInput.disabled = false;
    }
}

function appendLogs(logs) {
    if (!logs || logs.length === 0) return;

    // Remove "Waiting to start..." message if present
    if (logContainer.querySelector('.italic')) {
        logContainer.innerHTML = '';
    }

    const wasScrolledToBottom = logContainer.scrollHeight - logContainer.scrollTop === logContainer.clientHeight;

    logs.forEach(line => {
        const div = document.createElement('div');
        div.textContent = line;

        // Colorize simple success/error lines
        if (line.includes('✓') || line.includes('Success')) div.classList.add('text-green-400');
        if (line.includes('✗') || line.includes('Failed') || line.includes('Error')) div.classList.add('text-red-400');
        if (line.includes('Warning')) div.classList.add('text-yellow-400');

        logContainer.appendChild(div);
    });

    if (wasScrolledToBottom) {
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

// --- API Interactions ---

async function fetchStatus() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        updateStatus(data.is_running);
    } catch (err) {
        console.error("Failed to fetch status", err);
    }
}

async function fetchLogs() {
    try {
        const res = await fetch('/api/logs');
        const data = await res.json();
        appendLogs(data.logs);
    } catch (err) {
        console.error("Failed to fetch logs", err);
    }
}

async function startConversion() {
    const sourceDir = sourceDirInput.value;
    const outputDir = outputDirInput.value;

    if (!sourceDir || !outputDir) {
        alert("Please provide both source and output directories.");
        return;
    }

    try {
        const res = await fetch('/api/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source_dir: sourceDir, output_dir: outputDir })
        });

        if (!res.ok) {
            const err = await res.json();
            alert(`Error: ${err.detail}`);
            return;
        }

        logContainer.innerHTML = ''; // Clear logs on new run
        appendLogs(["--- Starting Conversion ---"]);
        updateStatus(true);
        startPolling();

    } catch (err) {
        alert(`Network Error: ${err.message}`);
    }
}

async function stopConversion() {
    try {
        await fetch('/api/stop', { method: 'POST' });
        appendLogs(["\n--- Stop Signal Sent ---"]);
    } catch (err) {
        console.error("Failed to stop", err);
    }
}

async function runAnalysis() {
    analysisResult.classList.add('hidden');
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    try {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source_dir: sourceDirInput.value,
                pdf_dir: outputDirInput.value
            })
        });

        const data = await res.json();

        if (data.stdout) {
            analysisContent.textContent = data.stdout;
            analysisResult.classList.remove('hidden');
            // Scroll to analysis
            analysisResult.scrollIntoView({ behavior: 'smooth' });
        } else if (data.stderr) {
            alert(`Analysis Error:\n${data.stderr}`);
        }

    } catch (err) {
        alert(`Analysis failed: ${err.message}`);
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analyze Results";
    }
}

// --- Polling ---
function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
        await fetchLogs();
        await fetchStatus();
    }, 1000);
}

// --- Initialization ---

startBtn.addEventListener('click', startConversion);
stopBtn.addEventListener('click', stopConversion);
analyzeBtn.addEventListener('click', runAnalysis);
clearLogsBtn.addEventListener('click', () => {
    logContainer.innerHTML = '<div class="text-gray-500 italic">Logs cleared</div>';
});

// Initial check
fetchStatus();
startPolling();
