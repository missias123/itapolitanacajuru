# Métodos validados para o módulo Promoção — 2026-08-18

## Fontes consultadas

1. Ministério da Fazenda — Promoção Comercial: https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/promocao-comercial
2. Lei Geral de Proteção de Dados — Planalto, Lei nº 13.709/2018: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
3. Stripe — Idempotent requests: https://docs.stripe.com/api/idempotent_requests
4. OWASP — Input Validation Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html

## Achados aplicáveis

### 1. Promoções e sorteios no Brasil
O Ministério da Fazenda informa que a Secretaria de Prêmios e Apostas (SPA) é responsável por regular, autorizar, fiscalizar e sancionar promoções comerciais em todo o Brasil. A distribuição gratuita de prêmios para publicidade inclui modalidades como sorteios, vale-brindes e concursos. Os pedidos de autorização devem ser realizados pelo Sistema de Controle de Promoções Comerciais (SCPC). Portanto, antes de publicar um sorteio real de caixas de sorvete, o projeto deve possuir regulamento, verificar a necessidade de autorização e obter revisão profissional de conformidade; a tela do site não deve sugerir que a inscrição, por si só, torna a promoção legalizada.

### 2. LGPD e cadastro
A LGPD define dado pessoal, tratamento, controlador, operador, consentimento, armazenamento e eliminação. Para o site, aplicar finalidade clara e minimização: coletar apenas nome, WhatsApp e os dados estritamente necessários para a promoção; separar a confirmação de participação de eventual autorização para marketing; informar finalidade, prazo de retenção, canal de contato e forma de solicitar correção ou eliminação. Não coletar endereço porque a operação da sorveteria é retirada na loja e não há delivery.

### 3. Prevenção de duplicidade e idempotência
A documentação da Stripe recomenda uma chave de idempotência aleatória para que uma repetição da mesma requisição não crie dois registros. A chave não deve ser e-mail, telefone ou outro identificador pessoal. Adaptar para o cadastro: gerar um `submission_id` aleatório por tentativa, manter um `dedupe_key` derivado no servidor de campos normalizados permitidos (por exemplo, telefone normalizado + promoção ativa, com proteção adequada), aplicar restrição única no armazenamento e devolver o mesmo resultado quando houver repetição da mesma submissão. A idempotência deve ser aplicada no servidor, não somente no JavaScript do navegador.

### 4. Validação de entrada
A OWASP recomenda validar cedo, nos níveis sintático e semântico, no cliente e no servidor; preferir allowlist a denylist; impor tamanho, formato e limites; validar opções contra a lista oficial; normalizar texto; registrar como evento de segurança qualquer valor que não pertença às opções autorizadas. Adaptar ao formulário com nome dentro de limites, WhatsApp em formato definido, aceite explícito do regulamento, promoção ativa e janela de inscrição válida.

## Adaptação proposta para a Itapolitana Cajuru

- Fluxo em etapas: Regulamento e elegibilidade → Dados mínimos → Confirmação de retirada na loja → Revisão → Protocolo de inscrição.
- Aviso persistente: “Promoção sujeita a regulamento. Prêmio para retirada na loja. Não fazemos delivery.”
- Após o envio, mostrar protocolo da inscrição e estado `recebida`, sem permitir múltiplos envios pelo mesmo clique.
- No Admin, guardar somente os campos necessários, status, data/hora, versão do regulamento, `submission_id`, resultado da deduplicação e trilha de eventos; restringir acesso por função e exportar somente quando necessário.
- Não executar sorteio real no site antes de revisar autorização e regulamento aplicáveis. Quando liberado, usar seleção reproduzível, registrar versão da lista elegível, data/hora, método e responsável, e publicar o resultado conforme o regulamento.
- Testar duplicidade por duplo clique, recarregamento, perda de conexão e reenvio; testar também inscrições iguais legítimas segundo a regra definida no regulamento.

## Regra de engenharia
Nenhuma alteração no cabeçalho ou no cardápio pode modificar o fluxo Promoção. O módulo deve ter fonte única de verdade, testes automatizados de schema e integridade, e validação antes de publicação. Nenhum dado real de cliente deve ser usado em testes; usar registros fictícios e não abrir o WhatsApp durante a auditoria sem confirmação explícita.
