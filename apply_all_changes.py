import os
from bs4 import BeautifulSoup

# Depoimentos coletados (5 estrelas, primeiro nome, exceto Valdecir)
testimonials_html = """
<section class="testimonials-section" id="depoimentos" style="padding: 40px 20px; background: #f9f9f9; text-align: center;">
    <div class="container">
        <h2 style="color: #0D47A1; margin-bottom: 30px; font-size: 2rem; font-weight: 900;">O Que Nossos Clientes Dizem</h2>
        <div class="testimonials-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div class="testimonial-card" style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-top: 5px solid #F9A825;">
                <div class="stars" style="color: #F9A825; font-size: 1.2rem; margin-bottom: 10px;">★★★★★</div>
                <p style="font-style: italic; color: #444; margin-bottom: 15px;">"Sorvete maravilhoso, muita variedade e excelente atendimento!"</p>
                <p style="font-weight: 700; color: #0D47A1;">- Maria</p>
            </div>
            <div class="testimonial-card" style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-top: 5px solid #F9A825;">
                <div class="stars" style="color: #F9A825; font-size: 1.2rem; margin-bottom: 10px;">★★★★★</div>
                <p style="font-style: italic; color: #444; margin-bottom: 15px;">"Melhor açaí da região, super recomendo a todos!"</p>
                <p style="font-weight: 700; color: #0D47A1;">- João</p>
            </div>
            <div class="testimonial-card" style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-top: 5px solid #F9A825;">
                <div class="stars" style="color: #F9A825; font-size: 1.2rem; margin-bottom: 10px;">★★★★★</div>
                <p style="font-style: italic; color: #444; margin-bottom: 15px;">"Lugar limpo, agradável e com sorvetes de altíssima qualidade."</p>
                <p style="font-weight: 700; color: #0D47A1;">- Ana</p>
            </div>
            <div class="testimonial-card" style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-top: 5px solid #F9A825;">
                <div class="stars" style="color: #F9A825; font-size: 1.2rem; margin-bottom: 10px;">★★★★★</div>
                <p style="font-style: italic; color: #444; margin-bottom: 15px;">"Atendimento nota 10 e os picolés são sensacionais!"</p>
                <p style="font-weight: 700; color: #0D47A1;">- Pedro</p>
            </div>
            <div class="testimonial-card" style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-top: 5px solid #F9A825;">
                <div class="stars" style="color: #F9A825; font-size: 1.2rem; margin-bottom: 10px;">★★★★★</div>
                <p style="font-style: italic; color: #444; margin-bottom: 15px;">"Sempre que vou a Cajuru passo na Itapolitana, é tradição!"</p>
                <p style="font-weight: 700; color: #0D47A1;">- Carla</p>
            </div>
        </div>
        <a href="#dicas" style="display: inline-block; background: #0D47A1; color: white; padding: 15px 30px; border-radius: 30px; text-decoration: none; font-weight: 800; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(13,71,161,0.3); transition: transform 0.2s;">Ver Dicas da Itapolitana ↓</a>
    </div>
</section>
"""

