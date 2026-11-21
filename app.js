let statsData = [];
let currentTeam = "自チーム";
let currentPhase = "前半";
let currentNumber = "";
let currentX = "";
let currentY = "";
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
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
    }
});

btnTimerReset.addEventListener('click', () => {
    if (confirm("タイマーを00:00にリセットしますか？")) {
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

// ==========================================
// チーム・前後半トグル & 背番号入力
// ==========================================
const btnTeamOwn = document.getElementById('btn-team-own');
const btnTeamOpp = document.getElementById('btn-team-opp');
const btnFirstHalf = document.getElementById('btn-first-half');
const btnSecondHalf = document.getElementById('btn-second-half');

btnTeamOwn.addEventListener('click', () => {
    currentTeam = "自チーム";
    btnTeamOwn.classList.add('active');
    btnTeamOpp.classList.remove('active');
});
btnTeamOpp.addEventListener('click', () => {
    currentTeam = "相手チーム";
    btnTeamOpp.classList.add('active');
    btnTeamOwn.classList.remove('active');
});
btnFirstHalf.addEventListener('click', () => {
    currentPhase = "前半";
    btnFirstHalf.classList.add('active');
    btnSecondHalf.classList.remove('active');
});
btnSecondHalf.addEventListener('click', () => {
    currentPhase = "後半";
    btnSecondHalf.classList.add('active');
    btnFirstHalf.classList.remove('active');
});

const displayNumber = document.getElementById('display-number');
document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const val = e.target.innerText;
        if (val.includes('C')) {
            currentNumber = "";
            displayNumber.innerText = "未選択";
        } else {
            currentNumber += val;
            displayNumber.innerText = currentNumber;
        }
    });
});

// ==========================================
// コートタップ座標（後半は自動反転）
// ==========================================
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
// アクション記録 & シュート詳細モーダル
// ==========================================
const shotModal = document.getElementById('shot-modal');
const modalTitle = document.getElementById('modal-title');

document.querySelectorAll('.action-btn').forEach(btn => {
    if (btn.id === 'btn-preview-pdf' || btn.id === 'btn-roster-settings' || btn.id === 'btn-export') return;
    btn.addEventListener('click', (e) => {
        const actionName = e.target.getAttribute('data-action');
        if (!actionName) return;
        if (currentNumber === "") {
            alert("先に背番号を入力してください！");
            return;
        }

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
        saveData(pendingAction, currentShotType, e.target.getAttribute('data-zone'));
        shotModal.style.display = "none";
    });
});

document.getElementById('btn-cancel-shot').addEventListener('click', () => {
    shotModal.style.display = "none";
    pendingAction = "";
});

function saveData(action, shotType, course) {
    const timeStr = getCurrentTimeStr();
    const activeGkInput = document.getElementById('active-gk-num');
    const activeGK = activeGkInput ? activeGkInput.value : "";

    statsData.push({
        team: currentTeam,
        phase: currentPhase,
        time: timeStr,
        number: currentNumber,
        action: action,
        x: currentX,
        y: currentY,
        shotType: shotType,
        course: course,
        activeGK: activeGK
    });

    currentNumber = "";
    displayNumber.innerText = "未選択";
    currentX = "";
    currentY = "";
    tapMarker.style.display = "none";
    updateHistory();
}

// ==========================================
// 履歴・Undo・CSV出力
// ==========================================
const historyList = document.getElementById('history-list');

function updateHistory() {
    historyList.innerHTML = "";
    if (statsData.length === 0) {
        historyList.innerHTML = '<li style="color:#999;">まだ記録がありません</li>';
        return;
    }
    const recent = statsData.slice(-3).reverse();
    recent.forEach(stat => {
        const detail = stat.course ? `(${stat.shotType}/${stat.course})` : "";
        const li = document.createElement('li');
        li.innerText = `[${stat.time}] ${stat.team} #${stat.number} ${stat.action} ${detail}`;
        historyList.appendChild(li);
    });
}

document.getElementById('btn-undo').addEventListener('click', () => {
    if (statsData.length > 0) {
        statsData.pop();
        updateHistory();
    }
});

