const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const unzipper  = require('unzipper');
const path      = require('path');
const fs        = require('fs');
const fsp       = require('fs/promises');

// Base “data” e uploads/backups
const baseData   = path.resolve(__dirname, '..', 'data');
const uploadDir  = path.join(baseData, 'uploads');
const backupsDir = path.join(baseData, 'backups');

// Garante que existam
fsp.mkdir(uploadDir,  { recursive: true }).catch(console.error);
fsp.mkdir(backupsDir, { recursive: true }).catch(console.error);

// Multer salva o ZIP em data/uploads
const upload = multer({ dest: uploadDir });

router.post('/', upload.single('backup'), async (req, res) => {
  // Deriva o nome da pasta do ZIP, sem extensão
  const zipBase = path.parse(req.file.originalname).name;
  // Forçar outro nome pelo front:
  // const forced = req.body.folderName?.trim();
  // const folderName = forced || zipBase;
  const folderName = zipBase;

  const zipPath = req.file.path;
  const destDir = path.join(backupsDir, folderName);

  try {
    // Cria a pasta de destino (ou não faz nada se já existir)
    await fsp.mkdir(destDir, { recursive: true });

    // Extrai o ZIP direto para lá
    await new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: destDir }))
        .on('close', resolve)
        .on('error', reject);
    });

    // (Opcional) Liste o conteúdo pra debug
    const items = await fsp.readdir(destDir);

    // Apaga o ZIP temporário
    await fsp.unlink(zipPath);

    return res.json({ success: true, message: `Importado em backups/${folderName}`, name: folderName });
  } catch (err) {
    // tenta limpar o ZIP se falhar
    try { await fsp.unlink(zipPath); } catch {}
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
