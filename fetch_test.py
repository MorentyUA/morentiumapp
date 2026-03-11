import urllib.request
import urllib.error
import json

url = 'https://morentiumapp.vercel.app/api/verify_key'
data = json.dumps({'key': 'test', 'hwid': 'test'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    response = urllib.request.urlopen(req)
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}:\n{e.read().decode('utf-8')}")
except Exception as e:
    print(f"Unknown Error: {e}")
