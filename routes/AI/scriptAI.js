const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function generateScript(prompt, duration = "00:30", soundtrack = "livre", variations = 1) {
  const systemPrompt = `
    Você é um roteirista sênior com 40 anos de carreira especializado em chamadas, trailers e promos para TV.
    Sua missão é escrever roteiros publicitários altamente impactantes, com linguagem publicitária clara, criativa e visual.

    O roteiro deve seguir o formato:

    [TIMECODE - por exemplo: 00:00-00:05]
    IMAGEM: (descrição visual)
    OFF: (fala do narrador)
    TRILHA: (clima ou estilo de música)
    ARTE: (videografismo)

    Instruções específicas:
    - A duração total do roteiro deve ser de exatamente ${duration}.
    - O estilo da trilha sonora deve ser "${soundtrack}".
    - Gere ${variations} versão(ões) diferentes do roteiro, com ideias e abordagens únicas.
    - Não repita a mesma estrutura ou fala nas versões. Seja criativo.
    - Evite repetir a descrição da tarefa.
    - Cada versão deve começar com: === VERSÃO 1 ===, === VERSÃO 2 === etc.

    Somente retorne o conteúdo do roteiro. 
    Use frases curtas e impactantes, ritmo de trailer, linguagem emocional e publicitária. Explore contrastes visuais e textuais. Pense como um criador experiente de chamadas de TV aberta. Surpreenda.
  `;

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta',
      {
        inputs: `<|system|>\n${systemPrompt.trim()}\n<|user|>\nIDEIA: ${prompt}\n<|assistant|>`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const raw = response.data?.[0]?.generated_text || '';

    // Remove tokens desnecessários
    const cleaned = raw.replace(/<\|system\|>|<\|user\|>|<\|assistant\|>/g, '').trim();
    
    // Divide por cada versão
    const versionsArray = cleaned.split(/=== VERSÃO \d+ ===/i).filter(v => v.trim());
    
    // Se não encontrou nenhuma versão marcada, tenta cortar pelo primeiro timecode ou VOZ OFF
    if (versionsArray.length === 0) {
      const fallbackStart = cleaned.search(/^\[.*\]|\bIMAGEM:|\bVOZ OFF:|\bTRILHA:/i);
      return fallbackStart !== -1 ? cleaned.slice(fallbackStart).trim() : cleaned;
    }
    
    // Reconstrói com marcadores de versão
    const final = versionsArray.map((v, i) => `=== VERSÃO ${i + 1} ===\n${v.trim()}`).join('\n\n');
    return final;
  } catch (err) {
    console.error('Erro ao chamar a API Hugging Face:', err.response?.data || err.message);
    throw new Error('Erro na chamada da IA: ' + (err.response?.status || err.message));
  }
}

module.exports = { generateScript };