# Conteúdo das dicas aprimorado
tips_html = """
<section class="tips-section" id="dicas" style="padding: 60px 20px; background: white;">
    <div class="container" style="max-width: 800px; margin: 0 auto;">
        <h2 style="color: #D32F2F; text-align: center; margin-bottom: 40px; font-size: 2.2rem; font-weight: 900;">Dicas Essenciais da Sorveteria Itapolitana Cajuru</h2>
        
        <div class="tip-box" style="margin-bottom: 35px; padding: 25px; border-left: 6px solid #1565C0; background: #f0f7ff; border-radius: 0 15px 15px 0;">
            <h3 style="color: #0D47A1; margin-bottom: 15px; font-size: 1.4rem;">Escolha Inteligente: Qualidade Acima de Tudo</h3>
            <p style="line-height: 1.6; color: #333;">Não se deixe levar apenas por embalagens bonitas ou preços baixos. Em Cajuru, a verdadeira qualidade do sorvete se revela no <strong>sabor, na cremosidade e na validade</strong> do produto. Evite sorvetes industrializados de má qualidade para sua festa; eles podem não agradar seus convidados e até mesmo sobrar. Escolha a <strong>qualidade tipo artesanal da Itapolitana Cajuru</strong> e garanta elogios!</p>
        </div>

        <div class="tip-box" style="margin-bottom: 35px; padding: 25px; border-left: 6px solid #F9A825; background: #fffdf0; border-radius: 0 15px 15px 0;">
            <h3 style="color: #E65100; margin-bottom: 15px; font-size: 1.4rem;">Dicas Diretas para Sua Escolha Perfeita</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 12px; padding-left: 25px; position: relative;"><span style="position: absolute; left: 0; color: #F9A825;">✔</span> <strong>Prove antes de comprar:</strong> A melhor forma de avaliar é degustar. A textura e a cremosidade são indicativos da real qualidade do sorvete tipo artesanal.</li>
                <li style="margin-bottom: 12px; padding-left: 25px; position: relative;"><span style="position: absolute; left: 0; color: #F9A825;">✔</span> <strong>Compare além do preço:</strong> Faça pelo menos 3 orçamentos. Além do valor, avalie os ingredientes, a textura e o prazo de validade.</li>
                <li style="margin-bottom: 12px; padding-left: 25px; position: relative;"><span style="position: absolute; left: 0; color: #F9A825;">✔</span> <strong>Peça com antecedência:</strong> Para eventos, garanta a disponibilidade dos seus sabores favoritos, especialmente em datas de alta demanda.</li>
            </ul>
        </div>

        <div class="tip-box" style="margin-bottom: 35px; padding: 25px; border-left: 6px solid #2E7D32; background: #f1f8f1; border-radius: 0 15px 15px 0;">
            <h3 style="color: #1B5E20; margin-bottom: 15px; font-size: 1.4rem;">Por Que Escolher a Sorveteria Itapolitana Cajuru?</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 10px;">⭐ <strong>Tradição e Qualidade:</strong> Produção tipo artesanal desde 2007, com receitas que priorizam sabor e cremosidade inigualáveis.</li>
                <li style="margin-bottom: 10px;">⭐ <strong>Textura Superior:</strong> Mais sabor e menos “gelo” – nossa textura é superior aos produtos industrializados.</li>
                <li style="margin-bottom: 10px;">⭐ <strong>Suporte para Eventos:</strong> Ajudamos no cálculo e conservação para que seu evento seja um sucesso total.</li>
            </ul>
        </div>

        <div class="impact-quotes" style="text-align: center; margin-top: 40px; padding: 30px; background: #D32F2F; color: white; border-radius: 20px;">
            <p style="font-size: 1.2rem; font-weight: 700; margin-bottom: 10px;">“Não se deixe levar por imagens — prove o sorvete. Sabor e cremosidade que fazem a diferença.”</p>
            <p style="font-size: 1.1rem; opacity: 0.9;">Itapolitana Cajuru: sorvetes artesanais que garantem elogios!</p>
        </div>
    </div>
</section>
"""

# Botão de redirecionamento para Encomendas e Promoção
redirect_button_html = """
<div style="text-align: center; margin: 30px 0; padding: 20px; background: #E3F2FD; border-radius: 15px;">
    <p style="margin-bottom: 15px; font-weight: 700; color: #0D47A1;">Quer ver o que nossos clientes dizem?</p>
    <a href="dicas.html" style="display: inline-block; background: #F9A825; color: #1A0A00; padding: 12px 25px; border-radius: 30px; text-decoration: none; font-weight: 800; font-size: 1rem; border: 2px solid #1A0A00; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">Ver Depoimentos</a>
</div>
"""

def update_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    
    # 1. Renomear botão "Dicas" para "Depoimentos" na navegação
    for a in soup.find_all('a'):
        if a.string and 'Dicas' in a.string:
            a.string = a.string.replace('Dicas', 'Depoimentos')
        elif a.find('span') and 'Dicas' in a.get_text():
            for span in a.find_all('span'):
                if 'Dicas' in span.get_text():
                    span.string = span.get_text().replace('Dicas', 'Depoimentos')
    
    # 2. Lógica específica para dicas.html
    if filename.endswith('dicas.html'):
        main = soup.find('main')
        if main:
            main.clear()
            # Adicionar depoimentos e depois as dicas
            new_content = BeautifulSoup(testimonials_html + tips_html, 'html.parser')
            main.append(new_content)
    
    # 3. Lógica específica para encomendas.html e promocao.html
    if filename.endswith('encomendas.html') or filename.endswith('promocao.html'):
        # Encontrar o final da lista de produtos ou container principal
        container = soup.find(class_='container')
        if container:
            # Adicionar o botão de redirecionamento
            btn_soup = BeautifulSoup(redirect_button_html, 'html.parser')
            container.append(btn_soup)
            
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(str(soup))

# Lista de arquivos para atualizar
files = [
    '/home/ubuntu/itapolitanacajuru/index.html',
    '/home/ubuntu/itapolitanacajuru/encomendas.html',
    '/home/ubuntu/itapolitanacajuru/promocao.html',
    '/home/ubuntu/itapolitanacajuru/dicas.html',
    '/home/ubuntu/itapolitanacajuru/admin-novo.html'
]

for f in files:
    if os.path.exists(f):
        print(f"Atualizando {f}...")
        update_file(f)

print("Todas as atualizações concluídas com sucesso!")