document.getElementById('btn-export').addEventListener('click', () => {
    if (statsData.length === 0) {
        alert('出力するデータがありません。');
        return;
    }
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
// 名簿設定モーダル
// ==========================================
function sortNumbers(keys) {
    return keys.sort((a, b) => {
        const diff = parseInt(a, 10) - parseInt(b, 10);
        return isNaN(diff) ? a.localeCompare(b) : diff;
    });
}

const rosterModal = document.getElementById('roster-modal');
const rosterInput = document.getElementById('roster-input');

document.getElementById('btn-roster-settings').addEventListener('click', () => {
    let saved = localStorage.getItem('statAppRoster');
    let text = "";
    if (saved) {
        const parsed = JSON.parse(saved);
        const sortedNums = sortNumbers(Object.keys(parsed));
        sortedNums.forEach(num => { text += `${num},${parsed[num]}\n`; });
    } else {
        text = "1,選手A(GK)\n2,選手B\n";
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
        const parts = line.split(/[,，、]/);
        if (parts.length >= 2) {
            const num = parts[0].trim();
            const name = parts.slice(1).join(' ').trim();
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
// ランニングスコア & 個人成績シート生成・PDF出力
// ==========================================
const pdfModal = document.getElementById('pdf-modal');
const pdfScrollWrapper = document.getElementById('pdf-scroll-wrapper');
const btnPreviewPdf = document.getElementById('btn-preview-pdf');
const btnClosePdf = document.getElementById('btn-close-pdf');
const btnDownloadPdf = document.getElementById('btn-download-pdf');

btnPreviewPdf.addEventListener('click', () => {
    generateScoreSheet();
    pdfModal.style.display = 'block';
    pdfModal.scrollTop = 0;
    pdfScrollWrapper.scrollLeft = 0;
});

btnClosePdf.addEventListener('click', () => {
    pdfModal.style.display = 'none';
});

function generateScoreSheet() {
    const tbody1 = document.getElementById('tbody-first-half');
    const tbody2 = document.getElementById('tbody-second-half');
    tbody1.innerHTML = '';
    tbody2.innerHTML = '';

    let scoreA = 0;
    let scoreB = 0;
    const firstHalfRows = [];
    const secondHalfRows = [];

    // 1. ランニングスコア対象データの仕分け
    statsData.forEach(row => {
        let resultStr = "";
        let isRecordable = false;

        if (row.action === "得点" || row.action === "7mスロー") {
            if (row.team === "自チーム") scoreA++;
            if (row.team === "相手チーム") scoreB++;
            resultStr = "";
            isRecordable = true;
        } else if (row.action === "警告(W)") {
            resultStr = "W";
            isRecordable = true;
        } else if (row.action === "2分退場") {
            resultStr = "S";
            isRecordable = true;
        } else if (row.action === "失格(D)") {
            resultStr = "D";
            isRecordable = true;
        }

        if (isRecordable) {
            const entry = {
                team: row.team,
                number: row.number,
                resultStr: resultStr,
                score: (row.team === "自チーム") ? scoreA : scoreB,
                time: row.time
            };
            if (row.phase === "前半") {
                firstHalfRows.push(entry);
            } else {
                secondHalfRows.push(entry);
            }
        }
    });

    // 2. ランニングスコア描画（最低40行の固定枠・高さ自動計算）
    const MIN_RUNNING_ROWS = 40;
    function renderRunningTable(tbody, rows) {
        const totalRows = Math.max(MIN_RUNNING_ROWS, rows.length);
        const rowHeight = Math.max(16, Math.floor(980 / totalRows));

        for (let i = 0; i < totalRows; i++) {
            const tr = document.createElement('tr');
            tr.style.height = rowHeight + 'px';

            if (i < rows.length) {
                const r = rows[i];
                if (r.team === "自チーム") {
                    tr.innerHTML = `
                        <td>${r.number}</td>
                        <td>${r.resultStr}</td>
                        <td style="font-weight:bold; font-size:12px;">${r.resultStr === "" ? r.score : ""}</td>
                        <td style="font-weight:bold;">${r.time}</td>
                        <td></td><td></td><td></td>
                    `;
                } else {
                    tr.innerHTML = `
                        <td></td><td></td><td></td>
                        <td style="font-weight:bold;">${r.time}</td>
                        <td style="font-weight:bold; font-size:12px;">${r.resultStr === "" ? r.score : ""}</td>
                        <td>${r.resultStr}</td>
                        <td>${r.number}</td>
                    `;
                }
            } else {
                tr.innerHTML = `<td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td>`;
            }
            tbody.appendChild(tr);
        }
    }

    renderRunningTable(tbody1, firstHalfRows);
    renderRunningTable(tbody2, secondHalfRows);

    // 3. 個人スタッツの集計
    let myTeamPlayers = {};
    const savedRoster = localStorage.getItem('statAppRoster');
    if (savedRoster) {
        myTeamPlayers = JSON.parse(savedRoster);
    }

    let statsOwn = {};
    let statsOpp = {};

    // 自チームは名簿に登録されている全員を最初から0点でセット
    Object.keys(myTeamPlayers).forEach(num => {
        statsOwn[num] = { goals: 0, w: 0, s: 0, d: 0 };
    });

    statsData.forEach(row => {
        if (!row.number) return;
        const isStatTarget = (
            row.action === "得点" || row.action === "7mスロー" ||
            row.action === "警告(W)" || row.action === "2分退場" || row.action === "失格(D)"
        );
        if (!isStatTarget) return;

        let targetStats = (row.team === "自チーム") ? statsOwn : statsOpp;
        if (!targetStats[row.number]) {
            targetStats[row.number] = { goals: 0, w: 0, s: 0, d: 0 };
        }
        if (row.action === "得点" || row.action === "7mスロー") targetStats[row.number].goals++;
        if (row.action === "警告(W)") targetStats[row.number].w++;
        if (row.action === "2分退場") targetStats[row.number].s++;
        if (row.action === "失格(D)") targetStats[row.number].d++;
    });

    // 4. 個人スタッツ描画（16行＋合計行の固定枠・高さ自動計算）
    function renderIndividualTable(tbodyId, statsObj, playerList = null) {
        const tbody = document.getElementById(tbodyId);
        tbody.innerHTML = '';
        let totalGoals = 0, totalW = 0, totalS = 0, totalD = 0;

        const sortedNumbers = sortNumbers(Object.keys(statsObj));
        const rowCount = Math.max(16, sortedNumbers.length);
        const rowHeight = Math.max(22, Math.floor(990 / (rowCount + 1)));

        for (let i = 0; i < rowCount; i++) {
            const tr = document.createElement('tr');
            tr.style.height = rowHeight + 'px';
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
                    <td style="font-weight:bold;">${num}</td>
                    <td class="pdf-name-cell">${playerName}</td>
                    <td style="font-weight:bold;">${p.goals > 0 ? p.goals : ''}</td>
                    <td>${p.w > 0 ? p.w : ''}</td>
                    <td>${p.s > 0 ? p.s : ''}</td>
                    <td>${p.d > 0 ? p.d : ''}</td>
                `;
            } else {
                tr.innerHTML = `<td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td>`;
            }
            tbody.appendChild(tr);
        }

        const totalTr = document.createElement('tr');
        totalTr.style.height = rowHeight + 'px';
        totalTr.style.backgroundColor = "#ffccff";
        totalTr.innerHTML = `
            <td colspan="2" style="font-weight:bold; text-align:center;">合計</td>
            <td style="font-weight:bold;">${totalGoals > 0 ? totalGoals : ''}</td>
            <td style="font-weight:bold;">${totalW > 0 ? totalW : ''}</td>
            <td style="font-weight:bold;">${totalS > 0 ? totalS : ''}</td>
            <td style="font-weight:bold;">${totalD > 0 ? totalD : ''}</td>
        `;
        tbody.appendChild(totalTr);
    }

    renderIndividualTable('tbody-individual-own', statsOwn, myTeamPlayers);
    renderIndividualTable('tbody-individual-opp', statsOpp, null);
}

// ==========================================
// PDF保存処理（左ズレ・途切れ防止）
// ==========================================
btnDownloadPdf.addEventListener('click', () => {
    btnDownloadPdf.innerText = "作成中...";
    btnDownloadPdf.disabled = true;

    const savedScrollY = window.scrollY;
    window.scrollTo(0, 0);
    pdfModal.scrollTop = 0;
    pdfScrollWrapper.scrollLeft = 0;

    const element = document.getElementById('score-sheet-container');
    const now = new Date();
    const fileName = `公式記録_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.pdf`;

    const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            width: 793,
            windowWidth: 793,
            onclone: function (clonedDoc) {
                const overlay = clonedDoc.querySelector('.html2pdf__overlay');
                if (overlay) {
                    overlay.style.overflow = 'visible';
                    overlay.style.width = '793px';
                }
                const container = clonedDoc.querySelector('.html2pdf__container');
                if (container) {
                    container.style.left = '0px';
                    container.style.right = 'auto';
                    container.style.margin = '0px';
                    container.style.width = '793px';
                }
            }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        btnDownloadPdf.innerText = "↓ PDFを保存・共有";
        btnDownloadPdf.disabled = false;
        window.scrollTo(0, savedScrollY);
    });
});

// ==========================================
// PWA用 Service Worker登録
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}
