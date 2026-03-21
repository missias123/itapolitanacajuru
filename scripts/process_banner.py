from PIL import Image
import os

def process_banner(input_path, output_path):
    with Image.open(input_path) as img:
        # Tamanho ideal: 1200 x 240
        target_width = 1200
        target_height = 240
        
        # Calcular proporção para crop centralizado
        img_width, img_height = img.size
        aspect_ratio = target_width / target_height
        
        if img_width / img_height > aspect_ratio:
            # Imagem é mais larga que o alvo
            new_width = int(img_height * aspect_ratio)
            left = (img_width - new_width) / 2
            img = img.crop((left, 0, left + new_width, img_height))
        else:
            # Imagem é mais alta que o alvo
            new_height = int(img_width / aspect_ratio)
            top = (img_height - new_height) / 2
            img = img.crop((0, top, img_width, top + new_height))
            
        # Redimensionar para o tamanho final
        img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        # Salvar como WebP
        img.save(output_path, 'WEBP', quality=85)
        print(f"Banner processado e salvo em: {output_path}")

if __name__ == "__main__":
    input_file = "/home/ubuntu/upload/ImageEditing(6).png"
    output_file = "/home/ubuntu/itapolitanacajuru/images/banner-cardapio.webp"
    process_banner(input_file, output_file)
