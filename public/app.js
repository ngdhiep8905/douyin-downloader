document.addEventListener('DOMContentLoaded', () => {
  const downloadForm = document.getElementById('downloadForm');
  const videoUrlInput = document.getElementById('videoUrl');
  const pasteBtn = document.getElementById('pasteBtn');
  const submitBtn = document.getElementById('submitBtn');
  const loading = document.getElementById('loading');
  const errorAlert = document.getElementById('errorAlert');
  const errorMsg = document.getElementById('errorMsg');
  const resultContainer = document.getElementById('resultContainer');

  // Result Elements
  const videoPreview = document.getElementById('videoPreview');
  const authorAvatar = document.getElementById('authorAvatar');
  const authorName = document.getElementById('authorName');
  const likeCount = document.getElementById('likeCount');
  const commentCount = document.getElementById('commentCount');
  const videoTitle = document.getElementById('videoTitle');
  const downloadVideoBtn = document.getElementById('downloadVideoBtn');
  const downloadAudioBtn = document.getElementById('downloadAudioBtn');

  // Xử lý SEO trang con dựa trên URL Path
  function updateSEOPage() {
    const path = window.location.pathname.toLowerCase();
    const heroHeading = document.querySelector('#downloader h2');
    const heroSubtext = document.querySelector('#downloader p');

    if (path.includes('bilibili')) {
      document.title = 'Tải Video Bilibili (B Trạm) HD Không Logo Miễn Phí | SaveTik';
      if (heroHeading) heroHeading.innerHTML = 'Tải Video Bilibili (哔哩哔哩) <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Chất Lượng HD</span>';
      if (heroSubtext) heroSubtext.textContent = 'Công cụ miễn phí giúp bạn tải xuống video Bilibili (B Trạm Trung Quốc) chất lượng cao, không dính logo mờ và tách nhạc MP3 nhanh chóng.';
      if (videoUrlInput) videoUrlInput.placeholder = 'Dán link Bilibili vào đây (VD: https://www.bilibili.com/video/BV... hoặc b23.tv)';
    } else if (path.includes('xiaohongshu')) {
      document.title = 'Tải Video Tiểu Hồng Thư (Xiaohongshu) Không Logo HD Miễn Phí | SaveTik';
      if (heroHeading) heroHeading.innerHTML = 'Tải Video Tiểu Hồng Thư <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Không Logo HD</span>';
      if (heroSubtext) heroSubtext.textContent = 'Công cụ miễn phí giúp bạn tải xuống video Tiểu Hồng Thư (小红书 - Xiaohongshu) chất lượng cao, không dính watermark.';
      if (videoUrlInput) videoUrlInput.placeholder = 'Dán link Tiểu Hồng Thư vào đây (VD: https://xhslink.com/... hoặc xiaohongshu.com)';
    } else if (path.includes('kuaishou')) {
      document.title = 'Tải Video Kuaishou (Khóa Thủ) Không Logo HD Miễn Phí | SaveTik';
      if (heroHeading) heroHeading.innerHTML = 'Tải Video Kuaishou (快手) <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Không Logo HD</span>';
      if (heroSubtext) heroSubtext.textContent = 'Công cụ miễn phí giúp bạn tải xuống video Khóa Thủ Kuaishou Trung Quốc không dính logo watermark.';
      if (videoUrlInput) videoUrlInput.placeholder = 'Dán link Kuaishou vào đây (VD: https://v.kuaishou.com/...)';
    } else if (path.includes('weibo')) {
      document.title = 'Tải Video Weibo Trung Quốc HD Miễn Phí | SaveTik';
      if (heroHeading) heroHeading.innerHTML = 'Tải Video Weibo (微博) <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Chất Lượng HD</span>';
      if (heroSubtext) heroSubtext.textContent = 'Công cụ miễn phí giúp bạn tải xuống video Weibo Trung Quốc chất lượng cao sắc nét.';
      if (videoUrlInput) videoUrlInput.placeholder = 'Dán link Weibo vào đây (VD: https://weibo.com/...)';
    } else if (path.includes('facebook')) {
      document.title = 'Tải Video Facebook Reels HD Miễn Phí | SaveTik';
      if (heroHeading) heroHeading.innerHTML = 'Tải Video Facebook Reels <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Chất Lượng HD</span>';
      if (heroSubtext) heroSubtext.textContent = 'Công cụ miễn phí giúp bạn tải xuống video Facebook Reels & Watch chất lượng cao, không dính logo và tách nhạc MP3 nhanh chóng.';
      if (videoUrlInput) videoUrlInput.placeholder = 'Dán link Facebook Reels vào đây (VD: https://www.facebook.com/reel/...)';
    } else if (path.includes('instagram')) {
      document.title = 'Tải Video Instagram Reels HD Miễn Phí | SaveTik';
      if (heroHeading) heroHeading.innerHTML = 'Tải Video Instagram Reels <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Chất Lượng HD</span>';
      if (heroSubtext) heroSubtext.textContent = 'Công cụ miễn phí giúp bạn tải xuống video Instagram Reels chất lượng cao, không dính logo và tách nhạc MP3 nhanh chóng.';
      if (videoUrlInput) videoUrlInput.placeholder = 'Dán link Instagram Reels vào đây (VD: https://www.instagram.com/reel/...)';
    } else if (path.includes('youtube')) {
      document.title = 'Tải Video YouTube Shorts & Watch HD Miễn Phí | SaveTik';
      if (heroHeading) heroHeading.innerHTML = 'Tải Video YouTube <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Shorts & Watch HD</span>';
      if (heroSubtext) heroSubtext.textContent = 'Công cụ miễn phí giúp bạn tải xuống video YouTube Shorts & Watch chất lượng cao, không dính logo và tách nhạc MP3 nhanh chóng.';
      if (videoUrlInput) videoUrlInput.placeholder = 'Dán link YouTube vào đây (VD: https://www.youtube.com/watch?v=... hoặc Shorts)';
    } else if (path.includes('tiktok')) {
      document.title = 'Tải Video TikTok Không Logo (Watermark) Miễn Phí HD | SaveTik';
      if (heroHeading) heroHeading.innerHTML = 'Tải Video TikTok <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Không Logo HD</span>';
      if (heroSubtext) heroSubtext.textContent = 'Công cụ miễn phí giúp bạn tải xuống video TikTok chất lượng cao, không dính hình mờ (watermark) và tách nhạc MP3 nhanh chóng.';
      if (videoUrlInput) videoUrlInput.placeholder = 'Dán link TikTok vào đây (VD: https://vt.tiktok.com/...)';
    } else if (path.includes('douyin')) {
      document.title = 'Tải Video Douyin Không Logo (Watermark) Miễn Phí HD | SaveTik';
      if (heroHeading) heroHeading.innerHTML = 'Tải Video Douyin <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Không Logo HD</span>';
      if (heroSubtext) heroSubtext.textContent = 'Công cụ miễn phí giúp bạn tải xuống video Douyin chất lượng cao, không dính hình mờ (watermark) và tách nhạc MP3 nhanh chóng.';
      if (videoUrlInput) videoUrlInput.placeholder = 'Dán link Douyin vào đây (VD: https://v.douyin.com/...)';
    }
  }

  updateSEOPage();

  // Nút Dán Link từ bộ nhớ tạm Clipboard
  if (pasteBtn) {
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          videoUrlInput.value = text;
          videoUrlInput.focus();
        }
      } catch (err) {
        alert('Trình duyệt không cho phép tự động dán. Vui lòng nhấn giữ và Dán thủ công!');
      }
    });
  }

  // Định dạng số (1.5k, 1.2M...)
  function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Hiển thị lỗi
  function showError(message) {
    errorMsg.textContent = message;
    errorAlert.classList.remove('hidden');
    resultContainer.classList.add('hidden');
  }

  // Ẩn lỗi
  function hideError() {
    errorAlert.classList.add('hidden');
  }

  // Submit Form
  downloadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const rawUrl = videoUrlInput.value.trim();
    if (!rawUrl) {
      showError('Vui lòng nhập đường dẫn video!');
      return;
    }

    // Hiển thị trạng thái đang tải
    loading.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50');

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: rawUrl })
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Không thể xử lý video này.');
      }

      const data = resData.data;

      // Cập nhật giao diện thông tin Video
      authorName.textContent = data.author ? data.author.name : 'Creator';
      if (data.author && data.author.avatar) {
        authorAvatar.src = data.author.avatar;
      } else {
        authorAvatar.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authorName.textContent);
      }

      likeCount.textContent = formatNumber(data.statistics ? data.statistics.digg_count : 0);
      commentCount.textContent = formatNumber(data.statistics ? data.statistics.comment_count : 0);
      videoTitle.textContent = data.title || 'Video';

      // Nguồn phát video preview & thumbnail
      videoPreview.poster = data.coverUrl || '';
      videoPreview.src = `/api/download?url=${encodeURIComponent(data.videoUrl)}&type=video&filename=savetik_${data.id}.mp4`;

      // Cập nhật link tải về qua endpoint proxy
      downloadVideoBtn.href = `/api/download?url=${encodeURIComponent(data.videoUrl)}&type=video&filename=savetik_${data.id}.mp4`;
      
      if (data.musicUrl) {
        downloadAudioBtn.href = `/api/download?url=${encodeURIComponent(data.musicUrl)}&type=audio&filename=savetik_audio_${data.id}.mp3`;
        downloadAudioBtn.classList.remove('hidden');
      } else {
        downloadAudioBtn.classList.add('hidden');
      }

      // Hiển thị kết quả
      resultContainer.classList.remove('hidden');

      // Tự động cuộn xuống phần kết quả
      resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
      console.error(err);
      showError(err.message || 'Đã xảy ra lỗi kết nối. Vui lòng kiểm tra lại đường dẫn!');
    } finally {
      loading.classList.add('hidden');
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-50');
    }
  });
});
