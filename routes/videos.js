const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();


const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

router.get('/', async (req, res) => {
  const { query, page = 1, per_page = 9 } = req.query;
  if (!query) return res.status(400).json({ error: 'Query obrigatória' });

  try {
    // 🔹 Pexels Videos
    const pexelsRes = await axios.get('https://api.pexels.com/videos/search', {
      headers: { Authorization: PEXELS_API_KEY },
      params: { query, page, per_page }
    });

    const pexelsVideos = (pexelsRes.data.videos || []).map(v => ({
      url: v.video_files[0]?.link,
      source: v.user.name,
      platform: 'Pexels'
    }));

    // 🔹 Pixabay Videos
    const pixabayRes = await axios.get('https://pixabay.com/api/videos/', {
      params: {
        key: PIXABAY_API_KEY,
        q: query,
        page,
        per_page
      }
    });

    const pixabayVideos = (pixabayRes.data.hits || []).map(v => ({
      url: v.videos.medium.url,
      source: v.user,
      platform: 'Pixabay'
    }));

    const videos = [...pexelsVideos, ...pixabayVideos];

    return res.json({ videos });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Erro ao buscar vídeos' });
  }
});

module.exports = router;
