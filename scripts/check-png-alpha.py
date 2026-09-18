from pathlib import Path
import struct

path = Path('/home/ubuntu/work/customer-app/public/hadx-monogram-emitter.png')
data = path.read_bytes()
if data[:8] != b'\x89PNG\r\n\x1a\n':
    raise SystemExit('not a PNG')
color_type = data[25]
print(f'png_color_type={color_type} alpha_channel={color_type in (4, 6)}')
if color_type not in (4, 6):
    raise SystemExit('PNG has no alpha channel')
print(f'bytes={len(data)}')
_struct = struct.Struct('>I')
_struct.unpack(data[8:12])

icur = 8
while icur < len(data):
    length = _struct.unpack(data[icur:icur+4])[0]
    chunk = data[icur+4:icur+8]
    if chunk == b'IEND':
        break
    icur += 12 + length
print('alpha_check=pass')
