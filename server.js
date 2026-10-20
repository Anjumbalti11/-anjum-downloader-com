const express = require('express');
const cors = require('cors');
// Nayi safe serverless routing library
const { ytdl } = require('@ybd-project/ytdl-core'); 

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ status: "API is live and active!" });
});

app.get('/api/download', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ error: "YouTube URL required" });
    }

    try {
        // Dynamic payload validation taake cloud block na ho
        const info = await ytdl.getInfo(videoUrl);
        
        // Audio aur video combined link pick karna
        const format = info.formats.find(f => f.hasVideo && f.hasAudio && f.url);

        if (!format) {
            return res.status(404).json({ error: "Working streaming URL not found by serverless node." });
        }

        return res.json({
            success: true,
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[0]?.url || '',
            duration: info.videoDetails.lengthSeconds,
            downloadUrl: format.url 
        });

    } catch (error) {
        console.error("Fetch Error:", error.message);
        return res.status(500).json({ 
            error: "YouTube security blocked this request on Vercel.", 
            reason: error.message 
        });
    }
});

module.exports = app;

