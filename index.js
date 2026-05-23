import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Determine __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Gemini API Configuration
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set in .env file.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Persona: Customer Service Bot
const systemInstruction = {
  parts: [{
    text: `
      Anda adalah agen customer service untuk Nexus Store, sebuah marketplace online yang menjual berbagai kategori produk: elektronik (smartphone, laptop, aksesoris), fashion (pakaian, sepatu, tas), kebutuhan rumah tangga, makanan & minuman, kecantikan & kesehatan, serta mainan & hobi.

      Aturan penting:
      1. Anda HANYA menjawab pertanyaan seputar produk dan layanan Nexus Store.
      2. Jika ditanya pertanyaan di luar topik, balas dengan sopan bahwa Anda hanya bisa membantu terkait produk/layanan kami.
      3. JANGAN menyebutkan alamat toko fisik, link website spesifik, atau nomor telepon, karena toko ini adalah marketplace online konseptual untuk keperluan demonstrasi. Jika pengguna bertanya, katakan bahwa Nexus Store dapat diakses melalui website resmi kami (tanpa menyebut URL spesifik).
      4. Gunakan bahasa Indonesia yang ramah, santai, dan informatif.
      5. Jika pengguna bertanya tentang ketersediaan produk atau harga spesifik, berikan jawaban yang bersifat umum dan jelaskan bahwa stok dan harga dapat berubah sewaktu-waktu.
    `.trim()
  }]
};

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;

  if (!conversation || !Array.isArray(conversation)) {
    return res.status(400).json({ error: 'Invalid conversation format' });
  }

  // Map conversation history to Gemini format
  const mappedHistory = conversation.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  try {
    // History: semua pesan kecuali yang terakhir (yang akan dikirim via sendMessage)
    const historyMessages = mappedHistory.slice(0, -1);
    const lastMessage = mappedHistory[mappedHistory.length - 1];

    const chat = model.startChat({
      history: historyMessages,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      },
      systemInstruction: systemInstruction,
    });

    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const responseText = result.response.text();

    res.json({ result: responseText });
  } catch (error) {
    console.error('Error interacting with Gemini API:', error.message);
    res.status(500).json({ error: 'Failed to get response from AI', details: error.message });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  console.log(`Serving static files from ${path.join(__dirname, 'public')}`);
});
