import urllib.request
import os
import time

url = "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"
filename = "sam_vit_b_01ec64.pth"

while True:
    try:
        req = urllib.request.Request(url)
        if os.path.exists(filename):
            file_size = os.path.getsize(filename)
            req.headers['Range'] = f'bytes={file_size}-'
            print(f"Resuming from {file_size} bytes")
        else:
            file_size = 0
            
        with urllib.request.urlopen(req, timeout=10) as response:
            with open(filename, 'ab') as f:
                while True:
                    chunk = response.read(8192)
                    if not chunk:
                        break
                    f.write(chunk)
                    file_size += len(chunk)
                    if file_size % (1024 * 1024) == 0:
                        print(f"Downloaded {file_size / (1024 * 1024)} MB")
        
        print("Download complete.")
        break
    except Exception as e:
        print(f"Error: {e}")
        time.sleep(2)
