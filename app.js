let statsData = [];
let currentTeam = "自チーム";
let currentPhase = "前半";
let currentNumber = "";
let currentX = "";
let currentY = "";

// ------------------------------------
// タイマー管理
// ------------------------------------
let timerInterval = null;
let startTime = 0;
let elapsedTime = 0;
let isRunning = false;

const timerDisplay = document.getElementById('timer-display');
const btnTimerStart = document.getElementById('btn-timer-start');
const btnTimerStop = document.getElementById('btn-timer-stop');
const btnTimerReset = document.getElementById('btn-timer-reset');

function updateTimerDisplay(timeInMillis) {
    const totalSeconds = Math.floor(timeInMillis / 1000);
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    timerDisplay.innerText = `${m}:${s}`;
}

btnTimerStart.addEventListener('click', () => {
    if (!isRunning) {
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            updateTimerDisplay(elapsedTime);
        }, 1000);
        isRunning = true;
    }
});

btnTimerStop.addEventListener('click', () => {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
    }
});

btnTimerReset.addEventListener('click', () => {
    if (confirm("タイマーを00:00にリセットしますか？（後半開始時などに使用）")) {
        clearInterval(timerInterval);
        isRunning = false;
        elapsedTime = 0;
        updateTimerDisplay(0);
    }
});

function getCurrentTimeStr() {
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
}
// ------------------------------------

// トグルボタン処理
const btnTeamOwn = document.getElementById('btn-team-own');
const btnTeamOpp = document.getElementById('btn-team-opp');
const btnFirstHalf = document.getElementById('btn-first-half');
const btnSecondHalf = document.getElementById('btn-second-half');

btnTeamOwn.addEventListener('click', () => { currentTeam = "自チーム"; btnTeamOwn.classList.add('active'); btnTeamOpp.classList.remove('active'); });
btnTeamOpp.addEventListener('click', () => { currentTeam = "相手チーム"; btnTeamOpp.classList.add('active'); btnTeamOwn.classList.remove('active'); });
btnFirstHalf.addEventListener('click', () => { currentPhase = "前半"; btnFirstHalf.classList.add('active'); btnSecondHalf.classList.remove('active'); });
btnSecondHalf.addEventListener('click', () => { currentPhase = "後半"; btnSecondHalf.classList.add('active'); btnFirstHalf.classList.remove('active'); });

// 背番号入力
const displayNumber = document.getElementById('display-number');
document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const val = e.target.innerText;
        if (val.includes('C')) { currentNumber = ""; displayNumber.innerText = "未選択"; } 
        else { currentNumber += val; displayNumber.innerText = currentNumber; }
    });
});

// コートタップ
const courtArea = document.getElementById('court-area');
const tapMarker = document.getElementById('tap-marker');
courtArea.addEventListener('click', (e) => {
    const rect = courtArea.getBoundingClientRect();
    currentX = Math.round(e.clientX - rect.left);
    currentY = Math.round(e.clientY - rect.top);
    tapMarker.style.display = "block";
    tapMarker.style.left = currentX + "px";
    tapMarker.style.top = currentY + "px";
});

// アクション記録
const historyList = document.getElementById('history-list');
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const actionName = e.target.getAttribute('data-action');
        if (currentNumber === "") { alert("先に背番号を入力してください！"); return; }
        
        // ★現在時刻ではなく、タイマーの経過時間を取得する
        const timeStr = getCurrentTimeStr();
        
        statsData.push({
            team: currentTeam, phase: currentPhase, time: timeStr,
            number: currentNumber, action: actionName, x: currentX, y: currentY
        });

        currentNumber = ""; displayNumber.innerText = "未選択";
        currentX = ""; currentY = ""; tapMarker.style.display = "none";
        updateHistory();
    });
});

// 履歴更新とUndo
function updateHistory() {
    historyList.innerHTML = "";
    if (statsData.length === 0) { historyList.innerHTML = '<li style="color:#999;">まだ記録がありません</li>'; return; }
    const recent = statsData.slice(-3).reverse();
    recent.forEach(stat => {
        const li = document.createElement('li');
        li.innerText = `[${stat.time}] ${stat.team} #${stat.number} ${stat.action}`;
        historyList.appendChild(li);
    });
}
document.getElementById('btn-undo').addEventListener('click', () => {
    if (statsData.length > 0) { statsData.pop(); updateHistory(); }
});

// CSV出力
document.getElementById('btn-export').addEventListener('click', () => {
    if (statsData.length === 0) { alert('出力するデータがありません。'); return; }
    
    let csvContent = "チーム,前後半,時間,背番号,プレー内容,X座標,Y座標\n";
    statsData.forEach(row => {
        csvContent += `${row.team},${row.phase},${row.time},${row.number},${row.action},${row.x},${row.y}\n`;
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `handball_stats_official.csv`;
    link.click();
});

if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js'); }
