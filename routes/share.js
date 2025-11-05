const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs/promises');
const { PDFDocument, StandardFonts } = require('pdf-lib');

// Caminho base dos dados
const baseDataPath = path.join(__dirname, '..', 'data');

// GET /api/share
router.get('/', async (req, res) => {
  try {
    const dataPath = path.join(baseDataPath, 'data.json');
    const imagesPath = path.join(baseDataPath, 'images');
    const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    let page = pdfDoc.addPage([600, 800]);
    let y = 750;

    const newPage = () => {
      page = pdfDoc.addPage([600, 800]);
      y = 750;
    };

    for (const scene of data.script) {
      if (y <= 50) newPage();
      page.drawText(`Cena: ${scene.name}`, { x: 50, y, size: fontSize + 2, font });
      y -= 30;

      for (const field of ['description', 'locution', 'audio']) {
        if (scene[field]) {
          page.drawText(
            `${field[0].toUpperCase() + field.slice(1)}: ${scene[field]}`,
            { x: 50, y, size: fontSize, font }
          );
          y -= 30;
        }
      }

      for (const timecode of scene.timecodes) {
        if (y <= 150) newPage();
        page.drawText(`ID: ${timecode.id}`, { x: 50, y, size: fontSize, font });
        y -= 20;
        page.drawText(
          `Início: ${timecode.inTime} | Fim: ${timecode.outTime}`,
          { x: 50, y, size: fontSize, font }
        );
        y -= 20;
        page.drawText(`Texto: ${timecode.text}`, { x: 50, y, size: fontSize, font });
        y -= 20;
        try {
          const imgPath = path.join(imagesPath, `${timecode.id}.png`);
          const imgBytes = await fs.readFile(imgPath);
          const img = await pdfDoc.embedJpg(imgBytes);
          page.drawImage(img, { x: 330, y: y - 80, width: 100, height: 100 });
          y -= 100;
        } catch {
          // Ignora se imagem não existir
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=script.pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({ error: 'Erro ao gerar PDF', details: error.message });
  }
});

module.exports = router;
