let statsData = [];
let currentTeam = "自チーム";
let currentPhase = "前半";
let currentNumber = "";
let currentX = "";
let currentY = "";

// モーダル用の一時保存変数
let pendingAction = "";
let currentShotType = "6m";

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
    if (isRunning) { clearInterval(timerInterval); isRunning = false; }
});

btnTimerReset.addEventListener('click', () => {
    if (confirm("タイマーを00:00にリセットしますか？")) {
        clearInterval(timerInterval); isRunning = false; elapsedTime = 0; updateTimerDisplay(0);
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
// ------------------------------------
const btnTeamOwn = document.getElementById('btn-team-own');
const btnTeamOpp = document.getElementById('btn-team-opp');
const btnFirstHalf = document.getElementById('btn-first-half');
const btnSecondHalf = document.getElementById('btn-second-half');

btnTeamOwn.addEventListener('click', () => { currentTeam = "自チーム"; btnTeamOwn.classList.add('active'); btnTeamOpp.classList.remove('active'); });
btnTeamOpp.addEventListener('click', () => { currentTeam = "相手チーム"; btnTeamOpp.classList.add('active'); btnTeamOwn.classList.remove('active'); });
btnFirstHalf.addEventListener('click', () => { currentPhase = "前半"; btnFirstHalf.classList.add('active'); btnSecondHalf.classList.remove('active'); });
btnSecondHalf.addEventListener('click', () => { currentPhase = "後半"; btnSecondHalf.classList.add('active'); btnFirstHalf.classList.remove('active'); });

// ------------------------------------
// 背番号入力 & コートタップ
// ------------------------------------
const displayNumber = document.getElementById('display-number');
document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const val = e.target.innerText;
        if (val.includes('C')) { currentNumber = ""; displayNumber.innerText = "未選択"; } 
        else { currentNumber += val; displayNumber.innerText = currentNumber; }
    });
});

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

// ------------------------------------
// アクション記録 ＆ モーダル制御
// ------------------------------------
const shotModal = document.getElementById('shot-modal');
const modalTitle = document.getElementById('modal-title');

document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const actionName = e.target.getAttribute('data-action');
        if (currentNumber === "") { alert("先に背番号を入力してください！"); return; }
        
        // シュート系アクションの場合はモーダルを開く
        if (actionName === "得点" || actionName === "GKセーブ" || actionName === "枠外ミス") {
            pendingAction = actionName;
            modalTitle.innerText = `[${actionName}] の詳細を記録`;
            shotModal.style.display = "flex";
        } 
        // それ以外（アシスト、退場など）は即座に記録
        else {
            saveData(actionName, "", "");
        }
    });
});

// シュート種類（6m, 9m等）の選択
document.querySelectorAll('.shot-type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.shot-type-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentShotType = e.target.getAttribute('data-type');
    });
});

// ゴール枠（コース）がタップされたら記録確定
document.querySelectorAll('.goal-zone').forEach(zone => {
    zone.addEventListener('click', (e) => {
        const course = e.target.getAttribute('data-zone');
        saveData(pendingAction, currentShotType, course);
        shotModal.style.display = "none";
    });
});

// モーダルのキャンセル
document.getElementById('btn-cancel-shot').addEventListener('click', () => {
    shotModal.style.display = "none";
    pendingAction = "";
});

// データ保存処理
function saveData(action, shotType, course) {
    const timeStr = getCurrentTimeStr();
    statsData.push({
        team: currentTeam, phase: currentPhase, time: timeStr,
        number: currentNumber, action: action, x: currentX, y: currentY,
        shotType: shotType, course: course
    });

    currentNumber = ""; displayNumber.innerText = "未選択";
    currentX = ""; currentY = ""; tapMarker.style.display = "none";
    updateHistory();
}

// ------------------------------------
// 履歴更新・Undo・CSV出力
// ------------------------------------
const historyList = document.getElementById('history-list');
function updateHistory() {
    historyList.innerHTML = "";
    if (statsData.length === 0) { historyList.innerHTML = '<li style="color:#999;">まだ記録がありません</li>'; return; }
    const recent = statsData.slice(-3).reverse();
    recent.forEach(stat => {
        const detail = stat.course ? `(${stat.shotType}/${stat.course})` : "";
        const li = document.createElement('li');
        li.innerText = `[${stat.time}] ${stat.team} #${stat.number} ${stat.action} ${detail}`;
        historyList.appendChild(li);
    });
}

document.getElementById('btn-undo').addEventListener('click', () => {
    if (statsData.length > 0) { statsData.pop(); updateHistory(); }
});

document.getElementById('btn-export').addEventListener('click', () => {
    if (statsData.length === 0) { alert('出力するデータがありません。'); return; }
    
    // ★ 右端に「シュート種類」と「コース」の列を追加
    let csvContent = "チーム,前後半,時間,背番号,プレー内容,X座標,Y座標,シュート種類,コース\n";
    statsData.forEach(row => {
        csvContent += `${row.team},${row.phase},${row.time},${row.number},${row.action},${row.x},${row.y},${row.shotType},${row.course}\n`;
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `handball_stats_official.csv`;
    link.click();
});

if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js'); }
