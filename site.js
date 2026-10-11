// MUDANÇA DO CAOS — o "motor" do site: monta o topo, o rodapé, os botões de baixar, as fases, as novidades e o
// formulário. Os DADOS ficam em dados/site.js (links, fases) e dados/novidades.js (os posts — o Unity atualiza sozinho).
(function () {
  const S = window.SITE || {};
  const N = window.NOVIDADES || [];
  const aqui = (document.body.dataset.pagina || "inicio");

  // ---------- o topo ----------
  const paginas = [
    ["inicio", "index.html", "Início"],
    ["novidades", "novidades.html", "Novidades"],
    ["fases", "fases.html", "Fases"],
    ["sorteios", "sorteios.html", "Sorteios"],
    ["suporte", "suporte.html", "Suporte e Ideias"],
    ["baixar", "baixar.html", "Baixar"],
  ];
  const topo = document.getElementById("topo");
  if (topo) {
    topo.className = "topo";
    topo.innerHTML =
      '<div class="miolo">' +
      '<a class="marca" href="index.html"><img src="img/icone.png" alt=""><span>MUDANÇA DO <b>CAOS</b></span></a>' +
      '<button class="abrir-menu" aria-label="Abrir o menu">☰</button>' +
      '<nav class="menu">' +
      paginas.map(p => '<a href="' + p[1] + '" class="' + (p[0] === "baixar" ? "aba-baixar " : "") + (p[0] === aqui ? "aqui" : "") + '">' + p[2] + "</a>").join("") +
      "</nav></div>";
    const menu = topo.querySelector(".menu");
    topo.querySelector(".abrir-menu").addEventListener("click", () => menu.classList.toggle("aberto"));
  }

  // ---------- o rodapé ----------
  const rodape = document.getElementById("rodape");
  if (rodape) {
    rodape.className = "rodape";
    rodape.innerHTML =
      '<div class="miolo"><div>© ' + new Date().getFullYear() + " Mudança do Caos — feito por <b>V4X</b> (V4XPlay)</div>" +
      '<div><a href="' + (S.discord || "#") + '" target="_blank" rel="noopener">Discord</a> · <a href="baixar.html">Baixar</a> · <a href="suporte.html">Suporte</a> · <a href="novidades.html">Novidades</a></div></div>';
  }

  // ---------- os botões de BAIXAR e de DISCORD ----------
  document.querySelectorAll("[data-baixar]").forEach(a => { a.href = S.baixar || "#"; a.target = "_blank"; a.rel = "noopener"; });
  document.querySelectorAll("[data-discord]").forEach(a => { a.href = S.discord || "#"; a.target = "_blank"; a.rel = "noopener"; });
  document.querySelectorAll("[data-versao]").forEach(e => { if (N.length) e.textContent = N[0].titulo + " · " + N[0].data; });

  // ---------- as FASES (com a foto grande ao clicar) ----------
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  document.querySelectorAll("[data-fases]").forEach(caixa => {
    const quantas = parseInt(caixa.dataset.fases || "99", 10);
    caixa.className = "fases";
    caixa.innerHTML = (S.fases || []).slice(0, quantas).map((f, i) =>
      '<button class="fase" data-i="' + i + '"><img loading="lazy" src="img/fases/' + f.foto + '" alt="' + esc(f.nome) + '">' +
      '<div class="texto"><span class="tipo ' + (f.tipo || "").toLowerCase() + '">' + esc(f.tipo || "Modo normal") + "</span>" +
      "<h3>" + esc(f.nome) + "</h3><p>" + esc(f.descricao) + "</p></div></button>").join("");
  });
  const grande = document.createElement("div");
  grande.className = "foto-grande";
  grande.innerHTML = '<button class="fechar" aria-label="Fechar">×</button><figure><img alt=""><figcaption><h3></h3><p></p></figcaption></figure>';
  document.body.appendChild(grande);
  const fechar = () => grande.classList.remove("aberta");
  grande.addEventListener("click", e => { if (e.target === grande || e.target.classList.contains("fechar")) fechar(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") fechar(); });
  document.addEventListener("click", e => {
    const foto = e.target.closest(".post-fotos img");
    if (foto) {
      grande.querySelector("img").src = foto.src;
      grande.querySelector("h3").textContent = "";
      grande.querySelector("p").textContent = "";
      grande.classList.add("aberta");
      return;
    }
    const b = e.target.closest(".fase");
    if (!b) return;
    const f = (S.fases || [])[+b.dataset.i];
    grande.querySelector("img").src = "img/fases/" + f.foto;
    grande.querySelector("h3").textContent = f.nome;
    grande.querySelector("p").textContent = f.charada ? "“" + f.charada + "”" : f.descricao;
    grande.classList.add("aberta");
  });

  // ---------- as NOVIDADES (o blog) ----------
  document.querySelectorAll("[data-novidades]").forEach(caixa => {
    const quantas = parseInt(caixa.dataset.novidades || "99", 10);
    caixa.className = "posts";
    // (o item "TÍTULO: texto" ganha o título em destaque)
    const item = t => { const k = t.indexOf(": "); return k > 0 && k < 45 ? "<b>" + esc(t.slice(0, k)) + "</b> " + esc(t.slice(k + 2)) : esc(t); };
    caixa.innerHTML = N.slice(0, quantas).map((p, i) => {
      const fotos = p.fotos || [];
      const midia = (p.video ? '<video class="post-video" src="' + esc(p.video) + '" autoplay muted loop playsinline controls></video>' : "") +
        (fotos.length ? '<div class="post-fotos ' + (fotos.length === 1 ? "uma" : "") + '">' + fotos.map((f, k) =>
          '<img loading="lazy" class="' + (k === 0 && !p.video ? "grande" : "") + '" src="' + esc(f) + '" alt="">').join("") + "</div>" : "");
      return '<article class="post' + (i === 0 ? " ultima" : "") + '">' +
        '<div class="post-topo"><span class="post-demo">' + esc(p.titulo) + "</span>" +
        (p.build ? '<span class="post-build">' + esc(p.build) + "</span>" : "") +
        '<span class="post-data">' + esc(p.data) + "</span>" + (i === 0 ? '<span class="post-nova">NOVA</span>' : "") + "</div>" +
        "<h3>" + esc(p.chamada || p.titulo) + "</h3>" +
        (p.texto ? '<p class="post-texto">' + esc(p.texto) + "</p>" : "") +
        midia +
        '<h4>O que tem de novo</h4><ul class="post-itens">' + (p.itens || []).map(t => "<li>" + item(t) + "</li>").join("") + "</ul>" +
        "</article>";
    }).join("");
  });

  // ---------- EM BREVE (só curiosidade) ----------
  document.querySelectorAll("[data-em-breve]").forEach(caixa => {
    caixa.className = "em-breve";
    caixa.innerHTML = (window.EM_BREVE || []).map(e =>
      '<div class="em-breve-cartao"><div class="em-breve-icone">' + esc(e.icone) + "</div><h3>" + esc(e.titulo) + "</h3><p>" + esc(e.texto) + "</p></div>").join("");
  });

  // ---------- o FORMULÁRIO de suporte (vai para um canal privado do Discord) ----------
  const form = document.getElementById("formulario");
  if (form) {
    const resposta = document.getElementById("resposta");
    const avisar = (ok, texto) => { resposta.className = "resposta " + (ok ? "ok" : "erro"); resposta.textContent = texto; };
    if (!S.webhookSuporte) {
      form.querySelector(".enviar").disabled = true;
      avisar(false, "O formulário ainda não está ligado. Por enquanto, chame a gente no Discord!");
    }
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const ultimo = +(localStorage.getItem("ultimoPedido") || 0);
      if (Date.now() - ultimo < 60000) { avisar(false, "Calma! Espere 1 minutinho para mandar outro pedido."); return; }
      const d = Object.fromEntries(new FormData(form));
      if ((d.mensagem || "").trim().length < 10) { avisar(false, "Escreva um pouquinho mais (pelo menos 10 letras)."); return; }
      const cores = { "Problema no jogo": 0xff5470, "Ideia": 0x3ddc84, "Sorteio": 0xffc21a, "Outro": 0x6b7cff };
      const corpo = {
        username: "Site do Mudança do Caos",
        allowed_mentions: { parse: [] },
        embeds: [{
          title: (d.tipo || "Pedido") + " — " + (d.nome || "sem nome").slice(0, 60),
          description: d.mensagem.slice(0, 3500),
          color: cores[d.tipo] || 0xff8a00,
          fields: [
            { name: "Contato", value: (d.contato || "(não deixou)").slice(0, 200), inline: true },
            { name: "Versão do jogo", value: (d.versao || "(não disse)").slice(0, 60), inline: true },
          ],
          footer: { text: "Mandado pelo site" },
          timestamp: new Date().toISOString(),
        }],
      };
      const botao = form.querySelector(".enviar");
      botao.disabled = true;
      try {
        const r = await fetch(S.webhookSuporte, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
        if (!r.ok) throw new Error(r.status);
        localStorage.setItem("ultimoPedido", String(Date.now()));
        form.reset();
        avisar(true, "Recebido! Obrigado — a gente vai ler com carinho. 🚚💥");
      } catch (err) {
        avisar(false, "Não consegui mandar agora. Tente de novo daqui a pouco, ou chame a gente no Discord.");
      } finally {
        botao.disabled = false;
      }
    });
  }
})();
