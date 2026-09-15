from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageOps, ImageChops

ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / '_ref_img' / 'images.jpg').convert('RGBA')
source = source.resize((447,447), Image.Resampling.LANCZOS)

def cutout(name, points):
    mask = Image.new('L', source.size)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(.45))
    result = source.copy()
    result.putalpha(mask)
    result = result.crop(mask.getbbox())
    result.save(ROOT / 'assets' / name)

cutout('flying-boss.png', [(54,123),(63,124),(81,135),(117,132),(147,117),(160,100),(187,87),(197,81),(198,54),(204,29),(222,22),(241,29),(249,46),(245,81),(254,91),(272,96),(294,109),(313,131),(342,136),(368,120),(374,110),(379,114),(376,125),(389,122),(394,128),(382,139),(364,145),(332,149),(305,146),(276,132),(275,172),(168,176),(168,133),(144,145),(111,149),(80,143),(59,137)])
cutout('flying-car.png', [(127,188),(149,164),(173,158),(245,158),(271,166),(292,190),(314,192),(325,209),(323,248),(315,271),(298,274),(291,256),(150,256),(143,273),(126,271),(116,251),(114,215),(119,199)])
cutout('palm.png', [(1,213),(24,211),(18,198),(44,207),(32,189),(54,200),(58,177),(68,185),(83,180),(83,196),(102,186),(109,198),(105,213),(123,203),(126,215),(150,217),(130,231),(147,246),(129,244),(142,263),(121,252),(129,277),(110,262),(106,282),(99,257),(97,290),(91,276),(81,292),(86,244),(75,230),(64,250),(46,268),(45,258),(18,274),(35,251),(12,256),(29,237),(4,244),(17,229),(1,231)])

# A small photographic roof fragment retains the deliberately rough print texture.
source.crop((47, 273, 387, 305)).save(ROOT / 'assets' / 'roof.png')
print('Prepared 4 local collage assets.')

car = Image.open(ROOT / '_ref_img' / '4250ac3a6b74fff74cff4d879dd371042568f07553987-2xVoj7_fw240.webp').convert('RGBA')
car.crop(car.getbbox()).save(ROOT / 'assets' / 'royal-car.png')
source = Image.open(ROOT / '_ref_img' / '典雅的新古典主义豪宅的正面对称，有中央-379433975.webp').convert('RGBA')
cutout('mansion.png', [(42,247),(170,204),(171,176),(159,173),(215,148),(216,114),(207,112),(212,104),(231,104),(240,128),(293,112),(302,112),(302,103),(321,104),(323,113),(464,115),(471,105),(486,109),(486,117),(579,131),(593,117),(595,105),(612,103),(624,110),(621,151),(662,168),(650,177),(650,207),(778,250),(769,257),(769,333),(46,334)])

def printed_cutout(original, destination, width, spacing):
    """Bake the print screen into the photograph, preserving its cutout alpha."""
    image = Image.open(ROOT / 'assets' / original).convert('RGBA')
    image = image.resize((width, round(width * image.height / image.width)), Image.Resampling.LANCZOS)
    alpha = image.getchannel('A')
    rgb = ImageEnhance.Color(image.convert('RGB')).enhance(.72)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.14)
    rgb = ImageOps.posterize(rgb, 5)
    # Slight CMY registration error lives inside the silhouette, not on its alpha.
    red, green, blue = rgb.split()
    rgb = Image.merge('RGB', (ImageChops.offset(red, 1, 0), green, ImageChops.offset(blue, -1, 0)))
    rgb = Image.blend(rgb, Image.new('RGB', rgb.size, '#c4c2aa'), .12)
    screen = Image.new('RGBA', rgb.size)
    dots = ImageDraw.Draw(screen)
    radius = spacing * .23
    for row, y in enumerate(range(0, rgb.height + spacing, spacing)):
        for x in range(-spacing, rgb.width + spacing, spacing):
            cx = x + (spacing // 2 if row % 2 else 0)
            dots.ellipse((cx-radius,y-radius,cx+radius,y+radius), fill=(14,29,48,145))
            dots.ellipse((cx+spacing*.35,y+spacing*.35,cx+spacing*.56,y+spacing*.56), fill=(255,244,211,90))
    printed = Image.alpha_composite(rgb.convert('RGBA'), screen)
    grain = Image.effect_noise(rgb.size, 24).convert('RGB')
    printed = Image.blend(printed.convert('RGB'), grain, .09).convert('RGBA')
    printed.putalpha(alpha)
    printed.save(ROOT / 'assets' / destination, optimize=True)

printed_cutout('royal-car.png', 'royal-car-print.png', 880, 8)
printed_cutout('mansion.png', 'mansion-print.png', 1472, 6)
print('Prepared halftone car and mansion; original cutouts preserved.')
