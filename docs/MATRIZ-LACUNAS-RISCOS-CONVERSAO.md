# Matriz de Lacunas, Riscos, Prioridades e Ganhos de Conversão

Para equiparar a **Sorveteria Itapolitana** aos padrões dos maiores sites de alimentos do mundo, estruturamos esta matriz avaliando riscos operacionais, prioridades de engenharia e impactos esperados em conversão e engajamento.

| Área / Funcionalidade | Lacuna Anterior | Risco Potencial | Ação Corretiva Aplicada | Prioridade | Ganho Esperado (CRO & UX) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Carregamento de Assets do itaBot** | Possíveis quebras por cache agressivo ou falha de rede em mobile. | Exibição de ícone de imagem quebrada, gerando sensação de amadorismo. | Inclusão de tratamento robusto de erro (`onerror`) e versionamento estrito (`?v=2027-resilience-final`). | **Crítica** | Eliminação de falhas visuais em 100% dos acessos móveis. |
| **Dimensões do Letreiro LED** | Letreiro largo e alto demais em celulares, poluindo o rodapé. | Ocupar espaço útil de clique ou encobrir elementos interativos. | Redução da largura para o equivalente à metade anterior, mantendo a altura compacta e legível. | **Alta** | Melhoria drástica na elegância e integração visual do mascote. |
| **Campanhas e Sorteios (2027)** | Referências dispersas a redes sociais e inscrições encerradas de 2026. | Confusão do cliente sobre como participar dos sorteios mensais. | Padronização de que 2026 encerrou com >1400 inscritos e 2027 é exclusivo pelo site oficial. | **Alta** | Clareza absoluta, aumentando a taxa de cadastros na aba Promoções. |
| **Código Morto e Legado** | Presença de funções órfãs de antigos módulos (*Fidelidade*, *Itamandua*, *FALE*). | Inchaço do script, lentidão de parsing e conflitos de seletores. | Auditoria e remoção seletiva do código órfão, preservando o painel admin intacto. | **Média** | Maior leveza no carregamento e manutenção simplificada. |
| **Sincronização Admin-Site** | Desalinhamento entre o que é cadastrado no painel e o exibido no site. | Inconsistência de preços, sabores ou status de encomendas. | Preservação rigorosa dos contratos de dados (`config.json` e rotas de salvamento). | **Crítica** | Operação 100% confiável para o administrador e clientes. |

---

## 📈 Diretrizes de Engenharia Aplicadas
1. **Mobile-First Real:** Testes e ajustes baseados em visualização responsiva real para Android e iPhone.
2. **Zero Regressão:** Nenhuma alteração sem backup prévio e validação de sintaxe.
3. **Resiliência Estilo "Big Tech":** Tolerância a falhas de rede com fallbacks automáticos.
