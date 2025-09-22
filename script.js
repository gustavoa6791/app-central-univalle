document.addEventListener('DOMContentLoaded', () => {
    let sessionActive = false, timerRunning = false;
    let sessionStartTime, timerInterval;
    let currentCycle = 0, currentTask = 0;
    const NUM_TASKS = 5;
    let NUM_CYCLES = 30;
    let timeData = [];
    let lastLapTime = 0;
    let accumulatedTimeBeforePause = 0;

    const $ = (selector) => document.getElementById(selector);
    const encargadoInput = $('encargado'), fechaInput = $('fecha'), ciclosInput = $('ciclos');
    const sessionBtn = $('session-btn'), recordBtn = $('record-btn'), exportBtn = $('export-btn'), changeCycleBtn = $('change-cycle-btn');
    const timerDisplay = $('timer-display'), cycleCounter = $('cycle-counter');
    const startTimeDisplay = $('start-time-display'), endTimeDisplay = $('end-time-display');
    const tableBody = $('time-table-body');
    
    // CORRECCIÓN: Función simplificada. El estilo :disabled se encarga del estado visual.
    const setRecordButtonState = (enabled) => {
        recordBtn.disabled = !enabled;
        if (enabled) {
            recordBtn.classList.add('btn-success');
        } else {
            recordBtn.classList.remove('btn-success');
        }
    };

    const initializeApp = () => {
        fechaInput.value = new Date().toLocaleDateString('es-ES');
        NUM_CYCLES = parseInt(ciclosInput.value) || 30;
        timeData = Array.from({ length: NUM_CYCLES }, () => Array.from({ length: NUM_TASKS }, () => ({ T: null, L: null })));
        generateTable();
        updateStats();
        
        // Estado inicial
        if (!sessionActive) {
            setRecordButtonState(false);
            changeCycleBtn.disabled = true;
            exportBtn.disabled = true;
        }
    };

    const generateTable = () => {
        tableBody.innerHTML = '';
        for (let i = 0; i < NUM_CYCLES; i++) {
            const row = document.createElement('tr');
            let cells = `<td class="px-3 py-2 font-medium text-gray-800 text-left">${i + 1}</td>`;
            for (let j = 0; j < NUM_TASKS; j++) {
                cells += `<td id="cell-${i}-${j}-T" class="px-2 py-2 timer-display border-l">0:00:00</td>
                          <td id="cell-${i}-${j}-L" class="px-2 py-2 timer-display border-l border-r">0:00:00</td>`;
            }
            row.innerHTML = cells;
            tableBody.appendChild(row);
        }
    };
    
    ciclosInput.addEventListener('change', initializeApp);

    const formatTime = (ms) => {
        if (ms === null || isNaN(ms)) return '0:00:00';
        const date = new Date(ms);
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0').slice(0, 2);
        return `${minutes}:${seconds}:${milliseconds}`;
    };

    const updateTimer = () => {
        timerDisplay.textContent = formatTime(Date.now() - sessionStartTime);
    };

    const startTimer = () => {
        if (!timerRunning) {
            sessionStartTime = Date.now() - accumulatedTimeBeforePause;
            timerInterval = setInterval(updateTimer, 10);
            timerRunning = true;
        }
    };

    const stopTimer = () => {
        if (timerRunning) {
            clearInterval(timerInterval);
            accumulatedTimeBeforePause = Date.now() - sessionStartTime;
            timerRunning = false;
        }
    };
    
    const updateHighlight = () => {
        document.querySelectorAll('.highlight').forEach(cell => cell.classList.remove('highlight'));
        if (sessionActive && currentCycle < NUM_CYCLES && currentTask < NUM_TASKS) {
            const cell = $(`cell-${currentCycle}-${currentTask}-L`);
            if (cell) {
                cell.classList.add('highlight');
                cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const updateStats = () => {
        for (let task = 0; task < NUM_TASKS; task++) {
            const durations = timeData.map(row => row[task].T).filter(d => d !== null);
            
            const totalMs = durations.reduce((sum, d) => sum + d, 0);
            $(`total-${task}`).textContent = formatTime(totalMs);
            
            const obsCount = durations.length;
            $(`obs-${task}`).textContent = obsCount;

            const avgMs = obsCount > 0 ? totalMs / obsCount : 0;
            $(`avg-${task}`).textContent = formatTime(avgMs);

            const minMs = obsCount > 0 ? Math.min(...durations) : 0;
            $(`min-${task}`).textContent = formatTime(minMs);

            const maxMs = obsCount > 0 ? Math.max(...durations) : 0;
            $(`max-${task}`).textContent = formatTime(maxMs);
        }
    };
    
    const endSession = () => {
        sessionActive = false;
        stopTimer();
        sessionBtn.textContent = 'Iniciar Sesión';
        sessionBtn.classList.replace('btn-danger', 'btn-primary');
        setRecordButtonState(false);
        changeCycleBtn.disabled = true;
        exportBtn.disabled = false;
        encargadoInput.disabled = false;
        ciclosInput.disabled = false;
        endTimeDisplay.textContent = new Date().toLocaleTimeString('es-ES');
        updateHighlight();
        updateStats();
    };

    sessionBtn.addEventListener('click', () => {
        if (!sessionActive) { // Start Session
            if (encargadoInput.value.trim() === '') {
                alert('Por favor, ingresa el nombre del encargado para iniciar.');
                return;
            }
            sessionActive = true;
            sessionBtn.textContent = 'Finalizar Sesión';
            sessionBtn.classList.replace('btn-primary', 'btn-danger');
            setRecordButtonState(true);
            changeCycleBtn.disabled = false;
            exportBtn.disabled = true;
            encargadoInput.disabled = true;
            ciclosInput.disabled = true;
            startTimeDisplay.textContent = new Date().toLocaleTimeString('es-ES');
            endTimeDisplay.textContent = '-';
            currentCycle = 0;
            currentTask = 0;
            lastLapTime = 0;
            accumulatedTimeBeforePause = 0;
            cycleCounter.textContent = '1';
            initializeApp();
            startTimer();
            updateHighlight();
        } else { // End Session
            endSession();
        }
    });

    recordBtn.addEventListener('click', () => {
        if (!sessionActive || !timerRunning || recordBtn.disabled) return;

        const currentTime = Date.now() - sessionStartTime;
        const taskDuration = currentTime - lastLapTime; 

        timeData[currentCycle][currentTask] = { T: taskDuration, L: currentTime };
        
        $(`cell-${currentCycle}-${currentTask}-T`).textContent = formatTime(taskDuration);
        $(`cell-${currentCycle}-${currentTask}-L`).textContent = formatTime(currentTime);
        
        lastLapTime = currentTime;
        updateStats();

        currentTask++;
        if (currentTask >= NUM_TASKS) {
            setRecordButtonState(false);
            if (currentCycle >= NUM_CYCLES - 1) {
               changeCycleBtn.disabled = true;
            }
        }
        updateHighlight();
    });

    changeCycleBtn.addEventListener('click', () => {
        if (!sessionActive || changeCycleBtn.disabled) return;
        
        lastLapTime = Date.now() - sessionStartTime;

        updateStats(); 
        currentCycle++;
        currentTask = 0;
        cycleCounter.textContent = currentCycle + 1;
        setRecordButtonState(true);
        updateHighlight();
        
        if (currentCycle >= NUM_CYCLES) {
            endSession();
        }
    });

    exportBtn.addEventListener('click', () => {
        if (exportBtn.disabled) return;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ENCARGADO," + encargadoInput.value + "\n";
        csvContent += "FECHA," + fechaInput.value + "\n\n";

        const headers = ["Ciclo", ...Array.from({length: NUM_TASKS}, (_, i) => [document.querySelectorAll('thead th[colspan="2"]')[i].textContent + " (T)", document.querySelectorAll('thead th[colspan="2"]')[i].textContent + " (L)"]).flat()];
        csvContent += headers.join(",") + "\n";

        timeData.forEach((row, index) => {
            if(row.every(task => task.T === null)) return; 
            const formattedRow = row.map(cell => `${formatTime(cell.T)},${formatTime(cell.L)}`);
            csvContent += `${index + 1},${formattedRow.join(",")}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `toma_de_tiempos_${fechaInput.value.replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    initializeApp();
});

