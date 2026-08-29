import json
import re
import os
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
import requests

PORT = 3000
DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'

session = requests.Session()

def extract_url(text):
    """Trích xuất URL từ bất kỳ đoạn văn bản nào (Douyin hoặc TikTok)"""
    match = re.search(r'https?://[^\s]+', text)
    if match:
        return match.group(0).strip()
    return text.strip()

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

def parse_tiktok_video(final_url):
    """Xử lý bóc tách video TikTok không logo qua TikWM Engine"""
    try:
        tik_res = session.post('https://www.tikwm.com/api/', data={'url': final_url}, headers={'User-Agent': DESKTOP_UA}, timeout=10)
        if tik_res.status_code == 200:
            js = tik_res.json()
            if js.get('code') == 0 and js.get('data'):
                d = js['data']
                print(" -> TikTok Engine (TikWM) THÀNH CÔNG!")
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
        print("Lỗi TikTok Engine:", e)
    return None

def parse_douyin_or_tiktok_video(raw_input):
    input_url = extract_url(raw_input)
    if not input_url:
        return {"success": False, "error": "Vui lòng nhập đường dẫn video Douyin hoặc TikTok!"}

    # 1. Giải mã Short Link -> Long Link
    final_url = input_url
    try:
        res = session.get(input_url, headers={'User-Agent': MOBILE_UA}, allow_redirects=True, timeout=8)
        final_url = res.url
    except Exception as e:
        print("Lỗi theo dõi redirect:", e)

    video_id = extract_video_id(final_url)
    print(f"[MediaParser] Input: {input_url} | Final: {final_url} | VideoID: {video_id}")

    # Nhận diện nếu là link TikTok
    is_tiktok = 'tiktok.com' in final_url.lower() or 'tiktok.com' in input_url.lower()

    if is_tiktok:
        result = parse_tiktok_video(final_url)
        if result:
            return result

    # ===== ENGINE DOUYIN 2026 (Hoặc fallback cho TikTok) =====
    if video_id and not is_tiktok:
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

    # ===== PHƯƠNG ÁN DỰ PHÒNG CHUNG (TikWM Engine) =====
    result = parse_tiktok_video(final_url)
    if result:
        return result

    return {
        "success": False,
        "error": "Không thể lấy thông tin video. Vui lòng kiểm tra lại đường dẫn Douyin hoặc TikTok!"
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
    print(f" Douyin & TikTok Downloader Server running at: http://localhost:{PORT}")
    print("==================================================")
    server = HTTPServer(('0.0.0.0', PORT), DouyinRequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
