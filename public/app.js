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
  const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, '');
  const heroHeading = document.querySelector('#downloader h2');
  
  if (currentPath === '/tiktok') {
    document.title = 'Tải Video TikTok Không Logo (Watermark) Miễn Phí HD | SaveTik';
    if (heroHeading) heroHeading.innerHTML = 'Tải Video TikTok <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Không Logo HD</span>';
    if (videoUrlInput) videoUrlInput.placeholder = 'Dán link TikTok vào đây (VD: https://vt.tiktok.com/...)';
  } else if (currentPath === '/douyin') {
    document.title = 'Tải Video Douyin Không Logo (Watermark) Miễn Phí HD | SaveTik';
    if (heroHeading) heroHeading.innerHTML = 'Tải Video Douyin <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Không Logo HD</span>';
    if (videoUrlInput) videoUrlInput.placeholder = 'Dán link Douyin vào đây (VD: https://v.douyin.com/...)';
  } else if (currentPath === '/facebook') {
    document.title = 'Tải Video Facebook Reels HD Miễn Phí | SaveTik';
    if (heroHeading) heroHeading.innerHTML = 'Tải Video Facebook Reels <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Chất Lượng HD</span>';
    if (videoUrlInput) videoUrlInput.placeholder = 'Dán link Facebook Reels vào đây...';
  } else if (currentPath === '/instagram') {
    document.title = 'Tải Video Instagram Reels HD Miễn Phí | SaveTik';
    if (heroHeading) heroHeading.innerHTML = 'Tải Video Instagram Reels <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Chất Lượng HD</span>';
    if (videoUrlInput) videoUrlInput.placeholder = 'Dán link Instagram Reels vào đây...';
  } else if (currentPath === '/youtube') {
    document.title = 'Tải Video YouTube Shorts HD Miễn Phí | SaveTik';
    if (heroHeading) heroHeading.innerHTML = 'Tải Video YouTube Shorts <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-cyan-400">Chất Lượng HD</span>';
    if (videoUrlInput) videoUrlInput.placeholder = 'Dán link YouTube Shorts vào đây...';
  }

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
