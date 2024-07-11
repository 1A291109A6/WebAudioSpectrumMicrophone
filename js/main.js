const canvas = document.getElementById('Canvas');
const context = canvas.getContext('2d', { alpha: false });

function resizeCanvas() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const aspectRatio = 16 / 9;

    let canvasWidth, canvasHeight;

    if (screenWidth / screenHeight > aspectRatio) {
        canvasWidth = screenHeight * aspectRatio;
        canvasHeight = screenHeight;
    } else {
        canvasWidth = screenWidth;
        canvasHeight = screenWidth / aspectRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    sizeRatio = canvas.width / 1280;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const FPS = 60;
const drawInterval = 4; // 4フレームごとに描画
const log2DataSize = 8;
const dataSize = 2 ** log2DataSize;
const skipData = 40;
const verticalResolution = 5; // 縦の解像度を粗くする（ライン数）
var waveData;
var duration;
var sizeRatio = canvas.width / 1280;
var frameCount = 0;

// 新しい部分: マイクからの音声処理
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        
        // マイクからの音声をanalyserに接続
        microphone.connect(analyser);

        analyser.fftSize = dataSize * 2;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function draw() {
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            // 一定フレームごとに描画
            if (frameCount % drawInterval === 0) {
                drawSpctrum(dataArray);
            }
            frameCount++;
        }

        draw();
    })
    .catch(function(err) {
        console.log('The following getUserMedia error occurred: ' + err);
    });

// 音量に応じた色を取得する関数
function getColor(value) {
    const percent = value / 255;
    const r = percent * 255;
    const b = (1 - percent) * 255;
    return `rgb(${r}, 0, ${b})`;
}

// スペクトラムの高さの記録
let spectrumData = Array(Math.floor(canvas.height / verticalResolution)).fill(null).map(() => new Uint8Array(dataSize));

// drawSpctrum関数を更新
function drawSpctrum(data) {
    // スペクトラムデータをシフト
    spectrumData.pop();
    spectrumData.unshift(new Uint8Array(data));

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgb(0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / data.length;

    // 各スペクトラムラインを描画
    for (let y = 0; y < spectrumData.length; y++) {
        const rowData = spectrumData[y];
        const yPos = canvas.height - (y * verticalResolution) - verticalResolution;
        for (let i = 0; i < rowData.length; i++) {
            const barHeight = rowData[i] * verticalResolution / 255;
            const x = i * barWidth;
            context.fillStyle = getColor(rowData[i]);
            context.fillRect(x, yPos, barWidth, verticalResolution); // verticalResolutionピクセルの高さで描画
        }
    }
}
