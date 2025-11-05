const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function transcribeWithWhisper(videoPath) {
  return new Promise((resolve, reject) => {
    const pythonPath = path.resolve(__dirname, '../../../resources/python-win/python.exe');
    const scriptPath = path.resolve(__dirname, '../../../resources/transcribe.py');

    // 1) Primeiro, criamos um arquivo de áudio em mono (WAV) a partir do vídeo
    //    Ex.: se o vídeo se chama "meu_video.mp4", geraremos "meu_video_mono.wav" na mesma pasta
    const videoDir = path.dirname(videoPath);
    const videoBase = path.basename(videoPath, path.extname(videoPath));
    const audioMonoPath = path.join(videoDir, `${videoBase}_mono.wav`);

    // Se já existir um audio mono gerado, podemos removê-lo antes
    if (fs.existsSync(audioMonoPath)) {
      try { fs.unlinkSync(audioMonoPath); } catch (e) { /* ignora */ }
    }

    // Comando FFmpeg para extrair o áudio e converter em mono PCM WAV:
    //   -i <videoPath>           -> arquivo de entrada
    //   -ac 1                    -> forçar mono (1 canal)
    //   -ar 16000                -> (opcional) definir sample rate 16kHz, caso o Whisper espere 16k
    //   -vn                      -> desabilitar pista de vídeo
    //   -y                       -> sobrescrever sem perguntar, se o arquivo já existir
    //   <audioMonoPath>          -> arquivo de saída
    const ffmpegArgs = [
      '-i', videoPath,
      '-ac', '1',
      '-ar', '16000',
      '-vn',
      '-y',
      audioMonoPath
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    let ffmpegStdErr = '';
    ffmpeg.stderr.on('data', (data) => {
      ffmpegStdErr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error('Erro ao converter vídeo em áudio mono:', ffmpegStdErr);
        return reject(new Error('Falha no FFmpeg ao extrair áudio'));
      }

      // 2) Agora que o áudio em mono está pronto, chamamos o Python passando o arquivo de áudio
      const subprocess = spawn(pythonPath, [scriptPath, audioMonoPath], {
        env: {
          ...process.env,
          PATH: `${path.resolve(__dirname, '../../../resources')};${process.env.PATH}`,
        },
      });

      let output = '';
      let errorOutput = '';

      subprocess.stdout.on('data', (data) => {
        output += data.toString(); // JSON, com acento
      });

      subprocess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      subprocess.on('close', (pyCode) => {
        if (pyCode === 0) {
          try {
            function agruparPorPontuacao(segments) {
              const blocos = [];
              let buffer = '';
              let start = null;
              let end = null;
              let totalTime = 0; // Variável para calcular o tempo total de fala
            
              for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                if (start === null) start = seg.start;
            
                buffer += (buffer ? ' ' : '') + seg.text;
                end = seg.end;
            
                // Se o texto terminar com ponto final, adiciona o bloco
                if (seg.text.trim().endsWith('.')) {
                  blocos.push({ start, end, text: buffer.trim() });
                  totalTime += end - start; // Calcula o tempo de fala para o bloco
                  buffer = '';
                  start = null;
                  end = null;
                }
              }
            
              // Se sobrou algo sem ponto final, adiciona como último bloco
              if (buffer) {
                blocos.push({ start, end, text: buffer.trim() });
                totalTime += end - start; // Calcula o tempo de fala para o último bloco
              }

              return { blocos, totalTime };
            }

            const segments = JSON.parse(output);
            const { blocos, totalTime } = agruparPorPontuacao(segments);
            resolve({ segments: blocos, totalTime }); // Retorna o totalTime junto com os segmentos
          } catch (err) {
            reject(new Error("Erro ao interpretar JSON da transcrição"));
          }
        } else {
          console.error("Erro Python:", errorOutput);
          reject(new Error("Erro ao transcrever áudio"));
        }
      });
    });
  });
}

module.exports = { transcribeWithWhisper };
