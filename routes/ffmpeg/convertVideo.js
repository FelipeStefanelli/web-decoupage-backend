const { spawn } = require('child_process');

// Define o comando do FFMPEG a partir de variável de ambiente ou usa ffmpeg no PATH
function getFfmpegPath() {
  return process.env.FFMPEG_PATH || 'ffmpeg';
}

/**
 * Converte um arquivo de vídeo usando FFMPEG.
 * @param {string} inputPath - Caminho completo do arquivo de entrada.
 * @param {string} outputPath - Caminho completo de saída (incluindo extensão).
 * @returns {Promise<string>} - Resolve com o caminho de saída quando concluído.
 */

function convertVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFfmpegPath();
    const args = ['-i', inputPath, outputPath];

    const ffmpeg = spawn(ffmpegPath, args);

    ffmpeg.stderr.on('data', data => {
      console.log(`FFmpeg: ${data}`);
    });

    ffmpeg.on('close', code => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg terminou com código ${code}`));
      }
    });
  });
}

module.exports = { convertVideo };