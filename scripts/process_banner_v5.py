from PIL import Image, ImageFilter
import os

def process_banner_v5(input_path, output_path):
    with Image.open(input_path) as img:
        # Tamanho ideal do banner: 1200 x 240
        target_w = 1200
        target_h = 240
        
        # 1. Redimensionar a imagem original para caber na altura de 240px
        # Mantendo a proporção para não distorcer
        orig_w, orig_h = img.size
        new_h = target_h
        new_w = int((orig_w * target_h) / orig_h)
        
        img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # 2. Criar o fundo de 1200x240
        # Vamos usar um fundo desfocado da própria imagem para preencher as laterais
        # Redimensionamos a original para preencher o fundo 1200x240 (vai esticar, mas vamos desfocar)
        background = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        background = background.filter(ImageFilter.GaussianBlur(radius=20))
        
        # 3. Colar a imagem redimensionada no centro do fundo
        offset_x = (target_w - new_w) // 2
        background.paste(img_resized, (offset_x, 0))
        
        # 4. Salvar como WebP com alta qualidade
        background.save(output_path, 'WEBP', quality=95)
        print(f"Banner V5 (Sem Cortes) processado e salvo em: {output_path}")

if __name__ == "__main__":
    input_file = "/home/ubuntu/upload/ImageEditing(5).png"
    output_file = "/home/ubuntu/itapolitanacajuru/images/banner-cardapio.webp"
    process_banner_v5(input_file, output_file)
