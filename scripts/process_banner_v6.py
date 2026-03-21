from PIL import Image
import os

def process_banner_v6(input_path, output_path):
    with Image.open(input_path) as img:
        # Tamanho ideal do banner: 1200 x 240
        target_w = 1200
        target_h = 240
        
        # 1. Calcular a proporção para o corte "Cover" (preenchimento completo)
        orig_w, orig_h = img.size
        target_ratio = target_w / target_h
        orig_ratio = orig_w / orig_h
        
        if orig_ratio > target_ratio:
            # Imagem é mais larga que o alvo: corta as laterais
            new_w = int(orig_h * target_ratio)
            offset = (orig_w - new_w) // 2
            img_cropped = img.crop((offset, 0, offset + new_w, orig_h))
        else:
            # Imagem é mais alta que o alvo: corta o topo e a base
            # Vamos focar na parte superior (onde estão os rostos)
            new_h = int(orig_w / target_ratio)
            # Foco no topo (10% de margem superior)
            top_offset = int(orig_h * 0.1)
            if top_offset + new_h > orig_h:
                top_offset = orig_h - new_h
            img_cropped = img.crop((0, top_offset, orig_w, top_offset + new_h))
            
        # 2. Redimensionar para o tamanho final exato
        img_final = img_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
        # 3. Salvar como WebP com alta qualidade
        img_final.save(output_path, 'WEBP', quality=95)
        print(f"Banner V6 (Preenchimento Completo) processado e salvo em: {output_path}")

if __name__ == "__main__":
    input_file = "/home/ubuntu/upload/ImageEditing(5).png" # Usando a imagem original enviada anteriormente
    output_file = "/home/ubuntu/itapolitanacajuru/images/banner-cardapio.webp"
    process_banner_v6(input_file, output_file)
