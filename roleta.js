// MUDANÇA DO CAOS — a ROLETA DO SORTEIO (página Sorteios).
// Os prêmios ficam em dados/site.js ("sorteio"). A pessoa preenche o nome e o ID do jogo, gira, e o resultado
// vai para o canal privado do Discord (o mesmo do Suporte), para o V4X mandar o código do prêmio.
// Cada navegador gira 1 vez por sorteio (o "id" do sorteio: trocou o id, todo mundo pode girar de novo).
(function () {
  const S = window.SITE || {};
  const sorteio = S.sorteio || {};
  const premios = sorteio.premios || [];
  const canvas = document.getElementById("roleta");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const form = document.getElementById("formSorteio");
  const resposta = document.getElementById("respostaSorteio");
  const titulo = document.getElementById("tituloSorteio");
  const cores = ["#ff8a00", "#2c3a6b", "#ffc21a", "#3a4a85", "#ff5470", "#26335c", "#3ddc84", "#33417a"];
  const chave = "sorteio." + (sorteio.id || "1");
  let giro = 0;

  if (titulo && sorteio.titulo) titulo.textContent = sorteio.titulo;
  const avisar = (ok, texto) => { resposta.className = "resposta " + (ok ? "ok" : "erro"); resposta.innerHTML = texto; };

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
      // o nome do prêmio, deitado na fatia
      ctx.save(); ctx.translate(c, c); ctx.rotate(a0 + fatia / 2);
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      const claro = ["#ffc21a", "#3ddc84", "#ff8a00"].includes(cores[i % cores.length]);
      ctx.fillStyle = claro ? "#1d1300" : "#fff";
      let tamanho = Math.max(14, Math.min(26, 360 / Math.max(6, p.length)));
      ctx.font = "800 " + tamanho + "px Nunito, sans-serif";
      ctx.fillText(p.length > 22 ? p.slice(0, 21) + "…" : p, r - 18, 0);
      ctx.restore();
    });
    // o miolo
    ctx.beginPath(); ctx.arc(c, c, 46, 0, Math.PI * 2); ctx.fillStyle = "#141b33"; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = "#ffc21a"; ctx.stroke();
    ctx.fillStyle = "#ffc21a"; ctx.font = "26px 'Lilita One', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("CAOS", c, c + 2);
  }
  desenhar(0);
  document.fonts && document.fonts.ready.then(() => desenhar(giro));

  // ---------- sorteio fechado ou sem prêmios ----------
  if (!sorteio.aberto || premios.length < 2) {
    form.querySelector("button").disabled = true;
    avisar(false, "Nenhum sorteio aberto agora. Fique de olho no Discord: o próximo pode sair a qualquer hora!");
    return;
  }
  const jaGirou = localStorage.getItem(chave);
  if (jaGirou) {
    form.querySelector("button").disabled = true;
    avisar(true, "Você já girou neste sorteio: <b>" + jaGirou + "</b>. Boa sorte no próximo!");
  }

  // ---------- girar ----------
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (localStorage.getItem(chave)) return;
    const d = Object.fromEntries(new FormData(form));
    const nome = (d.nome || "").trim(), id = (d.id || "").trim().toUpperCase();
    if (nome.length < 2) { avisar(false, "Coloque o seu nome do Discord."); return; }
    if (!/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/.test(id)) { avisar(false, "O ID do jogo tem 8 letras/números (ex.: ABCD-EFGH). Ele aparece na LOJA do jogo, em Conjuntos exclusivos."); return; }
    const botao = form.querySelector("button");
    botao.disabled = true;
    resposta.className = "resposta";

    // escolhe o prêmio (sorteio justo: cada fatia tem a mesma chance)
    const n = new Uint32Array(1); crypto.getRandomValues(n);
    const escolhido = n[0] % premios.length;
    const fatia = (Math.PI * 2) / premios.length;
    // a seta fica em cima: gira até o MEIO da fatia escolhida parar embaixo dela (+ umas voltas)
    const alvo = -(escolhido * fatia + fatia / 2);
    const voltas = 6 + Math.floor(Math.random() * 3);
    const de = giro, ate = alvo - voltas * Math.PI * 2 + Math.round((giro - alvo) / (Math.PI * 2)) * Math.PI * 2;
    const comeco = performance.now(), dura = 5200;
    await new Promise(fim => {
      function passo(agora) {
        const t = Math.min(1, (agora - comeco) / dura);
        const suave = 1 - Math.pow(1 - t, 4);
        giro = de + (ate - de) * suave;
        desenhar(giro);
        if (t < 1) requestAnimationFrame(passo); else fim();
      }
      requestAnimationFrame(passo);
    });

    const premio = premios[escolhido];
    const perdeu = /não foi|tente de novo|nada/i.test(premio);
    localStorage.setItem(chave, premio);
    avisar(!perdeu, perdeu ? "😅 <b>" + premio + "</b>... Fica para o próximo sorteio!"
                           : "🎉 Você ganhou: <b>" + premio + "</b>! O V4X vai te mandar o <b>código</b> no Discord (" + nome.replace(/</g, "") + ").");

    // grava no Discord (canal privado)
    if (S.webhookSuporte) {
      try {
        await fetch(S.webhookSuporte, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "Roleta do Mudança do Caos", allowed_mentions: { parse: [] },
            embeds: [{
              title: (perdeu ? "🎰 Sorteio (não ganhou) — " : "🎰🎉 SORTEIO: GANHOU! — ") + nome.slice(0, 60),
              color: perdeu ? 0x6b7cff : 0xffc21a,
              fields: [
                { name: "Prêmio", value: premio.slice(0, 200), inline: true },
                { name: "ID do jogo", value: id.slice(0, 20), inline: true },
                { name: "Sorteio", value: (sorteio.titulo || sorteio.id || "").slice(0, 100), inline: false },
              ],
              footer: { text: "Girou no site" }, timestamp: new Date().toISOString(),
            }],
          }),
        });
      } catch (err) { /* (se o Discord falhar, o resultado continua na tela) */ }
    }
  });
})();
