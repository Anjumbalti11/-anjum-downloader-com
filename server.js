const express = require('express');
const cors = require('cors');
const youtubedl = require('yt-dlp-exec');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Home Route (Frontend load karega)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Route (Video/Audio links nikale ga)
app.get('/api/download', async (req, res) => {
    let url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL required' });

    // Direct MP4/MP3 links handle karein
    if (url.endsWith('.mp4') || url.endsWith('.mp3')) {
        return res.json({
            success: true,
            title: 'Direct Media File',
            thumbnail: 'https://cdn-icons-png.flaticon.com/512/716/716784.png',
            video_url: url,
            audio_url: ''
        });
    }

    // Agar TikTok/Insta ka link ghalti se .mp4 par khatam ho raha ho
    if (url.includes('tiktok.com') || url.includes('instagram.com')) {
        url = url.replace(/\.mp4$/i, '');
    }

    try {
        // yt-dlp-exec ke zariye data fetch karein
        const output = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            addHeader: [
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        });

        let video_url = output.url || '';
        let audio_url = '';

        // Formats mein se best video aur audio nikalein
        if (!video_url && output.formats) {
            for (let f of output.formats) {
                if (f.ext === 'mp4' && f.vcodec !== 'none' && f.url) {
                    video_url = f.url;
                    break;
                }
            }
            for (let f of output.formats) {
                if (f.acodec !== 'none' && f.vcodec === 'none' && f.url) {
                    audio_url = f.url;
                    break;
                }
            }
        }

        if (!video_url) {
            return res.status(400).json({ error: 'Video link nahi mila. Private ho sakta hai.' });
        }

        res.json({
            success: true,
            title: output.title || 'Social Media Video',
            thumbnail: output.thumbnail || '',
            video_url: video_url,
            audio_url: audio_url
        });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: `Download failed: ${error.message}` });
    }
});

// Server Start
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Server successfully chalu ho gaya: http://127.0.0.1:${PORT}`);
});
