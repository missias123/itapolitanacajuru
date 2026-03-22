function calcularProximoFim(agora) {
    let ano = agora.getFullYear();
    let mes = agora.getMonth();
    
    if (agora.getDate() > 1 || (agora.getDate() === 1 && (agora.getHours() > 0 || (agora.getHours() === 0 && agora.getMinutes() >= 1)))) {
      mes++;
      if (mes > 11) { mes = 0; ano++; }
    }
    
    const limiteFinal = new Date(2030, 0, 1, 1, 1, 0);
    const proximoAlvo = new Date(ano, mes, 1, 0, 1, 0);
    
    return proximoAlvo > limiteFinal ? limiteFinal : proximoAlvo;
}

// TESTE 1: Hoje (22/03/2026)
let agora1 = new Date(2026, 2, 22, 17, 0, 0);
console.log("Teste 1 (Hoje 22/03): Próximo alvo deve ser 01/04/2026 00:01");
console.log("Resultado:", calcularProximoFim(agora1).toLocaleString());

// TESTE 2: Dia 01/04 às 00:00 (Faltando 1 minuto)
let agora2 = new Date(2026, 3, 1, 0, 0, 0);
console.log("\nTeste 2 (01/04 00:00): Próximo alvo deve ser 01/04/2026 00:01");
console.log("Resultado:", calcularProximoFim(agora2).toLocaleString());

// TESTE 3: Dia 01/04 às 00:02 (Já passou do sorteio)
let agora3 = new Date(2026, 3, 1, 0, 2, 0);
console.log("\nTeste 3 (01/04 00:02): Próximo alvo deve ser 01/05/2026 00:01");
console.log("Resultado:", calcularProximoFim(agora3).toLocaleString());

// TESTE 4: Limite 2030
let agora4 = new Date(2029, 11, 25, 0, 0, 0);
console.log("\nTeste 4 (Fim de 2029): Próximo alvo deve ser 01/01/2030 01:01 (Limite)");
console.log("Resultado:", calcularProximoFim(agora4).toLocaleString());
