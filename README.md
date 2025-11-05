# 🧠 DecoupageApp – Backend

**DecoupageApp** é um backend Node.js desenvolvido para automação e gerenciamento de mídia audiovisual.

Ele integra ferramentas de  **IA** , **FFmpeg** e **processamento de arquivos** para facilitar tarefas como importação, transcrição, criação e conversão de vídeos — tudo centralizado em uma API modular e extensível.

> Projeto pessoal de portfólio, criado para estudo e demonstração de habilidades em backend, automação de mídia e integração de IA.

---

## 🚀 Tecnologias Principais

* **Node.js** – ambiente de execução JavaScript
* **Express.js** – framework web para criação de rotas e APIs RESTful
* **FFmpeg** – processamento e conversão de vídeos e áudios
* **OpenAI API** (ou similar) – geração de scripts e vídeos com IA
* **dotenv** – gerenciamento de variáveis de ambiente
* **Multer / FS** – manipulação de arquivos e uploads

---

## 📂 Estrutura do Projeto

<pre class="overflow-visible!" data-start="1165" data-end="2057"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>backend/
├── main.js                  </span><span># Ponto de entrada da aplicação</span><span>
├── .env.example             </span><span># Exemplo de variáveis de ambiente</span><span>
├── routes/
│   ├── api.js               </span><span># Rotas gerais da API</span><span>
│   ├── backups.js           </span><span># Rotas de backup e restauração</span><span>
│   ├── images.js            </span><span># Manipulação e upload de imagens</span><span>
│   ├── </span><span>import</span><span>.js            </span><span># Importação de dados</span><span>
│   ├── importFolder.js      </span><span># Importação em lote de pastas</span><span>
│   ├── share.js             </span><span># Compartilhamento de arquivos/mídia</span><span>
│   ├── videos.js            </span><span># Processamento e controle de vídeos</span><span>
│   ├── AI/
│   │   ├── createVideoAI.js </span><span># Geração de vídeos com IA</span><span>
│   │   ├── scriptAI.js      </span><span># Criação de roteiros com IA</span><span>
│   │   └── transcribe.js    </span><span># Transcrição de áudio/vídeo</span><span>
│   └── ffmpeg/
│       ├── convertVideo.js  </span><span># Conversão de formatos de vídeo</span><span>
│       └── extractAudio.js  </span><span># Extração de áudio de vídeos</span><span>
</span></span></code></div></div></pre>

---

## ⚙️ Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`.

As variáveis podem incluir:

<pre class="overflow-visible!" data-start="2196" data-end="2275"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>PORT=3000
OPENAI_API_KEY=sua_chave_aqui
FFMPEG_PATH=/usr/bin/ffmpeg
</span></span></code></div></div></pre>

---

## 🧩 Instalação e Execução

1. **Clone o repositório**
   <pre class="overflow-visible!" data-start="2341" data-end="2450"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>git </span><span>clone</span><span> https://github.com/seuusuario/decoupageapp-backend.git
   </span><span>cd</span><span> decoupageapp-backend
   </span></span></code></div></div></pre>
2. **Instale as dependências**
   <pre class="overflow-visible!" data-start="2486" data-end="2515"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>npm install
   </span></span></code></div></div></pre>
3. **Configure o arquivo `.env`**
   <pre class="overflow-visible!" data-start="2554" data-end="2638"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>cp</span><span> .env.example .</span><span>env</span><span>
   </span><span># edite as variáveis conforme seu ambiente</span><span>
   </span></span></code></div></div></pre>
4. **Inicie o servidor**
   <pre class="overflow-visible!" data-start="2668" data-end="2695"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>npm start
   </span></span></code></div></div></pre>
5. **Servidor rodando em:**
   <pre class="overflow-visible!" data-start="2728" data-end="2763"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre!"><span><span>http:</span><span>//localhost:3000</span><span>
   </span></span></code></div></div></pre>

---

## 📡 Rotas Principais

| Método  | Rota                          | Descrição                   |
| -------- | ----------------------------- | ----------------------------- |
| `GET`  | `/api/status`               | Verifica o status do servidor |
| `POST` | `/api/videos/upload`        | Faz upload de um vídeo       |
| `POST` | `/api/ai/createVideo`       | Gera vídeo usando IA         |
| `POST` | `/api/ai/script`            | Cria roteiro automatizado     |
| `POST` | `/api/ai/transcribe`        | Transcreve áudio ou vídeo   |
| `POST` | `/api/ffmpeg/convert`       | Converte formato de vídeo    |
| `POST` | `/api/ffmpeg/extract-audio` | Extrai áudio de um vídeo    |
| `GET`  | `/api/backups`              | Lista backups existentes      |
| `POST` | `/api/share`                | Gera link de compartilhamento |

> As rotas podem variar conforme a configuração interna em `/routes`.

---

## 🧠 Recursos e Diferenciais

* 🎬  **Automação de mídia** : integração direta com FFmpeg
* 🧩  **Módulos independentes** : rotas organizadas por domínio
* 🤖  **Integração com IA** : geração e transcrição de vídeos
* 📦  **Importação inteligente** : suporte a importação de pastas inteiras
* 🔄  **Backups automatizados** : rotas dedicadas para armazenamento seguro

---

## 🧑‍💻 Autor

**Felipe Silva**

Desenvolvedor Front-End & Back-End | Criação de soluções digitais e automações criativas

📧 felipe.stefanelli.tech@gmail.com

🔗 [LinkedIn](https://www.linkedin.com/in/felipe-stefanelli/)

---

## 📝 Licença

Este projeto é de  **uso pessoal e portfólio** .

Não é destinado a fins comerciais sem autorização do autor.
