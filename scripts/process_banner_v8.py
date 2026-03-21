from PIL import Image
import os

def process_banner_v8(input_path, output_path):
    with Image.open(input_path) as img:
        # Novo tamanho promocional: 1200 x 450
        target_w = 1200
        target_h = 450
        
        # 1. Redimensionar a imagem original para caber INTEIRA na altura de 450px
        orig_w, orig_h = img.size
        new_h = target_h
        new_w = int((orig_w * target_h) / orig_h)
        
        img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # 2. Criar o fundo de 1200x450
        # Usar branco para o fundo
        background = Image.new('RGB', (target_w, target_h), (255, 255, 255))
        
        # 3. Colar a imagem redimensionada no centro do fundo
        offset_x = (target_w - new_w) // 2
        background.paste(img_resized, (offset_x, 0))
        
        # 4. Salvar como WebP
        background.save(output_path, 'WEBP', quality=95)
        print(f"Banner V8 (Promocional 1200x450) processado e salvo em: {output_path}")

if __name__ == "__main__":
    input_file = "/home/ubuntu/upload/ImageEditing(5).png"
    output_file = "/home/ubuntu/itapolitanacajuru/images/banner-cardapio.webp"
    process_banner_v8(input_file, output_file)
