import os, shutil

os.makedirs('api/_youtube', exist_ok=True)

for f in os.listdir('api'):
    if f.startswith('youtube-') and f.endswith('.ts'):
        shutil.move(f'api/{f}', f'api/_youtube/{f}')
        print(f"Moved {f}")

for f in ['blobs.ts', 'migrate-blobs-to-redis.ts']:
    path = f'api/{f}'
    if os.path.exists(path):
        os.remove(path)
        print(f"Deleted {f}")

print("Python script completed.")
