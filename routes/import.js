const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');

// Caminho base dos dados
const baseDataPath = path.join(__dirname, '..', 'data');
const dataPath = path.join(baseDataPath, 'data.json');
const imagesPath = path.join(baseDataPath, 'images');
const backupsPath = path.join(baseDataPath, 'backups');

// POST /api/import
router.post('/', async (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName) {
      return res.status(400).json({ error: 'Nome inválido' });
    }

    const projectPath = path.join(backupsPath, fileName);
    const dataFile = path.join(projectPath, 'data.json');
    const imagesDir = path.join(projectPath, 'images');

    // Verifica existência do backup
    const exists = await fs.stat(dataFile).then(() => true).catch(() => false);
    if (!exists) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    // Copia JSON principal
    const json = await fs.readFile(dataFile, 'utf-8');
    await fs.writeFile(dataPath, json);

    // Sincroniza imagens
    const imagesDirExists = await fs
      .stat(imagesDir)
      .then(() => true)
      .catch(() => false);
      
    if (imagesDirExists) {
      // Garante que exista a pasta destino
      await fs.mkdir(imagesPath, { recursive: true });

      // Limpa o que já tinha
      const existingImages = await fs.readdir(imagesPath);
      for (const img of existingImages) {
        await fs.unlink(path.join(imagesPath, img));
      }

      // Copia as do backup
      const backupImages = await fs.readdir(imagesDir);
      for (const img of backupImages) {
        await fs.copyFile(
          path.join(imagesDir, img),
          path.join(imagesPath, img)
        );
      }
    } else {
      console.log(`Pasta de imagens não encontrada em ${imagesDir}, pulando sincronização.`);
    }

    res.json({ message: 'Backup importado com sucesso' });
  } catch (error) {
    console.error('Erro ao importar backup:', error);
    res.status(500).json({ error: 'Erro ao importar backup', details: error.message });
  }
});

module.exports = router;
