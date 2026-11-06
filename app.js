// エクセルのシート（データベース）の代わりに、一時的にデータを貯めておく「配列」を用意します
let statsData = [];

// HTMLに配置した各ボタンやエリアをJavaScript側で操作できるように取得します
const courtArea = document.getElementById('court-area');
const btnGoal = document.getElementById('btn-goal');
const btnSave = document.getElementById('btn-save');
const btnMiss = document.getElementById('btn-miss');
const btnExport = document.getElementById('btn-export');

// --------------------------------------------------
// 1. コート領域がタップされた時の処理（座標の取得）
// --------------------------------------------------
courtArea.addEventListener('click', (event) => {
    // コートの枠を基準にしたXY座標を計算します
    const rect = courtArea.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    
    // 確認用のポップアップを表示
    alert(`コートをタップしました！\n座標：(X: ${x}, Y: ${y})\n※最終的にはこれをシュート位置として記録します。`);
});

// --------------------------------------------------
// 2. スタッツを記録する共通関数（VBAのSubプロシージャのようなもの）
// --------------------------------------------------
function recordStat(actionName) {
    // 現在の時刻を取得
    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    
    // 用意しておいた配列に、時間とアクション名をセットで追加（記録）します
    statsData.push({
        time: timeString,
        action: actionName
    });
    
    // 確認用のポップアップを表示
    alert(`「${actionName}」を記録しました！\n現在の記録数: ${statsData.length}件`);
}

// 各ボタンが押された時に、上の recordStat 関数を呼び出します
btnGoal.addEventListener('click', () => recordStat('得点'));
btnSave.addEventListener('click', () => recordStat('GKセーブ'));
btnMiss.addEventListener('click', () => recordStat('枠外・ミス'));

// --------------------------------------------------
// 3. 蓄積したデータをCSVで出力する処理
// --------------------------------------------------
btnExport.addEventListener('click', () => {
    // 記録が1件もない場合は処理をストップ
    if (statsData.length === 0) {
        alert('出力するデータがありません。先にボタンを押して記録してください。');
        return;
    }

    // CSVの1行目（ヘッダー）を作成
    let csvContent = "時間,プレー内容\n";

    // 配列に貯めたデータを1行ずつ取り出してCSV形式の文字列に追加
    statsData.forEach(row => {
        csvContent += `${row.time},${row.action}\n`;
    });

    // Excelで開いたときの文字化けを防ぐための処理（BOMの付与）
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv' });
    
    // ダウンロード用のリンクを裏側で作成し、自動でクリックさせてCSVをダウンロード
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'handball_stats.csv'; // ダウンロードされるファイル名
    link.click();
});