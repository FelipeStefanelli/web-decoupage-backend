const { spawn } = require('child_process');

/**
 * Extrai o áudio de um arquivo de vídeo usando FFMPEG.
 * @param {string} inputPath - Caminho completo do arquivo de vídeo de entrada.
 * @param {string} outputPath - Caminho completo do arquivo de saída (com extensão, ex: .mp3, .aac).
 * @returns {Promise<string>} - Resolve com o caminho de saída quando concluído.
 */

function getFfmpegPath() {
  return process.env.FFMPEG_PATH || 'ffmpeg';
}

function extractAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFfmpegPath();
    const args = ['-i', inputPath, '-vn'];

    // Define codec conforme extensão
    if (outputPath.endsWith('.mp3')) {
      args.push('-acodec', 'libmp3lame');
    } else {
      args.push('-acodec', 'copy');
    }

    args.push(outputPath);
    const ffmpeg = spawn(ffmpegPath, args);

    ffmpeg.stderr.on('data', data => console.log(`FFmpeg: ${data}`));

    ffmpeg.on('error', err => reject(err));

    ffmpeg.on('close', code => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`FFmpeg terminou com código ${code}`));
    });
  });
}

module.exports = { extractAudio };
