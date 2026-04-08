with open('admin-painel.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Adicionar novos botões de navegação
old_nav = '''    <button class="nav-btn" onclick="irPara('config',this)">&#x2699;&#xFE0F; Configurações</button>
  </div>'''

new_nav = '''    <button class="nav-btn" onclick="irPara('cardápio',this)">🍦 Cardápio</button>
    <button class="nav-btn" onclick="irPara('depoimentos',this)">⭐ Depoimentos</button>
    <button class="nav-btn" onclick="irPara('fale-conosco',this)">💬 Fale Conosco</button>
    <button class="nav-btn" onclick="irPara('config',this)">&#x2699;&#xFE0F; Configurações</button>
  </div>'''

if old_nav in content:
    content = content.replace(old_nav, new_nav, 1)
    print('✅ Botões de navegação adicionados')
else:
    print('⚠️  Padrão nav não encontrado')

# 2. Adicionar novas seções ANTES do fechamento do admin-content (antes de </div>\n</div>\n<script>)
old_end = '''    </div>
  </div>
</div>
<script>'''

new_sections = '''    <!-- CARDÁPIO COMPLETO -->
    <div class="seção" id="sec-cardápio">
      <div class="card">
        <div class="card-header"><h2>🍦 Cardápio — Clone Editável por Categoria</h2><button class="btn btn-salvar" onclick="salvarCardápio()">💾 Salvar Cardápio</button></div>
        <div class="card-body">

          <div class="seção-título">🍨 Sorvetes de Massa</div>
          <div class="hint" style="margin-bottom:12px">Cada linha = 1 sabor. Separe com Enter. Ordem de exibição = ordem das linhas.</div>
          <div class="campo-edit"><label>Lista de sabores (um por linha)</label><textarea id="card-sorvetes-sabores" rows="12" placeholder="Chocolate&#10;Morango&#10;Baunilha&#10;Creme&#10;Flocos&#10;Napolitano"></textarea></div>
          <div class="campo-edit"><label>Texto do botão "Ver Sabores"</label><input type="text" id="card-sorvetes-btn" maxlength="30" placeholder="🍦 Ver 35 Sabores"/></div>
          <div class="campo-edit"><label>Descrição curta da categoria</label><input type="text" id="card-sorvetes-desc" maxlength="80" placeholder="Cremoso, gelado, irresistível · 35 sabores pra você escolher"/></div>

          <div class="seção-título" style="margin-top:20px">🧊 Picolés</div>
          <div class="campo-edit"><label>Picolés de Fruta/Água (um por linha)</label><textarea id="card-picoles-fruta" rows="6" placeholder="Limão&#10;Morango&#10;Maracujá&#10;Abacaxi&#10;Uva"></textarea></div>
          <div class="campo-edit"><label>Picolés de Leite (um por linha)</label><textarea id="card-picoles-leite" rows="4" placeholder="Leite&#10;Coco&#10;Amendoim"></textarea></div>
          <div class="campo-edit"><label>Picolés Recheados (um por linha)</label><textarea id="card-picoles-recheado" rows="4" placeholder="Morango com Chocolate&#10;Napolitano Recheado"></textarea></div>
          <div class="campo-edit"><label>Picolés Ninho (um por linha)</label><textarea id="card-picoles-ninho" rows="3" placeholder="Ninho&#10;Ninho com Morango"></textarea></div>
          <div class="campo-edit"><label>Picolés Esquimó (um por linha)</label><textarea id="card-picoles-esquimo" rows="3" placeholder="Esquimó Chocolate&#10;Esquimó Branco"></textarea></div>
          <div class="campo-edit"><label>Texto do botão "Ver Picolés"</label><input type="text" id="card-picoles-btn" maxlength="30" placeholder="🧊 Ver Sabores de Picolés"/></div>

          <div class="seção-título" style="margin-top:20px">🫐 Açaí em Promoção</div>
          <div class="campo-edit"><label>Combos de promoção (um por linha, ex: 400ml - R$ 10,00)</label><textarea id="card-acai-promo-combos" rows="8" placeholder="400ml - R$ 10,00&#10;500ml - R$ 13,00&#10;700ml - R$ 17,00"></textarea></div>
          <div class="campo-edit"><label>Texto do botão</label><input type="text" id="card-acai-promo-btn" maxlength="30" placeholder="🫐 Ver Combos em Promoção"/></div>

          <div class="seção-título" style="margin-top:20px">🍇 Açaí Tipo Artesanal</div>
          <div class="campo-edit"><label>Tamanhos disponíveis (um por linha, ex: 300ml - R$ 12,00)</label><textarea id="card-acai-tamanhos" rows="5" placeholder="300ml - R$ 12,00&#10;400ml - R$ 15,00&#10;500ml - R$ 18,00&#10;600ml - R$ 22,00"></textarea></div>
          <div class="campo-edit"><label>Complementos disponíveis (um por linha)</label><textarea id="card-acai-complementos" rows="8" placeholder="Granola&#10;Leite em Pó&#10;Paçoca&#10;Morango&#10;Banana&#10;Mel"></textarea></div>
          <div class="campo-edit"><label>Texto do botão</label><input type="text" id="card-acai-btn" maxlength="30" placeholder="🍇 Montar Meu Açaí"/></div>

          <div class="seção-título" style="margin-top:20px">🥤 Milkshakes</div>
          <div class="campo-edit"><label>Sabores disponíveis (um por linha)</label><textarea id="card-milk-sabores" rows="8" placeholder="Chocolate&#10;Morango&#10;Baunilha&#10;Ovomaltine&#10;Nutella"></textarea></div>
          <div class="campo-edit"><label>Tamanhos e preços (um por linha)</label><textarea id="card-milk-tamanhos" rows="4" placeholder="Tradicional 400ml&#10;Top 500ml"></textarea></div>
          <div class="campo-edit"><label>Texto do botão</label><input type="text" id="card-milk-btn" maxlength="30" placeholder="🥤 Ver Milkshakes"/></div>

          <div class="seção-título" style="margin-top:20px">🍧 Taças Tradicionais</div>
          <div class="campo-edit"><label>Taças disponíveis (uma por linha, ex: Colegial - 2 bolas)</label><textarea id="card-tacas-lista" rows="6" placeholder="Colegial - 2 bolas&#10;Sundae - 3 bolas&#10;Banana Split - 3 bolas + banana&#10;Copa do Mundo - 4 bolas"></textarea></div>
          <div class="campo-edit"><label>Texto do botão</label><input type="text" id="card-tacas-btn" maxlength="30" placeholder="🍧 Ver Taças"/></div>

          <div class="seção-título" style="margin-top:20px">👑 Taças Premium (Taças Sujas)</div>
          <div class="campo-edit"><label>Taças Premium disponíveis (uma por linha)</label><textarea id="card-tacas-p-lista" rows="6" placeholder="Prestígio&#10;Kit Kat&#10;Unicórnio&#10;Oreo&#10;Ferrero Rocher"></textarea></div>
          <div class="campo-edit"><label>Texto do botão</label><input type="text" id="card-tacas-p-btn" maxlength="30" placeholder="👑 Ver Taças Premium"/></div>

          <div class="seção-título" style="margin-top:20px">🧊 Isopores de Viagem</div>
          <div class="campo-edit"><label>Tamanhos disponíveis (um por linha)</label><textarea id="card-iso-lista" rows="4" placeholder="Isopore 2L&#10;Isopore 5L&#10;Isopore 10L&#10;Isopore 15L"></textarea></div>
          <div class="campo-edit"><label>Texto do botão</label><input type="text" id="card-iso-btn" maxlength="30" placeholder="🧊 Ver Isopores"/></div>

          <div class="seção-título" style="margin-top:20px">🍨 Sobremesas Geladas</div>
          <div class="campo-edit"><label>Sobremesas disponíveis (uma por linha)</label><textarea id="card-sobremesas-lista" rows="6" placeholder="Fondue de Chocolate&#10;Petit Gâteau&#10;Brownie com Sorvete&#10;Waffle com Sorvete"></textarea></div>
          <div class="campo-edit"><label>Texto do botão</label><input type="text" id="card-sobremesas-btn" maxlength="30" placeholder="🍨 Ver Sobremesas"/></div>

          <div class="btn-row"><button class="btn btn-salvar" onclick="salvarCardápio()">💾 Salvar Cardápio</button></div>
        </div>
      </div>
    </div>

    <!-- DEPOIMENTOS -->
    <div class="seção" id="sec-depoimentos">
      <div class="card">
        <div class="card-header"><h2>⭐ Dicas e Depoimentos</h2><button class="btn btn-salvar" onclick="salvarDepoimentos()">💾 Salvar</button></div>
        <div class="card-body">
          <div class="seção-título">📝 Texto Introdutório da Página</div>
          <div class="campo-edit"><label>Título da seção de depoimentos</label><input type="text" id="dep-titulo" maxlength="60" placeholder="O que nossos clientes dizem"/></div>
          <div class="campo-edit"><label>Subtítulo / chamada</label><input type="text" id="dep-subtitulo" maxlength="100" placeholder="Veja o que quem já provou tem a dizer sobre a Itapolitana"/></div>

          <div class="seção-título" style="margin-top:20px">💬 Depoimentos de Clientes</div>
          <div id="dep-lista"></div>
          <div class="btn-row" style="margin-top:12px">
            <button class="btn btn-verde" onclick="adicionarDepoimento()">➕ Adicionar Depoimento</button>
          </div>

          <div class="seção-título" style="margin-top:20px">💡 Dicas da Sorveteria</div>
          <div class="campo-edit"><label>Dicas (uma por linha)</label><textarea id="dep-dicas" rows="6" placeholder="Experimente misturar sabores!&#10;O açaí fica ainda melhor com granola e mel.&#10;Peça a taça premium Unicórnio — é a mais pedida!"></textarea></div>

          <div class="btn-row"><button class="btn btn-salvar" onclick="salvarDepoimentos()">💾 Salvar Depoimentos</button></div>
        </div>
      </div>
    </div>

    <!-- FALE CONOSCO -->
    <div class="seção" id="sec-fale-conosco">
      <div class="card">
        <div class="card-header"><h2>💬 Fale Conosco — Configurações</h2><button class="btn btn-salvar" onclick="salvarFaleConosco()">💾 Salvar</button></div>
        <div class="card-body">
          <div class="seção-título">📄 Textos da Página</div>
          <div class="campo-edit"><label>Título da página</label><input type="text" id="fc-titulo" maxlength="60" placeholder="Fale com a Itapolitana"/></div>
          <div class="campo-edit"><label>Subtítulo / texto de instrução</label><input type="text" id="fc-subtitulo" maxlength="120" placeholder="Manda uma mensagem, a gente responde rapidinho!"/></div>
          <div class="campo-edit"><label>Mensagem de sucesso (após envio)</label><input type="text" id="fc-msg-sucesso" maxlength="120" placeholder="Mensagem enviada! Retornaremos em breve."/></div>

          <div class="seção-título" style="margin-top:20px">📞 Contato</div>
          <div class="campo-edit"><label>WhatsApp de atendimento (somente números)</label><input type="text" id="fc-whatsapp" maxlength="15" inputmode="numeric" placeholder="5516996062046"/></div>
          <div class="campo-edit"><label>E-mail de contato</label><input type="email" id="fc-email" placeholder="contato@itapolitanacajuru.com.br"/></div>
          <div class="campo-edit"><label>Endereço completo</label><input type="text" id="fc-endereco" maxlength="120" placeholder="Rua Exemplo, 123 — Centro — Cajuru/SP"/></div>
          <div class="campo-edit"><label>Horário de atendimento</label><input type="text" id="fc-horario" maxlength="80" placeholder="Todos os dias: 10h às 22h"/></div>

          <div class="seção-título" style="margin-top:20px">🤖 Assistente de Chat (Chatbot)</div>
          <div class="campo-edit"><label>Mensagem inicial do assistente</label><input type="text" id="fc-chat-inicio" maxlength="120" placeholder="Olá! Sou o assistente da Sorveteria Itapolitana. Como posso te ajudar?"/></div>
          <div class="campo-edit"><label>Opções rápidas do chat (uma por linha)</label><textarea id="fc-chat-opcoes" rows="6" placeholder="Horário de funcionamento&#10;Como fazer uma encomenda&#10;Sabores disponíveis&#10;Preços&#10;Localização&#10;Picolés"></textarea></div>
          <div class="campo-edit"><label>Mensagem fora do horário</label><input type="text" id="fc-chat-fora" maxlength="120" placeholder="Estamos fechados agora. Retornaremos em breve!"/></div>

          <div class="btn-row"><button class="btn btn-salvar" onclick="salvarFaleConosco()">💾 Salvar Fale Conosco</button></div>
        </div>
      </div>
    </div>

    </div>
  </div>
</div>
<script>'''

if old_end in content:
    content = content.replace(old_end, new_sections, 1)
    print('✅ Novas seções adicionadas (Cardápio, Depoimentos, Fale Conosco)')
else:
    print('⚠️  Padrão de fechamento não encontrado')

with open('admin-painel.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('✅ admin-painel.html salvo')
