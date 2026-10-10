// MUDANÇA DO CAOS — a ROLETA DO SORTEIO (página Sorteios).
// COM o "juiz" (dados/site.js → "sorteioUrl", a planilha do Google do V4X): os prêmios vêm da planilha, o
// SORTEIO acontece lá (ninguém escolhe o prêmio) e cada ID do jogo / nome do Discord gira UMA vez por sorteio,
// em qualquer navegador. O resultado vai para o Discord pela planilha.
// SEM o juiz (ainda não ligado): usa os prêmios do dados/site.js e 1 giro por navegador.
(function () {
  const S = window.SITE || {};
  const canvas = document.getElementById("roleta");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const form = document.getElementById("formSorteio");
  const botao = form.querySelector("button");
  const resposta = document.getElementById("respostaSorteio");
  const titulo = document.getElementById("tituloSorteio");
  const cores = ["#ff8a00", "#2c3a6b", "#ffc21a", "#3a4a85", "#ff5470", "#26335c", "#3ddc84", "#33417a"];
  const juiz = S.sorteioUrl || "";
  let sorteio = S.sorteio || {}, premios = sorteio.premios || [], giro = 0;

  // (veio do botão SORTEIO NO SITE do jogo: o ID já vem preenchido)
  const idDoJogo = new URLSearchParams(location.search).get("id");
  if (idDoJogo && document.getElementById("sId")) document.getElementById("sId").value = idDoJogo.slice(0, 20).toUpperCase();
  const avisar = (ok, texto) => { resposta.className = "resposta " + (ok ? "ok" : "erro"); resposta.innerHTML = texto; };
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const perdeu = p => /não foi|tente de novo|nada/i.test(p);

  // ---------- o desenho da roleta ----------
  function desenhar(angulo) {
    const t = canvas.width, c = t / 2, r = c - 8;
    ctx.clearRect(0, 0, t, t);
    const fatia = (Math.PI * 2) / Math.max(1, premios.length);
    premios.forEach((p, i) => {
      const a0 = angulo + i * fatia - Math.PI / 2, a1 = a0 + fatia;
      ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, r, a0, a1); ctx.closePath();
      ctx.fillStyle = cores[i % cores.length]; ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 3; ctx.stroke();
      ctx.save(); ctx.translate(c, c); ctx.rotate(a0 + fatia / 2);
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillStyle = ["#ffc21a", "#3ddc84", "#ff8a00"].includes(cores[i % cores.length]) ? "#1d1300" : "#fff";
      ctx.font = "800 " + Math.max(14, Math.min(26, 360 / Math.max(6, p.length))) + "px Nunito, sans-serif";
      ctx.fillText(p.length > 22 ? p.slice(0, 21) + "…" : p, r - 18, 0);
      ctx.restore();
    });
    ctx.beginPath(); ctx.arc(c, c, 46, 0, Math.PI * 2); ctx.fillStyle = "#141b33"; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = "#ffc21a"; ctx.stroke();
    ctx.fillStyle = "#ffc21a"; ctx.font = "26px 'Lilita One', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("CAOS", c, c + 2);
  }

  // gira até o MEIO da fatia "indice" parar embaixo da seta (com umas voltas e freando no fim)
  function girarAte(indice) {
    const fatia = (Math.PI * 2) / premios.length;
    const alvo = -(indice * fatia + fatia / 2);
    const de = giro, ate = alvo - (6 + Math.floor(Math.random() * 3)) * Math.PI * 2 + Math.round((giro - alvo) / (Math.PI * 2)) * Math.PI * 2;
    const comeco = performance.now(), dura = 5200;
    return new Promise(fim => {
      function passo(agora) {
        const t = Math.min(1, (agora - comeco) / dura);
        giro = de + (ate - de) * (1 - Math.pow(1 - t, 4));
        desenhar(giro);
        if (t < 1) requestAnimationFrame(passo); else fim();
      }
      requestAnimationFrame(passo);
    });
  }

  function mostrarResultado(premio, nome, jaTinha, bilhete) {
    if (jaTinha) { avisar(true, "Esse ID (ou nome) já girou <b>este mês</b>. Volte no mês que vem para girar de novo!"); return; }
    if (perdeu(premio)) { avisar(false, "😅 <b>" + esc(premio) + "</b>... Tente de novo no mês que vem!"); return; }
    if (!bilhete) { avisar(true, "🎉 Você ganhou: <b>" + esc(premio) + "</b>! Chame o V4X no Discord para receber."); return; }
    avisar(true, "🎉 Você ganhou: <b>" + esc(premio) + "</b>!" +
      '<div class="bilhete"><span>SEU BILHETE</span><b id="bilheteTexto">' + esc(bilhete) + '</b><button type="button" class="botao fantasma" id="copiarBilhete">Copiar</button></div>' +
      "<b>Para receber:</b> entre no Discord, <b>abra um ticket</b> e cole o seu bilhete. " +
      "⚠️ <b>Guarde o bilhete agora</b> (tire um print): ele só aparece esta vez, e só quem tem o bilhete recebe o prêmio." +
      '<div style="margin-top:12px"><a class="botao roxo" href="' + esc(S.discord || "#") + '" target="_blank" rel="noopener">💬 Abrir o Discord</a></div>');
    const b = document.getElementById("copiarBilhete");
    if (b) b.addEventListener("click", () => { navigator.clipboard && navigator.clipboard.writeText(bilhete); b.textContent = "Copiado! ✓"; });
  }

  function prepararTela() {
    if (titulo && sorteio.titulo) titulo.textContent = sorteio.titulo;
    desenhar(giro);
    if (!sorteio.aberto || premios.length < 2) {
      botao.disabled = true;
      avisar(false, "Nenhum sorteio aberto agora. Fique de olho no Discord: o próximo pode sair a qualquer hora!");
      return false;
    }
    return true;
  }

  // ---------- COM o juiz (a planilha) ----------
  async function iniciarComJuiz() {
    botao.disabled = true;
    desenhar(0);
    try {
      sorteio = await (await fetch(juiz)).json();
      premios = sorteio.premios || [];
    } catch (e) {
      avisar(false, "Não consegui falar com o sorteio agora. Tente de novo daqui a pouco.");
      return;
    }
    if (!prepararTela()) return;
    botao.disabled = false;
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      botao.disabled = true;
      resposta.className = "resposta";
      let r;
      try {
        // (text/plain: o Google aceita sem pedir permissão extra ao navegador)
        r = await (await fetch(juiz, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ nome: d.nome, id: d.id }) })).json();
      } catch (err) {
        avisar(false, "Não consegui falar com o sorteio agora. Tente de novo daqui a pouco.");
        botao.disabled = false;
        return;
      }
      if (r.erro) { avisar(false, esc(r.erro)); botao.disabled = false; return; }
      if (r.jaGirou) { mostrarResultado(r.premio, d.nome, true); return; }
      await girarAte(r.indice);
      mostrarResultado(r.premio, d.nome, false, r.bilhete);
    });
  }

  // ---------- SEM o juiz (o jeito antigo: 1 giro por navegador) ----------
  function iniciarSemJuiz() {
    const agora = new Date(), chave = "sorteio." + (sorteio.id || "1") + "." + agora.getFullYear() + "-" + (agora.getMonth() + 1); // (1 por mês)
    if (!prepararTela()) return;
    document.fonts && document.fonts.ready.then(() => desenhar(giro));
    if (localStorage.getItem(chave)) { botao.disabled = true; mostrarResultado(localStorage.getItem(chave), "", true); }
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (localStorage.getItem(chave)) return;
      const d = Object.fromEntries(new FormData(form));
      const nome = (d.nome || "").trim(), achou = (d.id || "").toUpperCase().match(/([A-Z0-9]{4})\s*-?\s*([A-Z0-9]{4})(?![A-Z0-9])/);
      const id = achou ? achou[1] + "-" + achou[2] : "";
      if (nome.length < 2) { avisar(false, "Coloque o seu nome do Discord."); return; }
      if (!id) { avisar(false, "O ID do jogo tem 8 letras/números (ex.: ABCD-EFGH). Ele aparece na LOJA do jogo, em Conjuntos exclusivos."); return; }
      botao.disabled = true;
      resposta.className = "resposta";
      const n = new Uint32Array(1); crypto.getRandomValues(n);
      const indice = n[0] % premios.length, premio = premios[indice];
      await girarAte(indice);
      localStorage.setItem(chave, premio);
      mostrarResultado(premio, nome, false);
      if (S.webhookSuporte) {
        try {
          await fetch(S.webhookSuporte, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
            username: "Roleta do Mudança do Caos", allowed_mentions: { parse: [] },
            embeds: [{ title: (perdeu(premio) ? "🎰 Sorteio (não ganhou) — " : "🎰🎉 SORTEIO: GANHOU! — ") + nome.slice(0, 60), color: perdeu(premio) ? 0x6b7cff : 0xffc21a,
              fields: [{ name: "Prêmio", value: premio, inline: true }, { name: "ID do jogo", value: id, inline: true }],
              footer: { text: "Girou no site" }, timestamp: new Date().toISOString() }] }) });
        } catch (err) { }
      }
    });
  }

  if (juiz) iniciarComJuiz(); else iniciarSemJuiz();
})();
