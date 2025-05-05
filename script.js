const container = document.getElementById("grid-container");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalProblema = document.getElementById("modal-problema");
const modalSolucao = document.getElementById("modal-solucao");
const modalCusto = document.getElementById("modal-custo");
const modalPlano = document.getElementById("modal-plano");
const closeBtn = document.getElementById("close-btn");

let ideias = [];
let ideiasAvaliadas = [];

fetch("planos.json")
  .then(response => response.json())
  .then(data => {
    ideias = data;
    carregarAvaliacoes();
  })
  .catch(error => {
    console.error("Erro ao carregar planos.json:", error);
  });

function carregarAvaliacoes() {
  // Tenta carregar do CSV (futuro) ou localStorage (agora)
  fetch('avaliacoes.csv')
    .then(response => response.text())
    .then(csv => {
      const linhas = csv.trim().split('\n');
      ideiasAvaliadas = linhas.slice(1).map(l => {
        const campos = l.split(',');
        return { nomeIdeia: campos[0].replaceAll('"', ''), pontuacao: parseInt(campos[1] || "0") };
      });
      renderCards();
    })
    .catch(() => {
      ideiasAvaliadas = JSON.parse(localStorage.getItem("ideiasAvaliadas")) || [];
      renderCards();
    });
}

function renderCards() {
    container.innerHTML = "";
  
    // Junta as ideias com as respectivas pontuações (ou zero)
    const ideiasComPontuacao = ideias.map(ideia => {
      const avaliada = ideiasAvaliadas.find(i => i.nomeIdeia === ideia.nome);
      return {
        ...ideia,
        pontuacao: avaliada ? avaliada.pontuacao : -1  // Usamos -1 para garantir que os não avaliados fiquem no fim
      };
    });
  
    // Ordena da maior para a menor pontuação
    ideiasComPontuacao.sort((a, b) => b.pontuacao - a.pontuacao);
  
    // Renderiza os cards já ordenados
    ideiasComPontuacao.forEach((ideia) => {
      const card = document.createElement("div");
      card.className = "card";
  
      if (ideia.pontuacao >= 0) {
        card.classList.add("avaliada");
        card.setAttribute("data-pontuacao", ideia.pontuacao);
      }
  
      card.innerHTML = `
        <h3>${ideia.nome}</h3>
        <p><span class="label">Problema:</span> ${ideia.problema}</p>
        <p><span class="label">Solução:</span> ${ideia.solucao}</p>
        <p><span class="label">Custo Estimado:</span> ${ideia.investimentoInicial}</p>
      `;
  
      if (ideia.pontuacao >= 0) {
        const badge = document.createElement("div");
        badge.className = "pontuacao-badge";
        badge.textContent = `⭐ ${ideia.pontuacao}/10`;
        card.appendChild(badge);
      }
  
      card.onclick = () => openModal(ideia);
      container.appendChild(card);
    });
  }
  

function openModal(ideia) {
  modalTitle.textContent = ideia.nome;
  modalProblema.textContent = ideia.problema;
  modalSolucao.textContent = ideia.solucao;
  modalCusto.textContent = ideia.investimentoInicial;
  modalPlano.innerHTML = `
    <p><strong>Resumo:</strong> ${ideia.resumo}</p>
    <p><strong>Público-Alvo:</strong> ${ideia.publicoAlvo}</p>
    <p><strong>Proposta de Valor:</strong> ${ideia.propostaValor}</p>
    <p><strong>Monetização:</strong> ${ideia.monetizacao}</p>
    <p><strong>Canais de Distribuição:</strong> ${ideia.canaisDistribuicao}</p>
    <p><strong>Tecnologia:</strong> ${ideia.tecnologia}</p>
    <p><strong>Concorrência e Diferenciais:</strong> ${ideia.concorrenciaDiferenciais}</p>
    <p><strong>MVP:</strong> ${ideia.mvp}</p>
    <p><strong>Etapas de Lançamento:</strong><br> ${ideia.etapasLancamento.join('<br>')}</p>
    <p><strong>Riscos e Mitigações:</strong> ${ideia.riscosMitigacoes}</p>
    <p><strong>Potencial de Escala:</strong> ${ideia.potencialEscala}</p>
  `;

  modal.classList.remove("hidden");
  document.getElementById("form-avaliacao").classList.add("hidden");

  document.getElementById("avaliar-btn").onclick = () => {
    document.getElementById("form-avaliacao").classList.remove("hidden");
  };
}

