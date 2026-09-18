"""Copy untransformed source and package extension folders (no build dependencies)."""
from pathlib import Path
import json,shutil,zipfile
root=Path(__file__).resolve().parents[1]
(root/'dist').mkdir(exist_ok=True)
for target in ['chrome','firefox']:
 folder=root/target
 for p in (root/'common').iterdir():
  if p.is_file():shutil.copyfile(p,folder/p.name)
 shutil.copyfile(root/'LICENSE',folder/'LICENSE')
 version=json.loads((folder/'manifest.json').read_text(encoding='utf-8'))['version']
 output=root/'dist'/f'moe-ledger-{target}-v{version}.zip'
 with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
  for p in sorted(folder.iterdir()):
   if p.is_file():
    entry=zipfile.ZipInfo(p.name,(2026,1,1,0,0,0));entry.compress_type=zipfile.ZIP_DEFLATED;z.writestr(entry,p.read_bytes())
 print(output.name)
