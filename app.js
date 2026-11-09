// 状態管理
let statsData = [];
let currentPhase = "前半";
let currentNumber = "";
let currentX = "";
let currentY = "";

// DOM取得
const btnFirstHalf = document.getElementById('btn-first-half');
const btnSecondHalf = document.getElementById('btn-second-half');
const displayNumber = document.getElementById('display-number');
const numBtns = document.querySelectorAll('.num-btn');
const courtArea = document.getElementById('court-area');
const tapMarker = document.getElementById('tap-marker');
const actionBtns = document.querySelectorAll('.action-btn');
const historyList = document.getElementById('history-list');
const btnUndo = document.getElementById('btn-undo');
const btnExport = document.getElementById('btn-export');

// 1. 前半・後半切り替え
btnFirstHalf.addEventListener('click', () => { currentPhase = "前半"; btnFirstHalf.classList.add('active'); btnSecondHalf.classList.remove('active'); });
btnSecondHalf.addEventListener('click', () => { currentPhase = "後半"; btnSecondHalf.classList.add('active'); btnFirstHalf.classList.remove('active'); });

// 2. 背番号入力
numBtns.forEach(btn => {
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

// 3. コートタップ (座標取得と★マーク表示)
courtArea.addEventListener('click', (e) => {
    const rect = courtArea.getBoundingClientRect();
    currentX = Math.round(e.clientX - rect.left);
    currentY = Math.round(e.clientY - rect.top);
    tapMarker.style.display = "block";
    tapMarker.style.left = currentX + "px";
    tapMarker.style.top = currentY + "px";
});

// 4. アクション記録 (ポップアップなしでスピーディーに)
actionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const actionName = e.target.getAttribute('data-action');
        
        // 背番号だけは必須チェック
        if (currentNumber === "") {
            alert("先に背番号を入力してください！");
            return;
        }

        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        
        // データを配列に追加
        statsData.push({
            phase: currentPhase,
            time: timeStr,
            number: currentNumber,
            action: actionName,
            x: currentX,
            y: currentY
        });

        // 次のプレーのために背番号と座標をリセット
        currentNumber = "";
        displayNumber.innerText = "未選択";
        currentX = "";
        currentY = "";
        tapMarker.style.display = "none";

        // 履歴を更新
        updateHistory();
    });
});

// 5. 履歴表示と取り消し(Undo)
function updateHistory() {
    historyList.innerHTML = "";
    if (statsData.length === 0) {
        historyList.innerHTML = '<li style="color:#999;">まだ記録がありません</li>';
        return;
    }
    // 直近3件を新しい順に表示
    const recent = statsData.slice(-3).reverse();
    recent.forEach(stat => {
        const li = document.createElement('li');
        const posText = stat.x !== "" ? `(座標あり)` : `(位置なし)`;
        li.innerText = `[${stat.phase}] #${stat.number} ${stat.action} ${posText}`;
        historyList.appendChild(li);
    });
}

btnUndo.addEventListener('click', () => {
    if (statsData.length === 0) return;
    statsData.pop(); // 最新の1件を削除
    updateHistory();
});

// 6. 6列のCSVとして出力
btnExport.addEventListener('click', () => {
    if (statsData.length === 0) {
        alert('出力するデータがありません。');
        return;
    }
    
    // ヘッダーに前後半と背番号を追加
    let csvContent = "前後半,時間,背番号,プレー内容,X座標,Y座標\n";
    
    statsData.forEach(row => {
        csvContent += `${row.phase},${row.time},${row.number},${row.action},${row.x},${row.y}\n`;
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `handball_stats_${currentPhase}.csv`;
    link.click();
});

// PWA登録
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
