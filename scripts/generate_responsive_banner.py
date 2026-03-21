
from PIL import Image
import os

def generate_responsive_images(input_path, output_dir, base_name, sizes):
    img = Image.open(input_path)
    for size in sizes:
        width = size
        height = int((float(img.size[1]) * float(width / float(img.size[0]))))
        resized_img = img.resize((width, height), Image.LANCZOS)
        output_path = os.path.join(output_dir, f'{base_name}-{width}.webp')
        resized_img.save(output_path, 'webp', quality=85)
        print(f'Generated {output_path}')

if __name__ == '__main__':
    input_image = '/home/ubuntu/itapolitanacajuru/images/banner-cardapio.webp'
    output_directory = '/home/ubuntu/itapolitanacajuru/images/'
    base_file_name = 'banner-cardapio'
    responsive_sizes = [480, 768, 1200]

    generate_responsive_images(input_image, output_directory, base_file_name, responsive_sizes)
