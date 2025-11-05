const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

router.get('/', async (req, res) => {
  const { query, page = 1, per_page = 9 } = req.query;

  if (!query) {
    console.warn('Requisição sem query.');
    return res.status(400).json({ error: 'Query obrigatória' });
  }

  console.warn('PEXELS_API_KEY', PEXELS_API_KEY);
  console.warn('PIXABAY_API_KEY', PIXABAY_API_KEY);
  if (!PEXELS_API_KEY || !PIXABAY_API_KEY) {
    console.error('API keys ausentes.');
    return res.status(500).json({ error: 'Chaves de API não configuradas.' });
  }

  console.log(`Buscando por "${query}" | Página: ${page} | Itens por página: ${per_page}`);

  try {
    // 🔹 Requisição Pexels
    let pexelsPhotos = [];
    try {
      const pexelsRes = await axios.get('https://api.pexels.com/v1/search', {
        headers: { Authorization: PEXELS_API_KEY },
        params: { query, page, per_page }
      });

      pexelsPhotos = (pexelsRes.data.photos || []).map(photo => ({
        url: photo.src.medium,
        photographer: photo.photographer,
        source: 'Pexels'
      }));

      console.log(`Pexels retornou ${pexelsPhotos.length} imagens.`);
    } catch (pexelsErr) {
      console.error('Erro na API da Pexels:', pexelsErr.response?.data || pexelsErr.message);
    }

    // 🔹 Requisição Pixabay
    let pixabayPhotos = [];
    try {
      const pixabayRes = await axios.get('https://pixabay.com/api/', {
        params: {
          key: PIXABAY_API_KEY,
          q: query,
          image_type: 'photo',
          page,
          per_page
        }
      });

      pixabayPhotos = (pixabayRes.data.hits || []).map(photo => ({
        url: photo.webformatURL,
        photographer: photo.user,
        source: 'Pixabay'
      }));

      console.log(`Pixabay retornou ${pixabayPhotos.length} imagens.`);
    } catch (pixabayErr) {
      console.error('Erro na API da Pixabay:', pixabayErr.response?.data || pixabayErr.message);
    }

    const photos = [...pexelsPhotos, ...pixabayPhotos];

    console.log(`Total combinado: ${photos.length} imagens.`);
    return res.json({ photos });
  } catch (err) {
    console.error('Erro inesperado no servidor:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar imagens' });
  }
});

module.exports = router;
