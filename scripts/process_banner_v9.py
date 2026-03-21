from PIL import Image, ImageFilter
import os

def process_banner_v9(input_path, output_path):
    with Image.open(input_path) as img:
        target_w = 1200
        target_h = 450
        
        # 1. Redimensionar a imagem original para caber INTEIRA na altura de 450px
        orig_w, orig_h = img.size
        new_h = target_h
        new_w = int((orig_w * target_h) / orig_h)
        
        img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # 2. Criar o fundo de 1200x450 com a imagem original desfocada (blur)
        # Primeiro redimensionamos para cobrir toda a área de 1200x450
        bg_w = target_w
        bg_h = int((orig_h * target_w) / orig_w)
        if bg_h < target_h:
            bg_h = target_h
            bg_w = int((orig_w * target_h) / orig_h)
            
        background = img.resize((bg_w, bg_h), Image.Resampling.LANCZOS)
        
        # Cortar o centro para 1200x450
        left = (bg_w - target_w) // 2
        top = (bg_h - target_h) // 2
        right = left + target_w
        bottom = top + target_h
        background = background.crop((left, top, right, bottom))
        
        # Aplicar desfoque forte
        background = background.filter(ImageFilter.GaussianBlur(radius=20))
        
        # 3. Colar a imagem redimensionada (nítida) no centro do fundo desfocado
        offset_x = (target_w - new_w) // 2
        background.paste(img_resized, (offset_x, 0))
        
        # 4. Salvar como WebP
        background.save(output_path, 'WEBP', quality=95)
        
        # Gerar versões responsivas
        for size in [768, 480]:
            h = int((target_h * size) / target_w)
            resp = background.resize((size, h), Image.Resampling.LANCZOS)
            resp_path = output_path.replace('.webp', f'-{size}.webp')
            resp.save(resp_path, 'WEBP', quality=90)
            
        print(f"Banner V9 (Smart Fill 1200x450) processado e salvo em: {output_path}")

if __name__ == "__main__":
    input_file = "/home/ubuntu/upload/ImageEditing(5).png"
    output_file = "/home/ubuntu/itapolitanacajuru/images/banner-cardapio.webp"
    process_banner_v9(input_file, output_file)
