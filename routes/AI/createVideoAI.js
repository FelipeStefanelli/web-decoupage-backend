const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Retorna o comando do FFMPEG a partir de variável de ambiente ou PATH.
 */
function getFfmpegPath() {
  return process.env.FFMPEG_PATH || 'ffmpeg';
}

/**
 * Executa FFmpeg com os argumentos especificados.
 * @param {string[]} args - Argumentos para o FFmpeg.
 * @returns {Promise<void>}
 */
function execFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(getFfmpegPath(), args);
    ffmpeg.stderr.on('data', data => console.log(`[FFmpeg]: ${data}`));
    ffmpeg.on('error', err => reject(err));
    ffmpeg.on('close', code => code === 0 ? resolve() : reject(new Error(`FFmpeg exited with code ${code}`)));
  });
}

/**
 * Cria um vídeo curto a partir da primeira imagem do scene.
 */
async function createSceneVideo(scene, index, outputDir, projectName) {
  const timecode = scene.timecodes[0];
  if (!timecode || !timecode.imageUrl) return;

  const imageFile = path.basename(timecode.imageUrl);
  const imagePath = path.join(__dirname, '..', 'data', 'backups', projectName, 'images', imageFile);
  const duration = 5;
  const output = path.join(outputDir, `scene${index}.mp4`);

  const args = [
    '-loop', '1',
    '-i', imagePath,
    '-t', duration.toString(),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-y', output,
  ];

  await execFfmpeg(args);
}

/**
 * Constrói o vídeo final concatenando cenas geradas.
 * @param {string} projectName - Nome do projeto.
 * @returns {Promise<string>} - Caminho do vídeo final.
 */
async function buildFinalVideo(projectName) {
  const backupsDir = path.join(__dirname, '..', 'data', 'backups');
  const dataPath = path.join(backupsDir, projectName, 'data.json');
  const outputDir = path.join(__dirname, '..', 'data', 'temp_video');
  fs.mkdirSync(outputDir, { recursive: true });

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const list = [];

  for (let i = 0; i < data.script.length; i++) {
    await createSceneVideo(data.script[i], i, outputDir, projectName);
    list.push(`file 'scene${i}.mp4'`);
  }

  const listPath = path.join(outputDir, 'scenes.txt');
  fs.writeFileSync(listPath, list.join('\n'), 'utf-8');

  const finalOutput = path.join(outputDir, 'final_video.mp4');
  await execFfmpeg(['-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', '-y', finalOutput]);

  return finalOutput;
}

module.exports = { buildFinalVideo };