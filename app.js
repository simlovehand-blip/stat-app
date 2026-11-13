let statsData = [];
let currentTeam = "自チーム";
let currentPhase = "前半";
let currentNumber = "";
let currentX = "";
let currentY = "";

// モーダル用の一時保存変数
let pendingAction = "";
let currentShotType = "6m";

// ==========================================
// タイマー管理
// ==========================================
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

// ==========================================
// トグルボタン処理 (チーム & 前後半)
// ==========================================
const btnTeamOwn = document.getElementById('btn-team-own');
const btnTeamOpp = document.getElementById('btn-team-opp');
const btnFirstHalf = document.getElementById('btn-first-half');
const btnSecondHalf = document.getElementById('btn-second-half');

btnTeamOwn.addEventListener('click', () => { currentTeam = "自チーム"; btnTeamOwn.classList.add('active'); btnTeamOpp.classList.remove('active'); });
btnTeamOpp.addEventListener('click', () => { currentTeam = "相手チーム"; btnTeamOpp.classList.add('active'); btnTeamOwn.classList.remove('active'); });
btnFirstHalf.addEventListener('click', () => { currentPhase = "前半"; btnFirstHalf.classList.add('active'); btnSecondHalf.classList.remove('active'); });
btnSecondHalf.addEventListener('click', () => { currentPhase = "後半"; btnSecondHalf.classList.add('active'); btnFirstHalf.classList.remove('active'); });

// ==========================================
// 背番号入力 & コートタップ
// ==========================================
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
    const tapX = Math.round(e.clientX - rect.left);
    const tapY = Math.round(e.clientY - rect.top);
    
    tapMarker.style.display = "block";
    tapMarker.style.left = tapX + "px";
    tapMarker.style.top = tapY + "px";

    if (currentPhase === "後半") {
        currentX = Math.round(rect.width - tapX);
        currentY = Math.round(rect.height - tapY);
    } else {
        currentX = tapX;
        currentY = tapY;
    }
});

// ==========================================
// アクション記録 ＆ モーダル制御
// ==========================================
const shotModal = document.getElementById('shot-modal');
const modalTitle = document.getElementById('modal-title');

document.querySelectorAll('.action-btn').forEach(btn => {
    // PDF・設定・CSVボタンなどの特殊ボタンは除外
    if(btn.id === 'btn-preview-pdf' || btn.id === 'btn-roster-settings' || btn.id === 'btn-export') return;

    btn.addEventListener('click', (e) => {
        const actionName = e.target.getAttribute('data-action');
        if (!actionName) return;
        if (currentNumber === "") { alert("先に背番号を入力してください！"); return; }
        
        if (actionName === "得点" || actionName === "GKセーブ" || actionName === "枠外ミス") {
            pendingAction = actionName;
            modalTitle.innerText = `[${actionName}] の詳細を記録`;
            shotModal.style.display = "flex";
        } else {
            saveData(actionName, "", "");
        }
    });
});

document.querySelectorAll('.shot-type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.shot-type-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentShotType = e.target.getAttribute('data-type');
    });
});

document.querySelectorAll('.goal-zone').forEach(zone => {
    zone.addEventListener('click', (e) => {
        const course = e.target.getAttribute('data-zone');
        saveData(pendingAction, currentShotType, course);
        shotModal.style.display = "none";
    });
});

document.getElementById('btn-cancel-shot').addEventListener('click', () => {
    shotModal.style.display = "none";
    pendingAction = "";
});

// データ保存処理
function saveData(action, shotType, course) {
    const timeStr = getCurrentTimeStr();
    const activeGkInput = document.getElementById('active-gk-num');
    const activeGK = activeGkInput ? activeGkInput.value : "";

    statsData.push({
        team: currentTeam, phase: currentPhase, time: timeStr,
        number: currentNumber, action: action, x: currentX, y: currentY,
        shotType: shotType, course: course,
        activeGK: activeGK 
    });

    currentNumber = ""; displayNumber.innerText = "未選択";
    currentX = ""; currentY = ""; tapMarker.style.display = "none";
    updateHistory();
}

