const express = require('express');
const cors = require('cors');
const YtdlCore = require('@ybd-project/ytdl-core');

const app = express();

// CORS enable karein
app.use(cors());
app.use(express.json());

// Proxy URL (Vercel ke Environment Variables se aayega)
const PROXY_URL = process.env.PROXY_URL || null;

// 1. Home Route (Health Check)
app.get('/', (req, res) => {
    res.send('Anjum Downloader API is Live on Vercel! 🚀');
});

// 2. Video Info Route
app.get('/info', async (req, res) => {
    const videoURL = req.query.url;
    if (!videoURL) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }

    try {
        const options = {};
        if (PROXY_URL) {
            options.originalProxy = PROXY_URL;
        }

        const info = await YtdlCore.getInfo(videoURL, options);
        
        res.json({
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
            duration: info.videoDetails.lengthSeconds
        });
    } catch (error) {
        console.error('Info Error:', error.message);
        res.status(500).json({ error: 'Video info nahi mil saki.', details: error.message });
    }
});

// 3. Download Route
app.get('/download', async (req, res) => {
    const videoURL = req.query.url;
    if (!videoURL) {
        return res.status(400).send('YouTube URL is required');
    }

    try {
        const options = {};
        if (PROXY_URL) {
            options.originalProxy = PROXY_URL;
        }

        res.header('Content-Disposition', 'attachment; filename="video.mp4"');

        YtdlCore(videoURL, { 
            ...options,
            filter: 'audioandvideo', 
            quality: 'highest'
        }).pipe(res);

    } catch (error) {
        console.error('Download Error:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Download fail ho gaya.');
        }
    }
});

// ⚠️ VERCEL KE LIYE SABSE ZAROORI LINE:
// app.listen() nahi likhna, balke app ko export karna hai
module.exports = app;