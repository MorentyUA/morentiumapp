import urllib.request
import urllib.error
import json

url = 'https://morentiumapp.vercel.app/api/verify_key'
data = json.dumps({'key': 'test', 'hwid': 'test'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    response = urllib.request.urlopen(req)
    with open('pytest_result.txt', 'w', encoding='utf-8') as f:
        f.write(f"Status 200:\n{response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    with open('pytest_result.txt', 'w', encoding='utf-8') as f:
        f.write(f"HTTP Error {e.code}:\n{e.read().decode('utf-8')}")
except Exception as e:
    with open('pytest_result.txt', 'w', encoding='utf-8') as f:
        f.write(f"Unknown Error: {str(e)}")
print("Wrote to pytest_result.txt")
