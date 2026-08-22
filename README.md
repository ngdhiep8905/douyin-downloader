# 🎬 Web Tải Video Douyin Không Logo & Tích Hợp Quảng Cáo Kiếm Tiền

Ứng dụng Web hoàn chỉnh giúp bóc tách video Douyin (chất lượng HD không dính hình mờ / watermark) và MP3 âm thanh, tích hợp sẵn các **Vị Trí Quảng Cáo Chiến Lược (Ad Slots)** giúp tối đa hóa thu nhập từ lượt truy cập.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Cài đặt tại thư mục D:\Project\douyin-downloader

Yêu cầu: Đã cài sẵn [Node.js](https://nodejs.org/) trên máy tính.

```bash
# Mở Terminal / PowerShell tại thư mục dự án
cd D:\Project\douyin-downloader

# Cài đặt thư viện dependencies
npm install

# Khởi chạy server
npm start
```

Sau khi chạy thành công, truy cập trình duyệt web tại địa chỉ:  
👉 **`http://localhost:3000`**

---

## 💰 Hướng Dẫn Tích Hợp Quảng Cáo Kiếm Tiền (Ad Monetization)

Tất cả các vị trí quảng cáo đã được đánh dấu rõ ràng trong tệp **`public/index.html`** bằng khối class `ad-slot-box`.

### Các vị trí Quảng cáo có sẵn trên giao diện:
1. **[VỊ TRÍ QUẢNG CÁO 1 - HEADER BANNER]**: Đặt Banner kích thước 728x90 (PC) hoặc 300x250 (Mobile) ngay đầu trang.
2. **[VỊ TRÍ QUẢNG CÁO 2 - MIDDLE BANNER]**: Nằm ngay dưới Form nhập link. Nơi người dùng dễ quan sát nhất khi chuẩn bị dán link.
3. **[VỊ TRÍ QUẢNG CÁO 3 - DOWNLOAD AD SLOT (High CTR)]**: Nằm ngay sát nút **Tải Video HD Không Logo**, đem lại tỷ lệ click (CTR) cao nhất.
4. **[VỊ TRÍ QUẢNG CÁO 4 - FOOTER BANNER]**: Nằm ở cuối trang, thích hợp cho Banner 728x90 hoặc Popunder script.

---

### Cách chèn mã Quảng cáo vào Web:

Mở tệp [`public/index.html`](file:///D:/Project/douyin-downloader/public/index.html), tìm đến ghi chú `<!-- CHÈN MÃ QUẢNG CÁO CỦA BẠN VÀO ĐÂY -->` và thay thế khối `ad-slot-box` bằng đoạn mã script từ mạng quảng cáo của bạn.

#### 1. Nếu sử dụng Google AdSense:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

#### 2. Nếu sử dụng Adsterra / Monetag / PopAds (Mạng quảng cáo duyệt nhanh cho trang Utility):
Chỉ cần sao chép mã **Native Banner**, **Social Bar** hoặc **Popunder Direct Link** do Adsterra cấp và dán vào ngay trước thẻ `</body>` hoặc tại các vị trí đã đánh dấu.

---

## 🌐 Hướng Dẫn Triển Khai Lên Web (Deploy Online)

Để trang web của bạn chạy online 24/7 và đón người dùng toàn cầu:

1. **Render.com** (Khuyên dùng - Miễn phí):
   - Đưa code lên Github repository.
   - Đăng ký tài khoản [Render.com](https://render.com).
   - Tạo **New Web Service**, kết nối tới Github repo.
   - Build Command: `npm install`
   - Start Command: `node server.js`

2. **Tên Miền (Domain)**:
   - Đăng ký một tên miền dễ nhớ liên quan tới Douyin/Video Downloader (Ví dụ: `douyinsave.com`, `downtik.net`...) từ Namecheap, Cloudflare hoặc GoDaddy để thu hút traffic tìm kiếm Google (SEO).

---

## 🛠️ Cấu Trúc Dự Án

```
D:\Project\douyin-downloader/
├── package.json      # Khai báo thư viện (express, axios, cors)
├── server.js          # Node.js Express Server xử lý gỡ watermark Douyin & Proxy stream file
├── public/
│   ├── index.html     # Giao diện người dùng HTML5 + Tailwind CSS + Ad Slots
│   └── app.js         # Javascript xử lý gọi API & tải tập tin
└── README.md          # Hướng dẫn chi tiết
```
