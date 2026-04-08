"""
Reescreve a função renderPicolés com cards detalhados por tipo,
descrições completas e botão de sabores inline para cada tipo.
"""

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Nova função renderPicolés com cards detalhados
nova_render_picoles = """function renderPicolés(){
  const b=document.getElementById('picolés-body');b.innerHTML='';

  // Descrições detalhadas por tipo
  const descricoes={
    frutas_agua:{
      icon:'🍓',
      titulo:'Picolé de Frutas',
      desc:'Feito com frutas naturais, sem leite. Refrescante e leve — ideal para os dias quentes!',
      badge:'Sem Lactose',
      badgeColor:'#2e7d32'
    },
    leite_sem_recheio:{
      icon:'🍦',
      titulo:'Picolé de Leite',
      desc:'Cremoso, feito com leite. Sabor suave e irresistível para toda a família.',
      badge:'Cremoso',
      badgeColor:'#1565c0'
    },
    leite_com_recheio:{
      icon:'🍬',
      titulo:'Picolé Recheado',
      desc:'Picolé de leite com recheio surpresa por dentro. Cada mordida é uma descoberta!',
      badge:'Com Recheio',
      badgeColor:'#6a1b9a'
    },
    leite_ninho:{
      icon:'⭐',
      titulo:'Picolé Leite Ninho',
      desc:'O sabor inconfundível do Leite Ninho em forma de picolé. Sucesso garantido!',
      badge:'Especial',
      badgeColor:'#e65100'
    },
    'esquimós':{
      icon:'🍫',
      titulo:'Picolé Esquimó',
      desc:'Picolé premium coberto com chocolate belga. Sabores nobres para momentos especiais.',
      badge:'Premium',
      badgeColor:'#b71c1c'
    }
  };

  if(produtos&&produtos.picolés){
    const grid=document.createElement('div');
    grid.style='display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:14px';

    Object.entries(produtos.picolés).forEach(([key,p])=>{
      const info=descricoes[key]||{icon:'🍭',titulo:p.nome,desc:'Delicioso picolé artesanal.',badge:'',badgeColor:'#555'};
      const temSabores=p.sabores&&p.sabores.length>0;
      const qtdSabores=temSabores?p.sabores.length:0;

      const d=document.createElement('div');
      d.className='picolé-item';
      d.style='margin-bottom:0;cursor:default;text-align:center;padding:14px 10px;border-radius:14px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.10);display:flex;flex-direction:column;align-items:center;gap:4px';
      d.innerHTML=`
        <div style="font-size:2.2rem;margin-bottom:2px">${info.icon}</div>
        <div style="font-size:13px;font-weight:900;color:#4A148C;line-height:1.2;margin-bottom:2px">${info.titulo}</div>
        ${info.badge?`<span style="background:${info.badgeColor};color:#fff;font-size:10px;font-weight:800;border-radius:20px;padding:2px 10px;margin-bottom:2px">${info.badge}</span>`:''}
        <div style="font-size:11px;color:#555;line-height:1.4;margin-bottom:6px;min-height:32px">${info.desc}</div>
        <div style="font-size:11px;color:#888;margin-bottom:2px">
          Varejo: <strong style="color:#E91E63">R$ ${p.preço_varejo.toFixed(2).replace('.',',')}</strong>
          ${p.preço_atacado?` &nbsp;|&nbsp; Atacado: <strong style="color:#1565C0">R$ ${p.preço_atacado.toFixed(2).replace('.',',')}</strong>`:''}
        </div>
        <button type="button" class="btn-sabores" style="font-size:11px;padding:8px 12px;width:100%;margin-top:4px" onclick="event.stopPropagation();abrirPicoléInline('${key}','${info.titulo}',this)">
          🍭 ${temSabores?qtdSabores+' Sabores':'Ver Sabores'}
        </button>
      `;
      grid.appendChild(d);
    });
    b.appendChild(grid);

    // Nota de atacado
    const nota=document.createElement('div');
    nota.style='background:linear-gradient(135deg,#1A237E,#283593);color:#fff;border-radius:12px;padding:12px 16px;text-align:center;margin-bottom:10px;font-size:12px';
    nota.innerHTML='🧊 <strong>Atacado e Eventos:</strong> Acima de 100 picolés — carrinho disponível com reserva antecipada. Consulte descontos por quantidade via WhatsApp.';
    b.appendChild(nota);
  }

  const _vb=document.createElement('div');_vb.style='padding:6px 0 2px';
  _vb.innerHTML='<button type="button" class="btn-voltar-inicio" onclick="voltarCardapio(\'acc-picolés\')">← Voltar ao Início do Cardápio</button>';
  b.appendChild(_vb);
}"""

# Substituir a função renderPicolés antiga
import re

# Encontrar início e fim da função renderPicolés
start_marker = 'function renderPicolés(){'
start_idx = content.find(start_marker)

if start_idx != -1:
    # Encontrar o fim da função (próxima função no mesmo nível)
    next_func = content.find('\nfunction renderIso()', start_idx)
    if next_func != -1:
        content = content[:start_idx] + nova_render_picoles + '\n' + content[next_func:]
        print('OK renderPicolés substituída')
    else:
        print('ERRO: renderIso não encontrada')
else:
    print('ERRO: renderPicolés não encontrada')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('OK index.html salvo')

import subprocess
r = subprocess.run(['grep', '-c', 'Picolé de Frutas', 'index.html'], capture_output=True, text=True)
print(f'Picolé de Frutas: {r.stdout.strip()} ocorrências')
r2 = subprocess.run(['grep', '-c', 'Picolé Esquimó', 'index.html'], capture_output=True, text=True)
print(f'Picolé Esquimó: {r2.stdout.strip()} ocorrências')
