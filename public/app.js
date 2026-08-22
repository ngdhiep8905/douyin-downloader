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
      showError('Vui lòng nhập đường dẫn video Douyin!');
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
      authorName.textContent = data.author ? data.author.name : 'Douyin User';
      if (data.author && data.author.avatar) {
        authorAvatar.src = data.author.avatar;
      } else {
        authorAvatar.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authorName.textContent);
      }

      likeCount.textContent = formatNumber(data.statistics ? data.statistics.digg_count : 0);
      commentCount.textContent = formatNumber(data.statistics ? data.statistics.comment_count : 0);
      videoTitle.textContent = data.title || 'Video Douyin';

      // Nguồn phát video preview & thumbnail
      videoPreview.poster = data.coverUrl || '';
      videoPreview.src = `/api/download?url=${encodeURIComponent(data.videoUrl)}&type=video&filename=douyin_${data.id}.mp4`;

      // Cập nhật link tải về qua endpoint proxy
      downloadVideoBtn.href = `/api/download?url=${encodeURIComponent(data.videoUrl)}&type=video&filename=douyin_${data.id}.mp4`;
      
      if (data.musicUrl) {
        downloadAudioBtn.href = `/api/download?url=${encodeURIComponent(data.musicUrl)}&type=audio&filename=douyin_audio_${data.id}.mp3`;
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
