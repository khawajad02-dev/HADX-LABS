from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/work/customer-app/public/hadx-monogram-emitter.png')
target = Path('/home/ubuntu/work/customer-app/public/hadx-monogram-emitter-alpha.png')
image = Image.open(source).convert('RGBA')
pixels = image.load()
for y in range(image.height):
    for x in range(image.width):
        r, g, b, _ = pixels[x, y]
        spread = max(r, g, b) - min(r, g, b)
        # The generated checkerboard is neutral gray/white; the gold monogram has clear chroma.
        if spread <= 14 and min(r, g, b) >= 145:
            pixels[x, y] = (r, g, b, 0)
        else:
            pixels[x, y] = (r, g, b, 255)
image.save(target, 'PNG', optimize=True)
print(f'written={target} size={image.width}x{image.height}')