// ==========================================
// 履歴更新・Undo・CSV出力
// ==========================================
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
    
    let csvContent = "チーム,前後半,時間,背番号,プレー内容,X座標,Y座標,シュート種類,コース,出場中GK\n";
    
    statsData.forEach(row => {
        csvContent += `${row.team},${row.phase},${row.time},${row.number},${row.action},${row.x},${row.y},${row.shotType},${row.course},${row.activeGK}\n`;
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `handball_stats_official.csv`;
    link.click();
});

// ==========================================
// 名簿設定の動作処理
// ==========================================
const rosterModal = document.getElementById('roster-modal');
const rosterInput = document.getElementById('roster-input');

document.getElementById('btn-roster-settings').addEventListener('click', () => {
    let saved = localStorage.getItem('statAppRoster');
    let text = "";
    if (saved) {
        const parsed = JSON.parse(saved);
        for (let num in parsed) {
            text += `${num},${parsed[num]}\n`;
        }
    } else {
        text = "1,長谷部(GK)\n2,高知 太郎\n"; // 初期の入力例
    }
    rosterInput.value = text;
    rosterModal.style.display = 'flex';
});

document.getElementById('btn-close-roster').addEventListener('click', () => {
    rosterModal.style.display = 'none';
});

document.getElementById('btn-save-roster').addEventListener('click', () => {
    const lines = rosterInput.value.split('\n');
    let newRoster = {};
    
    lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 2) {
            const num = parts[0].trim();
            const name = parts[1].trim();
            if (num !== "" && name !== "") {
                newRoster[num] = name;
            }
        }
    });

    localStorage.setItem('statAppRoster', JSON.stringify(newRoster));
    alert('自チームの選手名簿を保存しました！');
    rosterModal.style.display = 'none';
});

// ==========================================
// ランニングスコア＆個人成績の自動生成とPDF出力
// ==========================================
const pdfModal = document.getElementById('pdf-modal');
const btnPreviewPdf = document.getElementById('btn-preview-pdf');
const btnClosePdf = document.getElementById('btn-close-pdf');
const btnDownloadPdf = document.getElementById('btn-download-pdf');

btnPreviewPdf.addEventListener('click', () => {
    generateScoreSheet(); 
    pdfModal.style.display = 'block'; 
});

btnClosePdf.addEventListener('click', () => {
    pdfModal.style.display = 'none';
});

