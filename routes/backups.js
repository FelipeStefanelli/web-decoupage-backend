const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');

// Caminho base dos dados
const baseDataPath = path.join(__dirname, '..', 'data');
const dataPath = path.join(baseDataPath, 'data.json');
const imagesPath = path.join(baseDataPath, 'images');
const backupsPath = path.join(baseDataPath, 'backups');

// POST /api/backups
router.post('/', async (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName) return res.status(400).json({ error: 'Nome inválido' });

    const projectPath = path.join(backupsPath, fileName);
    const projectImagesPath = path.join(projectPath, 'images');

    await fs.mkdir(projectImagesPath, { recursive: true });

    const data = await fs.readFile(dataPath, 'utf-8');
    await fs.writeFile(path.join(projectPath, 'data.json'), data);

    const parsed = JSON.parse(data);
    const usedImages = (parsed.timecodes || [])
      .map(tc => tc.imageUrl?.split('/').pop())
      .filter(Boolean);

    for (const img of usedImages) {
      try {
        await fs.copyFile(
          path.join(imagesPath, img),
          path.join(projectImagesPath, img)
        );
      } catch (err) {
        console.warn(`Imagem não encontrada: ${img}`, err.message);
      }
    }

    res.json({ message: 'Backup criado com sucesso!' });
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    res.status(500).json({ error: 'Erro ao criar backup', details: error.message });
  }
});

// GET /api/backups
router.get('/', async (req, res) => {
  try {
    await fs.mkdir(backupsPath, { recursive: true });
    const dirs = await fs.readdir(backupsPath, { withFileTypes: true });

    const backups = [];
    for (const dirent of dirs) {
      if (dirent.isDirectory()) {
        const dataFile = path.join(backupsPath, dirent.name, 'data.json');
        try {
          await fs.access(dataFile);
          backups.push({ name: dirent.name, path: `/backups/${dirent.name}/data.json` });
        } catch {}
      }
    }

    res.json({ backups });
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    res.status(500).json({ error: 'Erro ao listar backups', details: error.message });
  }
});

// DELETE /api/backups/:fileName
router.delete('/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    if (!fileName) return res.status(400).json({ error: 'Nome inválido' });

    const projectPath = path.join(backupsPath, fileName);

    try {
      await fs.access(projectPath);
    } catch {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    await fs.rm(projectPath, { recursive: true, force: true });

    res.json({ message: 'Backup deletado com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar backup:', error);
    res.status(500).json({ error: 'Erro ao deletar backup', details: error.message });
  }
});

module.exports = router;
