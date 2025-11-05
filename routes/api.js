const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');

// Caminho base dos dados (backend/data/backups)
const baseDataPath = path.join(__dirname, '..', 'data');

function getPaths(projectName) {
  if (!projectName || typeof projectName !== 'string' || projectName.trim() === '') {
    throw new Error('Nome do projeto é obrigatório');
  }
  const root = path.join(baseDataPath, 'backups', projectName);
  return {
    jsonPath: path.join(root, 'data.json'),
    imagesPath: path.join(root, 'images'),
  };
}

// Garante que o JSON exista, criando pasta e arquivo inicial se necessário
async function ensureJsonExists(jsonPath) {
  await fs.mkdir(path.dirname(jsonPath), { recursive: true });
  try {
    await fs.access(jsonPath);
  } catch {
    await fs.writeFile(jsonPath, JSON.stringify({ timecodes: [], script: [] }, null, 2));
  }
}

async function readJson(projectName) {
  if (!projectName) {
    throw new Error('Nome do projeto é obrigatório');
  }
  const { jsonPath } = getPaths(projectName);
  await ensureJsonExists(jsonPath);
  const content = await fs.readFile(jsonPath, 'utf-8');
  return JSON.parse(content);
}

async function writeJson(projectName, content) {
  if (!projectName) {
    throw new Error('Nome do projeto é obrigatório');
  }
  const { jsonPath } = getPaths(projectName);
  await fs.writeFile(jsonPath, JSON.stringify(content, null, 2));
}

async function saveImage(projectName, base64Data, fileName) {
  if (!projectName) {
    throw new Error('Nome do projeto é obrigatório');
  }
  const { imagesPath } = getPaths(projectName);
  const buffer = Buffer.from(base64Data, 'base64');
  await fs.mkdir(imagesPath, { recursive: true });
  const filePath = path.join(imagesPath, fileName);
  await fs.writeFile(filePath, buffer);
  return `/images/${projectName}/${fileName}`;
}

// GET /api
router.get('/', async (req, res) => {
  try {
    const { projectName } = req.query;
    const data = await readJson(projectName);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao ler data.json', details: error.message });
  }
});

// POST /api
router.post('/', async (req, res) => {
  try {
    const { fileContent, timecode } = req.body;
    const { projectName } = req.query;
    const imageUrl = await saveImage(projectName, fileContent, `${timecode.id}.png`);
    timecode.imageUrl = imageUrl;

    const data = await readJson(projectName);
    data.timecodes.push(timecode);
    await writeJson(projectName, data);

    res.json({ message: 'Timecode salvo com sucesso', timecode });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar timecode', details: error.message });
  }
});

// PUT /api
router.put('/', async (req, res) => {
  try {
    const { scope, timecode, script, json } = req.body;
    const { projectName } = req.query;
    const data = await readJson(projectName);

    if (scope === 'timecode-move' && json) {
      await writeJson(projectName, json);
    } else if (scope === 'timecodes' && timecode) {
      const idx = data.timecodes.findIndex(t => t.id === timecode.id);
      if (idx !== -1) {
        data.timecodes[idx] = { ...data.timecodes[idx], ...timecode };
        await writeJson(projectName, data);
      }
    } else if (scope === 'script-timecodes' && timecode) {
      data.script.forEach(scene => {
        const idx = scene.timecodes.findIndex(t => t.id === timecode.id);
        if (idx !== -1) scene.timecodes[idx] = { ...scene.timecodes[idx], ...timecode };
      });
      await writeJson(projectName, data);
    } else if (scope === 'script-audios' && timecode) {
      data.script.forEach(scene => {
        const idx = scene.audios.findIndex(t => t.id === timecode.id);
        if (idx !== -1) scene.audios[idx] = { ...scene.audios[idx], ...timecode };
      });
      await writeJson(projectName, data);
    } else if (scope === 'script' && script) {
      const scene = data.script.find(s => s.id === script.id);
      if (scene) {
        Object.assign(scene, script);
        await writeJson(projectName, data);
      }
    }

    res.json({ message: 'Atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar', details: error.message });
  }
});

// DELETE /api
router.delete('/', async (req, res) => {
  try {
    const { id } = req.body;
    const { projectName } = req.query;
    if (!projectName) {
      return res.status(400).json({ error: 'Nome do projeto é obrigatório' });
    }
    const { imagesPath } = getPaths(projectName);
    const data = await readJson(projectName);

    data.timecodes = data.timecodes.filter(t => t.id !== id);
    data.script.forEach(scene => {
      scene.timecodes = scene.timecodes.filter(t => t.id !== id);
      scene.audios = scene.audios.filter(t => t.id !== id);
    });
    await writeJson(projectName, data);

    // Deleta imagem relacionada
    try {
      await fs.unlink(path.join(imagesPath, `${id}.png`));
    } catch {}

    res.json({ message: 'Item removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar', details: error.message });
  }
});

// POST /api/reset
router.post('/reset', async (req, res) => {
  try {
    const { projectName } = req.query;
    if (!projectName || typeof projectName !== 'string' || projectName.trim() === '') {
      return res.status(400).json({ error: 'Nome do projeto é obrigatório' });
    }

    const { jsonPath, imagesPath } = getPaths(projectName);

    await fs.mkdir(path.dirname(jsonPath), { recursive: true });
    await fs.mkdir(imagesPath, { recursive: true });

    const initialJson = { timecodes: [], script: [] };
    await fs.writeFile(jsonPath, JSON.stringify(initialJson, null, 2));

    const files = await fs.readdir(imagesPath);
    for (const file of files) {
      await fs.unlink(path.join(imagesPath, file));
    }

    res.json({ success: true, message: 'Projeto limpo com sucesso' });
  } catch (err) {
    console.error('Erro ao limpar projeto:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar projeto',
      details: err.message
    });
  }
});

module.exports = router;
