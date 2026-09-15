"""Compose a repository sharing card from the real website screenshot."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

root = Path(__file__).resolve().parents[1]
output = root / 'docs' / 'images'
canvas = Image.new('RGB', (1280, 640), '#870c05')
draw = ImageDraw.Draw(canvas)
for x in range(-640, 1280, 9):
    draw.line((x, 0, x + 640, 640), fill='#990e07', width=2)
draw.rectangle((7, 7, 1272, 632), outline='#ffe197', width=3)
draw.rectangle((15, 15, 1264, 624), outline='#dba94d')
font_dir = Path('C:/Windows/Fonts')
def font(size):
    return ImageFont.truetype(str(font_dir / 'msyhbd.ttc'), size)
draw.text((44, 41), 'CPCF', font=font(71), fill='#ffe49a', stroke_width=1, stroke_fill='#ffe49a')
draw.text((46, 145), '中國人能飛', font=font(38), fill='#fff0b5')
draw.text((47, 210), 'CHINESE PEOPLE', font=font(17), fill='#efd285')
draw.text((47, 237), 'CAN FLY', font=font(28), fill='#efd285')
draw.line((47, 300, 305, 300), fill='#e5be6d', width=2)
for y, label in [(332, '滿鑽金字 · 鴻運大獎'), (374, '無需跑道 · 生來能飛'), (416, '一張會起飛的數字海報')]:
    draw.text((47, y), label, font=font(19), fill='#fff0b5')
draw.text((47, 553), 'github.com/Lecheeel/cpcf', font=font(15), fill='#ffe49a')
preview = Image.open(output / 'desktop.png').convert('RGB')
preview = ImageOps.contain(preview, (895, 562), Image.Resampling.LANCZOS)
canvas.paste(preview, (351, (640-preview.height)//2))
canvas.quantize(colors=256).save(output / 'social-preview.png', optimize=True)
print('Saved 1280 × 640 social-preview.png')
