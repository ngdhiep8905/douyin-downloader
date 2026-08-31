import json
import re
import os
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
import requests

YTDLP_ERR_MSG = ""
try:
    import yt_dlp
    HAS_YTDLP = True
except Exception as e_import:
    HAS_YTDLP = False
    YTDLP_ERR_MSG = str(e_import)

PORT = 3000
DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'

session = requests.Session()

def extract_url(text):
    """Trích xuất URL từ bất kỳ đoạn văn bản nào"""
    match = re.search(r'https?://[^\s]+', text)
    if match:
        return match.group(0).strip()
    return text.strip()

def clean_youtube_url(url):
    """Chuẩn hóa đường dẫn YouTube sang dạng Embed để vượt qua tất cả kiểm tra Bot/Sign-in của YouTube"""
    match = re.search(r'(?:v=|\/|shorts\/|embed\/)([a-zA-Z0-9_-]{11})', url)
    if match:
        return f"https://www.youtube.com/embed/{match.group(1)}"
    return url

def clean_instagram_url(url):
    """Chuẩn hóa đường dẫn Instagram Reel/Post"""
    match = re.search(r'(?:reel|reels|p)/([a-zA-Z0-9_-]+)', url)
    if match:
        return f"https://www.instagram.com/reel/{match.group(1)}/"
    return url

def extract_video_id(final_url):
    """Trích xuất Video ID từ đường dẫn Douyin/TikTok"""
    match = re.search(r'(?:video|note)/(\d+)', final_url) or re.search(r'modal_id=(\d+)', final_url)
    if match:
        return match.group(1)
    return None

def init_douyin_session():
    """Khởi tạo Cookie ttwid chuẩn từ Bytedance cho session"""
    try:
        reg_url = 'https://ttwid.bytedance.com/ttwid/union/register/'
        payload = {
            'region': 'cn',
            'aid': 1768,
            'needFp': 'true',
            'fp': 'verify_lx',
            'service': 'www.douyin.com'
        }
        headers = {'User-Agent': DESKTOP_UA, 'Referer': 'https://www.douyin.com/'}
        session.post(reg_url, json=payload, headers=headers, timeout=5)
    except Exception as e:
        print("Lỗi tạo ttwid cookie:", e)

