import os
import glob

API_DIR = r"C:\Users\User\Desktop\twa-app\api"
ts_files = glob.glob(os.path.join(API_DIR, "*.ts"))

for fpath in ts_files:
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "import { fetchWithRotation } from './youtube-fetcher';" in content:
        new_content = content.replace("import { fetchWithRotation } from './youtube-fetcher';", "import { fetchWithRotation } from './youtube-fetcher.js';")
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Patched {os.path.basename(fpath)}")

print("Done.")