document.getElementById("avaliacao-form").onsubmit = function (e) {
  e.preventDefault();

  const form = e.target;
  const nomeIdeia = modalTitle.textContent;

  const respostas = {
    problema_real: form.problema_real.value,
    compraria: form.compraria.value,
    valor_outros: form.valor_outros.value,
    facilidade_implantacao: form.facilidade_implantacao.value,
    potencial_escala: form.potencial_escala.value
  };

  const pontos = {
    problema_real: { "Não resolve": 0, "Resolve parcialmente": 1, "Resolve claramente": 2 },
    compraria: { "Não": 0, "Talvez, com ajustes": 1, "Sim": 2 },
    valor_outros: { "Pouco provável": 0, "Provável": 1, "Muito provável": 2 },
    facilidade_implantacao: { "Difícil": 0, "Médio": 1, "Fácil": 2 },
    potencial_escala: { "Baixo": 0, "Médio": 1, "Alto": 2 }
  };

  let pontuacao = 0;
  pontuacao += pontos.problema_real[respostas.problema_real];
  pontuacao += pontos.compraria[respostas.compraria];
  pontuacao += pontos.valor_outros[respostas.valor_outros];
  pontuacao += pontos.facilidade_implantacao[respostas.facilidade_implantacao];
  pontuacao += pontos.potencial_escala[respostas.potencial_escala];

  const avaliacao = {
    nomeIdeia,
    respostas,
    pontuacao,
    data: new Date().toISOString()
  };

  // Envia para PHP (servidor)
  fetch('salvar_avaliacao.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(avaliacao)
  }).then(() => {
    alert("Avaliação salva com sucesso!");

    // Atualiza localStorage e variável global
    let armazenadas = JSON.parse(localStorage.getItem("ideiasAvaliadas")) || [];
    armazenadas = armazenadas.filter(i => i.nomeIdeia !== nomeIdeia);
    armazenadas.push({ nomeIdeia, pontuacao });
    localStorage.setItem("ideiasAvaliadas", JSON.stringify(armazenadas));
    ideiasAvaliadas = armazenadas;

    form.reset();
    modal.classList.add("hidden");
    renderCards();
  }).catch(() => {
    alert("Erro ao salvar avaliação.");
  });
};

closeBtn.onclick = () => {
  modal.classList.add("hidden");
};

window.onclick = function (event) {
  if (event.target === modal) {
    modal.classList.add("hidden");
  }
};

document.getElementById("copiar-avaliacoes").onclick = () => {

    const avaliadas = JSON.parse(localStorage.getItem("ideiasAvaliadas")) || [];
  
    if (!avaliadas.length) {
      alert("Nenhuma ideia avaliada ainda.");
      return;
    }
  
    const texto = avaliadas
      .filter(i => i.nomeIdeia && typeof i.pontuacao === "number")
      .map(i => {
        const ideiaOriginal = ideias.find(orig => orig.nome === i.nomeIdeia);
        const resumo = ideiaOriginal?.resumo || "Sem resumo disponível.";
        return `📌 ${i.nomeIdeia} — Nota: ${i.pontuacao}\n📝 ${resumo.trim()}`;
      })
      .join("\n\n");
  
    navigator.clipboard.writeText(texto)
      .then(() => alert("✅ Avaliações copiadas! Agora cole no WhatsApp."))
      .catch(() => alert("Erro ao copiar."));
  };
  
  // Mostrar instruções novamente ao clicar no botão
document.getElementById("mostrar-instrucoes").onclick = () => {
    document.getElementById("modal-instrucoes").classList.remove("hidden");
  };
  
  // Fechar modal de instruções
  document.getElementById("close-instrucoes-btn").onclick = () => {
    document.getElementById("modal-instrucoes").classList.add("hidden");
  };
  
  
// Modal de instruções ao abrir
window.addEventListener("load", () => {
    const jaViuInstrucoes = localStorage.getItem("instrucoesVistas");
  
    if (!jaViuInstrucoes) {
      const modal = document.getElementById("modal-instrucoes");
      modal.classList.remove("hidden");
  
      const fechar = document.getElementById("close-instrucoes-btn");
      fechar.onclick = () => {
        modal.classList.add("hidden");
        localStorage.setItem("instrucoesVistas", "true");
      };
    }
  });
  
  
