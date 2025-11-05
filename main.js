// main.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const bodyParser = require('body-parser');
require('dotenv').config();
const multer = require('multer');
const archiver = require('archiver');

// Import backend route modules
const apiRoutes = require('./routes/api');
const backupsRoutes = require('./routes/backups');
const importRoutes = require('./routes/import');
const importFolderRoutes = require('./routes/importFolder');
const shareRoutes = require('./routes/share');
const imagesRoute = require('./routes/images');
const videosRoute = require('./routes/videos');
const { convertVideo } = require('./routes/ffmpeg/convertVideo');
const { extractAudio } = require('./routes/ffmpeg/extractAudio');
const { transcribeWithWhisper } = require('./routes/AI/transcribe');
const { buildFinalVideo } = require('./routes/AI/createVideoAI');
const { generateScript } = require('./routes/AI/scriptAI');

const PORT = process.env.PORT || 4000;
const app = express();
const server = createServer(app);
const uploadPath = multer({ dest: path.join(__dirname,'data', 'uploads') });
const backupsPath = path.join(__dirname, 'data', 'backups');

const isDev = process.env.NODE_ENV !== 'production';

// Middleware
app.use(bodyParser.json({ limit: '1000mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1000mb' }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Serve image files from backups
app.use('/images/:projectName/:imageName', (req, res) => {
  const { projectName, imageName } = req.params;
  const imagePath = path.join(__dirname, 'data', 'backups', projectName, 'images', imageName);
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send('Image not found');
  }
});

// Mount existing API routes
app.use('/api', apiRoutes);
app.use('/api/backups', backupsRoutes);
app.use('/api/import', importRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/images', imagesRoute);
app.use('/api/videos', videosRoute);
app.use('/api/importFolder', importFolderRoutes);

// Replace IPC handlers with HTTP endpoints
app.post('/api/convert-video',
  uploadPath.single('video'),
  async (req, res) => {
    const inputPath = req.file.path;
    const { format } = req.body;
    const outputName = `${req.file.filename}.${format}`;
    const outputPath = path.join(__dirname, 'uploads', outputName);

    try {
      await convertVideo(inputPath, outputPath);
      res.download(outputPath, outputName, err => {
        // limpa arquivos temporários
        fs.unlink(inputPath, () => {});
        fs.unlink(outputPath, () => {});
        if (err) console.error('Erro no download:', err);
      });
    } catch (err) {
      console.error('Erro na conversão:', err);
      fs.unlink(inputPath, () => {});
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

app.post('/api/extract-audio',
  uploadPath.single('video'),
  async (req, res) => {
    const inputPath = req.file.path;
    const { format } = req.body;
    const outputName = `${req.file.filename}.${format}`;
    const outputPath = path.join(__dirname, 'uploads', outputName);

    try {
      await extractAudio(inputPath, outputPath);
      res.download(outputPath, outputName, err => {
        fs.unlink(inputPath, () => {});
        fs.unlink(outputPath, () => {});
        if (err) console.error('Erro no download de áudio:', err);
      });
    } catch (err) {
      console.error('Erro na extração de áudio:', err);
      fs.unlink(inputPath, () => {});
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

app.post('/api/transcribe-video',
  uploadPath.single('video'),
  async (req, res) => {
    const tempPath = req.file.path;
    try {
      const { segments, totalTime } = await transcribeWithWhisper(tempPath);
      res.json({ success: true, segments, totalTime });
    } catch (err) {
      console.error('Erro Python:', err);
      res.status(500).json({ success: false, error: err.message });
    } finally {
      // limpa o arquivo temporário
      fs.unlink(tempPath, () => {});
    }
  }
);

app.post('/api/create-video-ai', async (req, res) => {
  const { projectName } = req.body;
  try {
    const output = await buildFinalVideo(projectName);
    res.json({ success: true, output });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/generate-script', async (req, res) => {
  const { prompt, duration, soundtrack, variations } = req.body;
  try {
    const script = await generateScript(prompt, duration, soundtrack, variations);
    res.json({ success: true, script });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/backups/download/:projectName', (req, res) => {
  const projectName = req.params.projectName;
  console.log('[SERVER] GET /api/backups/download/' + projectName);

  const projectDir = path.join(backupsPath, projectName);

  if (!fs.existsSync(projectDir)) {
    console.log(`[SERVER] Backup "${projectName}" não encontrado em ${projectDir}`);
    return res.status(404).json({ error: 'Backup não encontrado' });
  }

  console.log(`[SERVER] Iniciando streaming da pasta ${projectDir} como ZIP`);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${projectName}.zip"`
  );

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('warning', err => console.warn('⚠️ Arquiver warning:', err));
  archive.on('error', err => {
    console.error('❌ Arquiver error:', err);
    if (!res.headersSent) {
      res.status(500).send({ error: err.message });
    }
  });
  archive.on('end', () => {
    console.log(`✅ ZIP gerado: ${archive.pointer()} bytes`);
  });

  // Pipe do Archivador → HTTP Response
  archive.pipe(res);

  // Adiciona todo o conteúdo dentro de backups/<projectName> sem criar subdiretório extra
  archive.directory(projectDir, false);
  archive.finalize();
});

// Serve static React build in production
if (!isDev) {
  const frontendDist = path.join(__dirname, 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
