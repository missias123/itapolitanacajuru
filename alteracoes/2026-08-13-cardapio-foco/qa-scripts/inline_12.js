
// Dados de cada tema
var faleTemas = {
  promocao: {
    emoji: '🎉',
    titulo: 'Promoções',
    palavras: [
      '✅ Temos promoções semanais e mensais.',
      '✅ Para participar: comente "PROMO ITAPOLITANA" em qualquer post do Instagram.',
      '✅ Realize o cadastro na página de Promoção.',
      '✅ Fique de olho nas redes sociais para não perder nenhuma oferta.',
      '✅ Promoções válidas enquanto durarem os estoques.'
    ],
    link: 'promocao.html',
    linkTexto: 'Mais dúvidas sobre Promoções? Acesse →'
  },
  horario: {
    emoji: '🕐',
    titulo: 'Horário de Funcionamento',
    palavras: [
      '✅ Funcionamos todos os dias: das 10h às 22h.',
      '✅ Inclusive sábados, domingos e feriados.',
      '✅ Atendimento via WhatsApp durante o horário de funcionamento.',
      '✅ Endereço: Praça Largo São Bento — Cajuru/SP.',
      '✅ Veja o mapa e como chegar no site.'
    ],
    link: 'index.html#horario',
    linkTexto: 'Mais dúvidas sobre Horário? Acesse →'
  },
  sabores: {
    emoji: '🍦',
    titulo: 'Sabores e Cardápio',
    palavras: [
      '✅ Mais de 35 sabores de sorvete Tipo artesanal.',
      '✅ Servidos em bolas, casquinhas, cascões, cestinhas e copos.',
      '✅ Também temos açaí, picolés, milkshakes e taças especiais.',
      '✅ Alguns sabores variam conforme a produção do dia.',
      '✅ Consulte o cardápio completo no site.'
    ],
    link: 'index.html#cardápio',
    linkTexto: 'Mais dúvidas sobre Sabores? Acesse →'
  },
  encomendas: {
    emoji: '📦',
    titulo: 'Encomendas',
    palavras: [
      '✅ Fazemos encomendas de caixas de 5L e 10L.',
      '✅ Tortas de sorvete com até 3 sabores — a partir de R$ 100.',
      '✅ Carrinhos cortesia para eventos (reserva antecipada).',
      '✅ Pedido mínimo: consulte na página de Encomendas.',
      '✅ Confirme o pedido pelo WhatsApp — produção após pagamento.'
    ],
    link: 'encomendas.html',
    linkTexto: 'Mais dúvidas sobre Encomendas? Acesse →'
  },
  picoles: {
    emoji: '🍭',
    titulo: 'Picolés',
    palavras: [
      '✅ Picolé de Fruta/Água: varejo R$ 2,50 · atacado R$ 1,80/un.',
      '✅ Picolé de Leite sem Recheio: varejo R$ 2,50 · atacado R$ 2,00/un.',
      '✅ Picolé de Leite com Recheio: varejo R$ 3,00 · atacado R$ 2,00/un.',
      '✅ Picolé Leite Ninho: varejo R$ 4,00 · atacado R$ 3,00/un.',
      '✅ Picolé de Ovomaltine: varejo R$ 4,00 · atacado R$ 3,00/un.',
      '✅ Picolé Esquimó: varejo R$ 8,00 · atacado R$ 6,00/un.',
      '✅ Atacado: mínimo 100 unidades — carrinho disponível com reserva.'
    ],
    link: 'encomendas.html#picolés',
    linkTexto: 'Mais dúvidas sobre Picolés? Acesse →'
  },
  localizacao: {
    emoji: '📍',
    titulo: 'Como Chegar',
    palavras: [
      '✅ Estamos em Cajuru/SP.',
      '✅ Atendemos também Santa Cruz da Esperança e Cássia dos Coqueiros.',
      '✅ Veja o endereço completo e o mapa no Google Maps.',
      '✅ Estacionamento disponível próximo à loja.',
      '✅ Atendemos pelo WhatsApp para pedidos e informações.'
    ],
    link: 'https://maps.google.com/?q=Sorveteria+Itapolitana+Cajuru+SP',
    linkTexto: 'Mais dúvidas sobre Localização? Acesse →',
    externo: true
  },
  avaliacoes: {
    emoji: '⭐',
    titulo: 'Dicas e Avaliações',
    palavras: [
      '✅ Nota 4,8 no Google com centenas de avaliações.',
      '✅ Sorvete feito com amor desde 2007.',
      '✅ 100% feito com ingredientes selecionados.',
      '✅ Veja o que nossos clientes dizem na página de Dicas.',
      '✅ Deixe sua avaliação no Google Maps e ajude outros clientes!'
    ],
    link: 'dicas.html',
    linkTexto: 'Mais dúvidas sobre Avaliações? Acesse →'
  },
  precos: {
    emoji: '💰',
    titulo: 'Preços',
    palavras: [
      '✅ Sorvete: casquinha/copão a partir de R$ 8,00 (1 bola).',
      '✅ Açaí: a partir de R$ 15,00 (300ml) — combos até 700ml.',
      '✅ Milkshake: a partir de R$ 17,00 (300ml).',
      '✅ Torta de sorvete: a partir de R$ 100,00.',
      '✅ Veja a tabela completa de preços no cardápio do site.'
    ],
    link: 'index.html#cardápio',
    linkTexto: 'Mais dúvidas sobre Preços? Acesse →'
  }
};

function mostrarResposta(tema) {
  var dados = faleTemas[tema];
  if (!dados) return;

  var html = '<div style="text-align:center;margin-bottom:16px;">';
  html += '<div style="font-size:16px;font-weight:900;color:#1A1A1A;">' + dados.titulo + '</div>';
  html += '</div>';

  html += '<div style="background:#F9F5FF;border-radius:14px;padding:16px;margin-bottom:16px;">';
  dados.palavras.forEach(function(p) {
    html += '<p style="font-size:13px;color:#333;margin:0 0 10px;line-height:1.5;">' + p + '</p>';
  });
  html += '</div>';

  var target = dados.externo ? '_blank" rel="noopener"' : '_self"';
  html += '<a href="' + dados.link + '" target="' + target + ' onclick="fecharFaleDialog()" ';
  html += 'style="display:block;text-align:center;background:linear-gradient(135deg,#7B2D8B,#4A148C);color:#fff;padding:14px 20px;border-radius:30px;font-size:13px;font-weight:900;text-decoration:none;margin-top:8px;">';
  html += dados.linkTexto + '</a>';

  document.getElementById('fale-resposta-conteudo').innerHTML = html;
  document.getElementById('fale-tela-temas').style.display = 'none';
  document.getElementById('fale-tela-resposta').style.display = 'block';
}

function voltarTemas() {
  document.getElementById('fale-tela-resposta').style.display = 'none';
  document.getElementById('fale-tela-temas').style.display = 'block';
}