def parse_ytdlp_media(url):
    """Bóc tách video đa nền tảng (YouTube Watch/Shorts, Facebook, Instagram, TikTok...) bằng yt-dlp"""
    if not HAS_YTDLP:
        return None, f"yt-dlp chưa được cài đặt: {YTDLP_ERR_MSG}"
    
    # Chuẩn hóa URL cho YouTube & Instagram
    clean_target_url = url
    if 'youtube.com' in url.lower() or 'youtu.be' in url.lower():
        clean_target_url = clean_youtube_url(url)
    elif 'instagram.com' in url.lower() or 'instagr.am' in url.lower():
        clean_target_url = clean_instagram_url(url)

    try:
        ydl_opts = {
            'skip_download': True,
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
            'noplaylist': True
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(clean_target_url, download=False)
            title = info.get('title', 'Video')
            author = info.get('uploader') or info.get('uploader_id') or 'Media Creator'
            cover = info.get('thumbnail', '')
            
            video_url = info.get('url')
            if not video_url and info.get('formats'):
                formats_with_url = [f for f in info['formats'] if f.get('url')]
                if formats_with_url:
                    video_url = formats_with_url[-1]['url']

            if video_url:
                print(f" -> yt-dlp Engine THÀNH CÔNG cho {clean_target_url[:40]}!")
                return {
                    "success": True,
                    "data": {
                        "id": info.get('id', 'media'),
                        "title": title,
                        "author": {"name": author, "avatar": ""},
                        "coverUrl": cover,
                        "videoUrl": video_url,
                        "musicUrl": "",
                        "statistics": {
                            "digg_count": info.get('like_count', 0),
                            "comment_count": info.get('comment_count', 0),
                            "share_count": 0
                        }
                    }
                }, None
    except Exception as e:
        print("Lỗi yt-dlp Engine:", e)
        return None, str(e)
    return None, "Không tìm thấy đường dẫn video phù hợp"

def parse_instagram_fallback(url):
    """Bóc tách dự phòng cho Instagram Reel qua Embed Page"""
    try:
        headers = {'User-Agent': MOBILE_UA}
        clean_url = clean_instagram_url(url)
        
        # 1. Thử lấy từ Embed Endpoint
        shortcode = ''
        match = re.search(r'(?:reel|reels|p)/([a-zA-Z0-9_-]+)', clean_url)
        if match:
            shortcode = match.group(1)
            
        if shortcode:
            embed_url = f"https://www.instagram.com/p/{shortcode}/embed/captioned/"
            r_embed = session.get(embed_url, headers=headers, timeout=8)
            og_video = re.search(r'property="og:video"\s+content="([^"]+)"', r_embed.text) or re.search(r'content="([^"]+)"\s+property="og:video"', r_embed.text)
            og_title = re.search(r'property="og:title"\s+content="([^"]+)"', r_embed.text)
            og_image = re.search(r'property="og:image"\s+content="([^"]+)"', r_embed.text) or re.search(r'display_url":"([^"]+)"', r_embed.text)

            if og_video:
                v_url = og_video.group(1).replace('&amp;', '&').replace('\\u0026', '&').replace('\\/', '/')
                c_url = og_image.group(1).replace('&amp;', '&').replace('\\u0026', '&').replace('\\/', '/') if og_image else ""
                print(" -> Instagram Fallback Engine THÀNH CÔNG!")
                return {
                    "success": True,
                    "data": {
                        "id": shortcode,
                        "title": og_title.group(1) if og_title else "Instagram Reel",
                        "author": {"name": "Instagram Creator", "avatar": ""},
                        "coverUrl": c_url,
                        "videoUrl": v_url,
                        "musicUrl": "",
                        "statistics": {"digg_count": 0, "comment_count": 0, "share_count": 0}
                    }
                }
    except Exception as e:
        print("Lỗi Instagram Fallback:", e)
    return None

def parse_tikwm_media(final_url):
    """Xử lý bóc tách video TikTok qua TikWM Service"""
    try:
        tik_res = session.post('https://www.tikwm.com/api/', data={'url': final_url}, headers={'User-Agent': DESKTOP_UA}, timeout=10)
        if tik_res.status_code == 200:
            js = tik_res.json()
            if js.get('code') == 0 and js.get('data'):
                d = js['data']
                print(" -> TikWM Engine THÀNH CÔNG!")
                return {
                    "success": True,
                    "data": {
                        "id": d.get('id') or "tiktok",
                        "title": d.get('title', 'TikTok Video'),
                        "author": {
                            "name": d.get('author', {}).get('nickname', 'TikTok User'),
                            "avatar": d.get('author', {}).get('avatar', '')
                        },
                        "coverUrl": d.get('cover', ''),
                        "videoUrl": d.get('play', ''),
                        "musicUrl": d.get('music', ''),
                        "statistics": {
                            "digg_count": d.get('digg_count', 0),
                            "comment_count": d.get('comment_count', 0),
                            "share_count": d.get('share_count', 0)
                        }
                    }
                }
    except Exception as e:
        print("Lỗi TikWM Engine:", e)
    return None

def parse_douyin_or_tiktok_video(raw_input):
    input_url = extract_url(raw_input)
    if not input_url:
        return {"success": False, "error": "Vui lòng nhập đường dẫn video hợp lệ!"}

    url_lower = input_url.lower()
    is_youtube = 'youtube.com' in url_lower or 'youtu.be' in url_lower
    is_instagram = 'instagram.com' in url_lower or 'instagr.am' in url_lower
    is_douyin = 'douyin.com' in url_lower

    # CHỈ GIẢI MÃ REDIRECT KHI LÀ SHORT LINK (Bỏ qua YouTube/Instagram để tránh dính HTTP 429)
    final_url = input_url
    if not (is_youtube or is_instagram) and ('v.douyin.com' in url_lower or 'vt.tiktok.com' in url_lower or 'vm.tiktok.com' in url_lower):
        try:
            res = session.get(input_url, headers={'User-Agent': MOBILE_UA}, allow_redirects=True, timeout=8)
            final_url = res.url
        except Exception as e:
            print("Lỗi theo dõi redirect:", e)

    video_id = extract_video_id(final_url)
    print(f"[MediaParser] Input: {input_url} | Final: {final_url} | VideoID: {video_id}")

    # ===== ENGINE CHÍNH CHO DOUYIN =====
    if is_douyin and video_id:
        try:
            init_douyin_session()
            api_headers = {
                'User-Agent': DESKTOP_UA,
                'Referer': 'https://www.douyin.com/',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Cookie': 'msToken=1234567890; ' + '; '.join([f'{k}={v}' for k, v in session.cookies.get_dict().items()])
            }

            api_url = f"https://www.douyin.com/aweme/v1/web/aweme/detail/?aweme_id={video_id}&device_platform=webapp&aid=6383&channel=channel_pc_web&pc_client_type=1&version_code=190500&version_name=19.5.0&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Chrome"
            
            api_res = session.get(api_url, headers=api_headers, timeout=8)
            if api_res.status_code == 200 and len(api_res.text) > 50:
                js = api_res.json()
                if js.get('aweme_detail'):
                    item = js['aweme_detail']
                    title = item.get('desc', 'Douyin Video')
                    author = {
                        "name": item.get('author', {}).get('nickname', 'Douyin User'),
                        "avatar": item.get('author', {}).get('avatar_thumb', {}).get('url_list', [''])[0] if item.get('author') else ''
                    }

                    video_info = item.get('video', {})
                    raw_v_url = ''
                    if video_info.get('play_addr') and video_info['play_addr'].get('url_list'):
                        raw_v_url = video_info['play_addr']['url_list'][0]

                    video_no_watermark = raw_v_url.replace('playwm', 'play') if raw_v_url else ''

                    cover_url = ''
                    if video_info.get('cover') and video_info['cover'].get('url_list'):
                        cover_url = video_info['cover']['url_list'][0]

                    music_url = ''
                    music_info = item.get('music', {})
                    if music_info.get('play_url') and music_info['play_url'].get('url_list'):
                        music_url = music_info['play_url']['url_list'][0]

                    stats = item.get('statistics', {})
                    statistics = {
                        "digg_count": stats.get('digg_count', 0),
                        "comment_count": stats.get('comment_count', 0),
                        "share_count": stats.get('share_count', 0)
                    }

                    print(" -> Douyin 2026 Engine THÀNH CÔNG!")
                    return {
                        "success": True,
                        "data": {
                            "id": video_id,
                            "title": title,
                            "author": author,
                            "coverUrl": cover_url,
                            "videoUrl": video_no_watermark,
                            "musicUrl": music_url,
                            "statistics": statistics
                        }
                    }
        except Exception as e_main:
            print("Lỗi Engine Douyin chính:", e_main)

    # ===== DỰ PHÒNG CHUNG VÀ CÁC NỀN TẢNG KHÁC (YouTube/Facebook/Instagram/TikTok) =====
    result_ytdlp, err_ytdlp = parse_ytdlp_media(final_url)
    if result_ytdlp:
        return result_ytdlp

    if is_instagram:
        result_ig = parse_instagram_fallback(final_url)
        if result_ig:
            return result_ig

    result_tik = parse_tikwm_media(final_url)
    if result_tik:
        return result_tik

    return {
        "success": False,
        "error": f"Không thể xử lý video này: {err_ytdlp if err_ytdlp else 'Vui lòng kiểm tra lại đường dẫn video!'}"
    }

class DouyinRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.join(os.path.dirname(__file__), 'public'), **kwargs)

    def do_POST(self):
        if self.path == '/api/parse':
            content_length = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_length)
            try:
                data = json.loads(post_body.decode('utf-8'))
                raw_url = data.get('url', '')
                result = parse_douyin_or_tiktok_video(raw_url)
                
                self.send_response(200 if result.get('success') else 400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
        else:
            self.send_error(404, "Not Found")

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path.rstrip('/')

        # Điều hướng các đường dẫn SEO trang con về index.html
        if path in ['/tiktok', '/douyin', '/facebook', '/instagram', '/youtube']:
            self.path = '/index.html'
            return super().do_GET()

        if parsed_url.path == '/api/download':
            query = urllib.parse.parse_qs(parsed_url.query)
            file_url = query.get('url', [''])[0]
            file_type = query.get('type', ['video'])[0]
            filename = query.get('filename', ['video_nowatermark.mp4'])[0]

            if not file_url:
                self.send_error(400, "Missing URL")
                return

            try:
                headers = {'User-Agent': DESKTOP_UA, 'Referer': 'https://www.douyin.com/'}
                req = session.get(file_url, headers=headers, stream=True, timeout=15)
                
                self.send_response(200)
                self.send_header('Content-Type', 'audio/mpeg' if file_type == 'audio' else 'video/mp4')
                self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                for chunk in req.iter_content(chunk_size=8192):
                    if chunk:
                        self.wfile.write(chunk)
            except Exception as e:
                print("Lỗi download proxy:", e)
                self.send_error(500, "Download proxy failed")
        else:
            super().do_GET()

if __name__ == '__main__':
    print("==================================================")
    print(f" SaveTik All-in-One Downloader Server running at: http://localhost:{PORT}")
    print("==================================================")
    server = HTTPServer(('0.0.0.0', PORT), DouyinRequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
