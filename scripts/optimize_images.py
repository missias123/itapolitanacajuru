import os
from PIL import Image

def optimize_images(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                filepath = os.path.join(root, file)
                try:
                    with Image.open(filepath) as img:
                        # Converter para WebP
                        webp_path = os.path.splitext(filepath)[0] + '.webp'
                        img.save(webp_path, 'WEBP', quality=80)
                        print(f"Otimizado: {filepath} -> {webp_path}")
                except Exception as e:
                    print(f"Erro ao processar {filepath}: {e}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    optimize_images(os.path.join(base_dir, 'images'))
    optimize_images(os.path.join(base_dir, 'imagens'))
    optimize_images(os.path.join(base_dir, 'fotos'))
    optimize_images(os.path.join(base_dir, 'dados'))
