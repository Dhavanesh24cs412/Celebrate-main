import urllib.request
import urllib.parse
import json
import uuid

# We need multipart/form-data to post a file.
# Since standard library is easier if we just write the multipart payload manually:

boundary = uuid.uuid4().hex
headers = {'Content-Type': f'multipart/form-data; boundary={boundary}'}

# Read a dummy image file (e.g. any icon)
with open('d:/Celebrate/public/favicon.svg', 'rb') as f:
    file_bytes = f.read()

body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="test.jpg"\r\n'
    f'Content-Type: image/jpeg\r\n\r\n'.encode('utf-8') +
    file_bytes +
    f'\r\n--{boundary}\r\n'
    f'Content-Disposition: form-data; name="x"\r\n\r\n'
    f'10\r\n'
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="y"\r\n\r\n'
    f'10\r\n'
    f'--{boundary}--\r\n'.encode('utf-8')
)

req = urllib.request.Request('http://127.0.0.1:8000/api/v1/magic-cut/extract', data=body, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        content = response.read()
        print(f"Length: {len(content)}")
        print(f"First 16 bytes: {content[:16]}")
except Exception as e:
    print(f"Error: {e}")
