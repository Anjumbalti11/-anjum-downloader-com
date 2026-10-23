// ================================================================
//  SERVER.JS FOR ANJUM DOWNLOADER v19
//  Supports: Static file serving (public/index.html) +
//            High-Speed Stream Proxy & CORS Bypass Download API
// ================================================================

const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Serve 'public' folder containing your index.html
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Extract or decode remote file name
function getFileName(url, contentDisposition) {
  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }
  try {
    const parsed = new URL(url);
    const lastPart = parsed.pathname.split('/').filter(Boolean).pop();
    if (lastPart && lastPart.includes('.')) {
      return decodeURIComponent(lastPart.split('?')[0]);
    }
  } catch (e) {}
  return 'anjum_download_' + Date.now();
}

// 2. Download Stream API (/api/download?url=...)
app.get('/api/download', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
    return res.status(400).send('Please provide a valid URL parameter');
  }

  try {
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: '*/*',
    };

    if (req.headers.range) {
      fetchHeaders.Range = req.headers.range;
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: fetchHeaders,
    });

    if (!response.ok && response.status !== 206) {
      return res.status(response.status).send('Remote server error: ' + response.statusText);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    const contentDisposition = response.headers.get('content-disposition');
    const filename = getFileName(targetUrl, contentDisposition);

    res.status(response.status);
    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent(filename) + '"');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Pipe remote stream to client response
    const { Readable } = require('stream');
    const nodeStream = Readable.fromWeb(response.body);
    nodeStream.pipe(res);

    req.on('close', () => {
      nodeStream.destroy();
    });
  } catch (err) {
    console.error('Download error:', err);
    if (!res.headersSent) {
      res.status(500).send('Download failed: ' + err.message);
    }
  }
});

// 3. Fallback: always serve index.html for any frontend route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('====================================================');
  console.log('  Anjum Downloader v19 Server Started!');
  console.log('  Local URL:   http://localhost:' + PORT);
  console.log('====================================================');
});


