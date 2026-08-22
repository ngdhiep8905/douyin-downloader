const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// User-Agent cho Mobile và PC để bypass anti-bot Douyin
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Trích xuất URL Douyin từ chuỗi văn bản chia sẻ
 */
function extractDouyinUrl(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  if (matches && matches.length > 0) {
    return matches[0];
  }
  return text.trim();
}

/**
 * Lấy Video ID từ URL đã giải mã redirect
 */
function extractVideoId(finalUrl) {
  // Mẫu: /video/7123456789012345678 hoặc /note/7123456789012345678 hoặc modal_id=712345...
  const match = finalUrl.match(/(?:video|note)\/(\d+)/) || finalUrl.match(/modal_id=(\d+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * API Xử lý lấy thông tin video Douyin không watermark
 */
app.post('/api/parse', async (req, res) => {
  try {
    const { url: rawInput } = req.body;
    if (!rawInput) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập link Douyin!' });
    }

    const inputUrl = extractDouyinUrl(rawInput);

    // 1. Giải mã Short Link (v.douyin.com) -> Long Link
    let finalUrl = inputUrl;
    try {
      const redirectResponse = await axios.get(inputUrl, {
        headers: { 'User-Agent': MOBILE_UA },
        maxRedirects: 5,
        validateStatus: null
      });
      if (redirectResponse.request && redirectResponse.request.res && redirectResponse.request.res.responseUrl) {
        finalUrl = redirectResponse.request.res.responseUrl;
      } else if (redirectResponse.headers.location) {
        finalUrl = redirectResponse.headers.location;
      }
    } catch (e) {
      console.log('Lỗi khi theo dõi redirect, thử tiếp tục với URL gốc:', e.message);
    }

    // 2. Lấy Video ID
    const videoId = extractVideoId(finalUrl);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'Không tìm thấy ID video. Vui lòng kiểm tra lại đường dẫn Douyin!'
      });
    }

    // 3. Gọi API công khai Douyin để lấy chi tiết Video
    let videoData = null;
    try {
      const apiUrl = `https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${videoId}`;
      const apiRes = await axios.get(apiUrl, {
        headers: { 'User-Agent': MOBILE_UA }
      });

      if (apiRes.data && apiRes.data.item_list && apiRes.data.item_list.length > 0) {
        videoData = apiRes.data.item_list[0];
      }
    } catch (apiErr) {
      console.log('API V2 thất bại, chuyển sang phương án phụ...', apiErr.message);
    }

    // Phương án dự phòng 2: Gọi API Douyin Web
    if (!videoData) {
      try {
        const detailUrl = `https://www.douyin.com/aweme/v1/web/aweme/detail/?aweme_id=${videoId}`;
        const detailRes = await axios.get(detailUrl, {
          headers: {
            'User-Agent': DESKTOP_UA,
            'Referer': 'https://www.douyin.com/'
          }
        });
        if (detailRes.data && detailRes.data.aweme_detail) {
          videoData = detailRes.data.aweme_detail;
        }
      } catch (err2) {
        console.log('Phương án 2 thất bại:', err2.message);
      }
    }

    if (!videoData) {
      return res.status(404).json({
        success: false,
        error: 'Không thể lấy thông tin video. Video có thể ở chế độ riêng tư hoặc đã bị xóa.'
      });
    }

    // 4. Bóc tách thông tin: Title, Cover, Video No-Watermark URL, Audio URL
    const title = videoData.desc || 'Douyin Video';
    const author = {
      name: videoData.author ? videoData.author.nickname : 'Douyin User',
      avatar: videoData.author && videoData.author.avatar_thumb ? videoData.author.avatar_thumb.url_list[0] : ''
    };

    // Lấy link video & chuyển 'playwm' thành 'play' để bỏ logo watermark
    let rawVideoUrl = '';
    if (videoData.video && videoData.video.play_addr && videoData.video.play_addr.url_list) {
      rawVideoUrl = videoData.video.play_addr.url_list[0];
    }

    const videoNoWatermark = rawVideoUrl ? rawVideoUrl.replace('playwm', 'play') : '';
    
    // Ảnh bìa
    const coverUrl = videoData.video && videoData.video.cover && videoData.video.cover.url_list 
      ? videoData.video.cover.url_list[0] 
      : '';

    // Âm thanh MP3
    const musicUrl = videoData.music && videoData.music.play_url && videoData.music.play_url.url_list
      ? videoData.music.play_url.url_list[0]
      : '';

    // Thống kê lượt thích, comment
    const statistics = {
      digg_count: videoData.statistics ? videoData.statistics.digg_count : 0,
      comment_count: videoData.statistics ? videoData.statistics.comment_count : 0,
      share_count: videoData.statistics ? videoData.statistics.share_count : 0
    };

    return res.json({
      success: true,
      data: {
        id: videoId,
        title,
        author,
        coverUrl,
        videoUrl: videoNoWatermark,
        musicUrl,
        statistics
      }
    });

  } catch (error) {
    console.error('Lỗi Server:', error);
    return res.status(500).json({
      success: false,
      error: 'Đã xảy ra lỗi trên Server khi xử lý video. Vui lòng thử lại sau!'
    });
  }
});

/**
 * Route Proxy Stream để ép trình duyệt tải tập tin về máy thay vì tự phát
 */
app.get('/api/download', async (req, res) => {
  try {
    const { url, type, filename } = req.query;
    if (!url) {
      return res.status(400).send('Thiếu URL tập tin!');
    }

    const downloadFileName = filename || (type === 'audio' ? 'douyin_audio.mp3' : 'douyin_video_nowatermark.mp4');

    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': MOBILE_UA,
        'Referer': 'https://www.douyin.com/'
      }
    });

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadFileName)}"`);
    res.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');

    response.data.pipe(res);
  } catch (err) {
    console.error('Lỗi khi proxy download:', err.message);
    res.status(500).send('Lỗi khi tải tập tin xuống.');
  }
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Douyin Downloader WebApp đang chạy tại: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
