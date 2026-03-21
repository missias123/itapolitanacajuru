from PIL import Image
import os

def process_banner_v2(input_path, output_path):
    with Image.open(input_path) as img:
        # Tamanho original: 1366 x 768 (aproximadamente)
        # Tamanho ideal: 1200 x 240
        
        img_width, img_height = img.size
        
        # Vamos definir uma área de interesse (ROI) que pegue os produtos e a atendente
        # A atendente está à direita, o sorvete no centro e o açaí à esquerda.
        # O banner 1200x240 é muito estreito (5:1), então precisamos de um corte estratégico.
        
        # Vamos tentar pegar a parte central/superior onde estão os rostos e o topo dos produtos
        # Definindo o retângulo de corte (left, top, right, bottom)
        # Vamos focar na faixa que vai de 20% a 60% da altura da imagem original
        
        left = 0
        top = int(img_height * 0.25)  # Começa um pouco abaixo do topo
        right = img_width
        bottom = int(img_height * 0.65) # Pega até o meio dos produtos
        
        img_cropped = img.crop((left, top, right, bottom))
        
        # Agora redimensionamos para 1200x240 mantendo a proporção do corte ou forçando o preenchimento
        # Para evitar distorção, vamos fazer um novo crop proporcional ao 1200x240
        
        crop_w, crop_h = img_cropped.size
        target_ratio = 1200 / 240
        
        if crop_w / crop_h > target_ratio:
            new_w = int(crop_h * target_ratio)
            offset = (crop_w - new_w) / 2
            img_final_crop = img_cropped.crop((offset, 0, offset + new_w, crop_h))
        else:
            new_h = int(crop_w / target_ratio)
            offset = (crop_h - new_h) / 2
            img_final_crop = img_cropped.crop((0, offset, crop_w, offset + new_h))
            
        img_final = img_final_crop.resize((1200, 240), Image.Resampling.LANCZOS)
        
        # Salvar como WebP
        img_final.save(output_path, 'WEBP', quality=90)
        print(f"Banner V2 processado e salvo em: {output_path}")

if __name__ == "__main__":
    input_file = "/home/ubuntu/upload/ImageEditing(6).png"
    output_file = "/home/ubuntu/itapolitanacajuru/images/banner-cardapio.webp"
    process_banner_v2(input_file, output_file)