function generateScoreSheet() {
    // --- 1. ランニングスコアの生成 ---
    const tbody1 = document.getElementById('tbody-first-half');
    const tbody2 = document.getElementById('tbody-second-half');
    tbody1.innerHTML = '';
    tbody2.innerHTML = '';

    let scoreA = 0; 
    let scoreB = 0; 

    statsData.forEach(row => {
        let resultStr = "";
        let isRecordable = false;

        if (row.action === "得点" || row.action === "7mスロー") {
            if (row.team === "自チーム") scoreA++;
            if (row.team === "相手チーム") scoreB++;
            resultStr = "";
            isRecordable = true;
        } else if (row.action === "警告(W)") {
            resultStr = "W"; isRecordable = true;
        } else if (row.action === "2分退場") {
            resultStr = "S"; isRecordable = true;
        } else if (row.action === "失格(D)") {
            resultStr = "D"; isRecordable = true;
        }

        if (isRecordable) {
            const tr = document.createElement('tr');
            
            if (row.team === "自チーム") {
                tr.innerHTML = `
                    <td style="padding:4px;">${row.number}</td>
                    <td style="padding:4px;">${resultStr}</td>
                    <td style="padding:4px; font-weight:bold; font-size:16px;">${resultStr === "" ? scoreA : ""}</td>
                    <td style="padding:4px; font-weight:bold;">${row.time}</td>
                    <td style="padding:4px;"></td><td style="padding:4px;"></td><td style="padding:4px;"></td>
                `;
            } else {
                tr.innerHTML = `
                    <td style="padding:4px;"></td><td style="padding:4px;"></td><td style="padding:4px;"></td>
                    <td style="padding:4px; font-weight:bold;">${row.time}</td>
                    <td style="padding:4px; font-weight:bold; font-size:16px;">${resultStr === "" ? scoreB : ""}</td>
                    <td style="padding:4px;">${resultStr}</td>
                    <td style="padding:4px;">${row.number}</td>
                `;
            }

            if (row.phase === "前半") {
                tbody1.appendChild(tr);
            } else {
                tbody2.appendChild(tr);
            }
        }
    });

    // --- 2. 個人スタッツ（成績）の集計と生成 ---
    let myTeamPlayers = {};
    const savedRoster = localStorage.getItem('statAppRoster');
    if (savedRoster) {
        myTeamPlayers = JSON.parse(savedRoster);
    }

    let statsOwn = {};
    let statsOpp = {};

    statsData.forEach(row => {
        if (!row.number) return; 
        
        let targetStats = (row.team === "自チーム") ? statsOwn : statsOpp;
        
        if (!targetStats[row.number]) {
            targetStats[row.number] = { goals: 0, w: 0, s: 0, d: 0 };
        }

        if (row.action === "得点" || row.action === "7mスロー") targetStats[row.number].goals++;
        if (row.action === "警告(W)") targetStats[row.number].w++;
        if (row.action === "2分退場") targetStats[row.number].s++;
        if (row.action === "失格(D)") targetStats[row.number].d++;
    });

    function renderIndividualTable(tbodyId, statsObj, playerList = null) {
        const tbody = document.getElementById(tbodyId);
        tbody.innerHTML = '';
        
        let totalGoals = 0, totalW = 0, totalS = 0, totalD = 0;
        
        const sortedNumbers = Object.keys(statsObj).sort((a, b) => parseInt(a) - parseInt(b));
        const rowCount = Math.max(16, sortedNumbers.length);

        for (let i = 0; i < rowCount; i++) {
            const tr = document.createElement('tr');
            tr.style.backgroundColor = (i % 2 === 0) ? "#ffccff" : "#ffffff";

            if (i < sortedNumbers.length) {
                const num = sortedNumbers[i];
                const p = statsObj[num];
                totalGoals += p.goals;
                totalW += p.w;
                totalS += p.s;
                totalD += p.d;

                let playerName = (playerList && playerList[num]) ? playerList[num] : "";

                tr.innerHTML = `
                    <td style="padding:4px; font-weight:bold;">${num}</td>
                    <td style="padding:4px; font-size:12px; text-align:left;">${playerName}</td>
                    <td style="padding:4px;">${p.goals > 0 ? p.goals : ''}</td>
                    <td style="padding:4px;">${p.w > 0 ? p.w : ''}</td>
                    <td style="padding:4px;">${p.s > 0 ? p.s : ''}</td>
                    <td style="padding:4px;">${p.d > 0 ? p.d : ''}</td>
                `;
            } else {
                tr.innerHTML = `<td style="padding:4px; height:26px;"></td><td></td><td></td><td></td><td></td><td></td>`;
            }
            tbody.appendChild(tr);
        }

        const totalTr = document.createElement('tr');
        totalTr.style.backgroundColor = "#ffccff";
        totalTr.innerHTML = `
            <td colspan="2" style="padding:4px; font-weight:bold; text-align:center;">合計</td>
            <td style="padding:4px; font-weight:bold;">${totalGoals > 0 ? totalGoals : ''}</td>
            <td style="padding:4px; font-weight:bold;">${totalW > 0 ? totalW : ''}</td>
            <td style="padding:4px; font-weight:bold;">${totalS > 0 ? totalS : ''}</td>
            <td style="padding:4px; font-weight:bold;">${totalD > 0 ? totalD : ''}</td>
        `;
        tbody.appendChild(totalTr);
    }

    renderIndividualTable('tbody-individual-own', statsOwn, myTeamPlayers);
    renderIndividualTable('tbody-individual-opp', statsOpp, null);
}

btnDownloadPdf.addEventListener('click', () => {
    btnDownloadPdf.innerText = "作成中...";
    btnDownloadPdf.disabled = true;

    const element = document.getElementById('score-sheet-container');
    const now = new Date();
    const fileName = `公式記録_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.pdf`;

    const opt = {
        margin:       0,
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        btnDownloadPdf.innerText = "↓ PDFを保存・共有";
        btnDownloadPdf.disabled = false;
    });
});

// ==========================================
// ServiceWorker登録
// ==========================================
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js'); }
