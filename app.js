let statsData = [];
let currentX = ""; // タップしたX座標を一時保存
let currentY = ""; // タップしたY座標を一時保存

const courtArea = document.getElementById('court-area');
const btnGoal = document.getElementById('btn-goal');
const btnSave = document.getElementById('btn-save');
const btnMiss = document.getElementById('btn-miss');
const btnExport = document.getElementById('btn-export');

// 1. コート領域がタップされた時の処理（座標の取得と保持）
courtArea.addEventListener('click', (event) => {
    const rect = courtArea.getBoundingClientRect();
    currentX = Math.round(event.clientX - rect.left);
    currentY = Math.round(event.clientY - rect.top);
    
    // 操作に慣れるまではアラートを出しておくと安心です
    alert(`シュート位置をセットしました！\n(X: ${currentX}, Y: ${currentY})\n次に「得点」などの結果ボタンを押してください。`);
});

// 2. スタッツを記録する共通関数
function recordStat(actionName) {
    // 座標がセットされていない（コートをタップしていない）場合は警告
    if (currentX === "" || currentY === "") {
        alert("先にコート画像をタップして、シュート位置を指定してください！");
        return;
    }

    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    
    // 時間、アクション名に加え、XとYの座標も一緒に記録する
    statsData.push({
        time: timeString,
        action: actionName,
        x: currentX,
        y: currentY
    });
    
    alert(`「${actionName}」を記録しました！\n現在の記録数: ${statsData.length}件`);
    
    // 次のプレー入力のために、保持していた座標をリセットする
    currentX = "";
    currentY = "";
}

btnGoal.addEventListener('click', () => recordStat('得点'));
btnSave.addEventListener('click', () => recordStat('GKセーブ'));
btnMiss.addEventListener('click', () => recordStat('枠外・ミス'));

// 3. 4列のCSVとして出力する処理
btnExport.addEventListener('click', () => {
    if (statsData.length === 0) {
        alert('出力するデータがありません。');
        return;
    }

    // CSVヘッダーに「X座標」「Y座標」を追加
    let csvContent = "時間,プレー内容,X座標,Y座標\n";

    statsData.forEach(row => {
        csvContent += `${row.time},${row.action},${row.x},${row.y}\n`;
    });

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'handball_stats.csv';
    link.click();
});
