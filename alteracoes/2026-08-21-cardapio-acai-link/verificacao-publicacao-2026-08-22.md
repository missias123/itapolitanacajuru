# Verificação de publicação — 22/08/2026

## Sincronização GitHub

A branch `main` foi enviada com sucesso ao repositório remoto no commit `4492985`.

## Estado público observado

Às 04:06, o endereço `https://itapolitanacajuru.com.br/retirada.html` ainda respondeu com a página pública de erro 404. Isso indica que o domínio ainda não recebeu o novo artefato estático, embora o código já esteja no GitHub.

## Próxima ação necessária

Confirmar no painel Cloudflare qual projeto ou origem publica o domínio e executar a atualização correspondente, sem alterar as regras de Encomendas.

## Inventário confirmado posteriormente

O domínio público é servido pelo **GitHub Pages**, e não por Cloudflare Pages. A origem está configurada na branch `main`, pasta raiz, com HTTPS obrigatório e certificado aprovado. A versão de `retirada.html` existe no repositório remoto e a publicação do commit `4492985` foi registrada como ambiente `github-pages`.

O Cloudflare está na frente do domínio como DNS, CDN e camada de proteção. A zona está ativa, com HTTPS, CDN/caching e proteções básicas disponíveis no plano Free. O Worker `itapolitanacajuru` está roteado apenas para `api.itapolitanacajuru.com.br/*`; portanto, ele não publica os arquivos estáticos do cardápio.

## DNS verificado

O domínio raiz usa os quatro endereços oficiais do GitHub Pages (`185.199.108.153` a `185.199.111.153`) e `www` aponta para `missias123.github.io`. Os registros estão com proxy Cloudflare e TTL automático. Esse desenho é compatível com a arquitetura atual: GitHub Pages é a origem do site estático e Cloudflare atende DNS, cache e proteção na borda.

## Segurança de transporte e e-mail

O painel mostra criptografia Cloudflare em modo **Completo** e tráfego predominante em TLS 1.3. A zona também informa que não há configuração de recebimento de e-mails nem registros SPF, DKIM e DMARC. Essa recomendação deve ser tratada apenas quando a sorveteria decidir receber e-mails no domínio; não será criada uma infraestrutura de e-mail sem essa decisão.

## Regras de segurança verificadas

Não há regras personalizadas de WAF nem regras de limitação de taxa criadas na zona. A proteção DDoS de borda permanece disponível pelo serviço padrão. Qualquer regra nova deve ser testada com cuidado para não bloquear o checkout de retirada, o Worker da API nem visitantes legítimos.
