(function () {
  var T = window.TORCCOL;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var IMG = "src/img/produtos/";
  var temGsap = function () { return !!(window.gsap && window.TorccolMotion); };
  var temFlip = function () { return !!(window.Flip && window.TorccolMotion); };
  var fino = matchMedia("(pointer: fine)").matches;

  function zap(texto) {
    return "https://wa.me/" + T.whatsapp + "?text=" + encodeURIComponent(texto);
  }
  function familia(id) { return T.familias.filter(function (f) { return f.id === id; })[0]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function doFamilia(id) { return T.produtos.filter(function (p) { return p.familia === id; }); }

  /* Links genéricos de WhatsApp */
  $$("[data-zap]").forEach(function (a) {
    a.href = zap(a.getAttribute("data-zap") || "Olá, Torccol! Vim pelo site e gostaria de um orçamento.");
    a.target = "_blank"; a.rel = "noopener";
  });

  /* Menu mobile */
  var btnMenu = $(".abrir-menu"), menu = $(".menu");
  if (btnMenu) {
    btnMenu.addEventListener("click", function () {
      var aberto = menu.classList.toggle("aberto");
      btnMenu.setAttribute("aria-expanded", aberto);
    });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menu.classList.remove("aberto"); btnMenu.setAttribute("aria-expanded", "false"); }); });
  }

  /* ---------- Home: trilho das famílias ---------- */
  var trilho = $("#trilho");
  if (trilho) {
    var capa = { vedacao: "protecao-sanfonada", apoio: "acoplamentos", movimento: "rodas-em-borracha-e-poliuretano", chapas: "tarugos-de-poliuretano", especiais: "precionador" };
    trilho.innerHTML = T.familias.map(function (f, i) {
      var itens = doFamilia(f.id);
      return '<a class="painel painel-' + (i % 3) + '" href="produtos.html#' + f.id + '">' +
        '<div class="painel-txt"><span class="painel-n">' + itens.length + (itens.length > 1 ? " linhas" : " linha") + "</span>" +
        "<h3>" + f.nome + "</h3><p>" + f.resumo + "</p>" +
        "<ul>" + itens.map(function (p) { return "<li>" + p.nome + "</li>"; }).join("") + "</ul>" +
        '<span class="painel-ver">Ver no catálogo</span></div>' +
        '<div class="painel-img" aria-hidden="true"><img src="' + IMG + capa[f.id] + '.webp" alt="" loading="lazy"></div></a>';
    }).join("") +
      '<div class="painel painel-fim"><div class="painel-txt"><h3>Não está aqui?</h3><p>Mande o desenho, a amostra ou a peça gasta. A matriz a gente faz.</p>' +
      '<a class="btn btn-verde" href="' + zap("Olá, Torccol! Preciso de uma peça sob medida. Vou enviar o desenho/foto.") + '" target="_blank" rel="noopener">Enviar desenho pelo WhatsApp</a></div></div>';
  }

  /* ---------- Home: seletor de composto ---------- */
  var chips = $("#chips"), listaComp = $("#compostos");
  if (chips && listaComp) {
    var ativos = [];
    chips.innerHTML = T.condicoes.map(function (c) {
      return '<button type="button" class="chip" aria-pressed="false" data-c="' + c.id + '">' + c.nome + "</button>";
    }).join("");
    listaComp.innerHTML = T.compostos.map(function (c) {
      return '<article class="composto" data-s="' + c.sigla + '">' +
        '<span class="selo"></span>' +
        '<div class="sigla">' + c.sigla + '</div><div class="nome">' + c.nome + "</div>" +
        '<p class="nota">' + c.nota + '</p><div class="faixa-t">' + c.faixa + "</div></article>";
    }).join("");
    var saida = $("#resultado");
    var render = function () {
      var estado = temFlip() ? Flip.getState(".composto") : null;
      listaComp.classList.toggle("filtrando", ativos.length > 0);
      var bons = [], peso = {};
      T.compostos.forEach(function (c, i) {
        var el = $('[data-s="' + c.sigla + '"]', listaComp), selo = $(".selo", el);
        var notas = ativos.map(function (a) { return c.r[a]; });
        var ok = notas.length && notas.every(function (n) { return n === 2; });
        var parcial = !ok && notas.length && notas.every(function (n) { return n >= 1; });
        el.classList.toggle("ok", !!ok);
        el.classList.toggle("parcial", !!parcial);
        selo.textContent = ok ? "Indicado" : parcial ? "Com ressalvas" : "";
        if (ok) bons.push(c.sigla);
        peso[c.sigla] = (ok ? 0 : parcial ? 100 : 200) + i;
      });
      /* indicados sobem para o começo da grade */
      $$(".composto", listaComp).sort(function (a, b) { return peso[a.dataset.s] - peso[b.dataset.s]; })
        .forEach(function (el) { listaComp.appendChild(el); });
      if (estado) Flip.from(estado, { duration: .6, ease: "power3.inOut", stagger: .015 });
      if (!ativos.length) saida.textContent = "Marque as condições da sua aplicação.";
      else if (bons.length) saida.textContent = "Indicado para essa combinação: " + bons.join(", ") + ".";
      else saida.textContent = "Nenhum composto padrão atende tudo isso de uma vez. É caso para formulação sob medida — fale com a engenharia.";
    };
    chips.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return;
      var id = b.getAttribute("data-c"), on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", on);
      ativos = on ? ativos.concat(id) : ativos.filter(function (x) { return x !== id; });
      render();
    });
    $("#limpar").addEventListener("click", function () {
      ativos = []; $$(".chip", chips).forEach(function (b) { b.setAttribute("aria-pressed", "false"); }); render();
    });
    render();
  }

  /* ---------- Formulário de orçamento -> WhatsApp ---------- */
  var form = $("#form-orcamento");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form), linhas = ["Olá, Torccol! Pedido de orçamento pelo site:", ""];
      [["nome", "Nome"], ["empresa", "Empresa"], ["telefone", "Telefone"], ["interesse", "Interesse"], ["segmento", "Segmento"]].forEach(function (k) {
        var v = (d.get(k[0]) || "").toString().trim(); if (v) linhas.push(k[1] + ": " + v);
      });
      var m = (d.get("mensagem") || "").toString().trim();
      if (m) linhas.push("", m);
      linhas.push("", "(Vou enviar o desenho/foto da peça em seguida.)");
      window.open(zap(linhas.join("\n")), "_blank", "noopener");
    });
  }

  /* ---------- Catálogo ---------- */
  var grade = $("#grade");
  if (!grade) return;

  var filtro = "todos", termo = "", lista = [];
  try { lista = JSON.parse(localStorage.getItem("torccol-cotacao") || "[]"); } catch (e) { lista = []; }
  var salvar = function () { try { localStorage.setItem("torccol-cotacao", JSON.stringify(lista)); } catch (e) {} };

  var abas = $("#abas");
  abas.innerHTML = '<button type="button" class="chip" data-f="todos" aria-pressed="true">Todas (' + T.produtos.length + ")</button>" +
    T.familias.map(function (f) {
      return '<button type="button" class="chip" data-f="' + f.id + '" aria-pressed="false">' + f.nome + " (" + doFamilia(f.id).length + ")</button>";
    }).join("");

  var norm = function (s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };

  /* Os cards são criados uma vez; o filtro só esconde/mostra (permite animar com Flip) */
  grade.innerHTML = T.produtos.map(function (p) {
    return '<button type="button" class="item" data-slug="' + p.slug + '">' +
      '<span class="na-lista">Na cotação</span>' +
      '<span class="img"><img src="' + IMG + p.img + '.webp" alt="' + esc(p.nome) + ' fabricados pela Torccol" loading="lazy"></span>' +
      '<span class="corpo"><span class="fam">' + familia(p.familia).nome + "</span><h3>" + p.nome + "</h3><p>" + p.desc + "</p></span></button>";
  }).join("") + '<div class="vazio" hidden><h3></h3><p>Fabricamos sob desenho — descreva a peça e a gente orça.</p><a class="btn btn-verde" target="_blank" rel="noopener" href="#">Descrever a peça no WhatsApp</a></div>';
  var itens = $$(".item", grade), vazio = $(".vazio", grade);

  function desenhar(animar) {
    var t = norm(termo), n = 0;
    var estado = animar && temFlip() ? Flip.getState(itens) : null;
    itens.forEach(function (el) {
      var p = T.produtos.filter(function (x) { return x.slug === el.dataset.slug; })[0];
      var okF = filtro === "todos" || p.familia === filtro;
      var alvo = norm([p.nome, p.desc, p.usos.join(" "), p.compostos.join(" "), familia(p.familia).nome].join(" "));
      var vis = okF && (!t || alvo.indexOf(t) > -1);
      el.style.display = vis ? "" : "none";
      el.classList.toggle("selecionado", lista.indexOf(p.slug) > -1);
      if (vis) n++;
    });
    vazio.hidden = n > 0;
    if (!n) {
      $("h3", vazio).textContent = "Nada com “" + termo + "” no catálogo.";
      $("a", vazio).href = zap("Olá, Torccol! Procuro uma peça que não achei no catálogo: " + termo);
    }
    $("#contagem").textContent = n + (n === 1 ? " peça" : " peças");
    if (estado) {
      grade.style.minHeight = grade.offsetHeight + "px"; /* evita a grade colapsar durante o Flip */
      Flip.from(estado, {
        duration: .55, ease: "power3.inOut", scale: true, absolute: true, stagger: .015,
        onComplete: function () { grade.style.minHeight = ""; },
        onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .45, ease: "power2.out" }); },
        onLeave: function (els) { return gsap.to(els, { opacity: 0, scale: .85, duration: .3 }); }
      });
    }
  }

  abas.addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    filtro = b.getAttribute("data-f");
    $$(".chip", abas).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
    history.replaceState(null, "", filtro === "todos" ? location.pathname : "#" + filtro);
    desenhar(true);
  });
  var tb;
  $("#busca").addEventListener("input", function (e) { termo = e.target.value; clearTimeout(tb); tb = setTimeout(function () { desenhar(true); }, 120); });

  /* Inclinação 3D da peça no card */
  if (fino && window.gsap) {
    itens.forEach(function (el) {
      var img = $(".img img", el);
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        gsap.to(img, { rotateY: x * 26, rotateX: -y * 20, scale: 1.08, duration: .5, ease: "power3.out", transformPerspective: 600 });
      });
      el.addEventListener("pointerleave", function () { gsap.to(img, { rotateY: 0, rotateX: 0, scale: 1, duration: .7, ease: "elastic.out(1,.5)" }); });
    });
  }

  /* Ficha */
  var ficha = $("#ficha"), atual = null, fImg = $("#f-img");
  function abrir(slug, origem) {
    var p = T.produtos.filter(function (x) { return x.slug === slug; })[0]; if (!p) return;
    atual = p;
    fImg.src = IMG + p.img + ".webp";
    fImg.alt = p.nome;
    $("#f-fam").textContent = familia(p.familia).nome;
    $("#f-nome").textContent = p.nome;
    $("#f-desc").textContent = p.desc;
    $("#f-comp").innerHTML = p.compostos.map(function (c) { return "<span>" + c + "</span>"; }).join("");
    $("#f-usos").innerHTML = p.usos.map(function (c) { return "<span>" + c + "</span>"; }).join("");
    $("#f-zap").href = zap("Olá, Torccol! Quero orçamento de " + p.nome.toLowerCase() + ". Medidas/quantidade: ");
    atualizarBotaoLista();
    var rel = T.produtos.filter(function (x) { return x.familia === p.familia && x.slug !== p.slug; }).slice(0, 4);
    if (rel.length < 4) rel = rel.concat(T.produtos.filter(function (x) { return x.familia !== p.familia; }).slice(0, 4 - rel.length));
    $("#f-rel").innerHTML = rel.map(function (r) {
      return '<button type="button" data-slug="' + r.slug + '"><img src="' + IMG + r.img + '.webp" alt="">' + r.nome + "</button>";
    }).join("");
    var jaAberta = ficha.open;
    if (!jaAberta) { ficha.showModal(); if (window.TorccolMotion && TorccolMotion.lenis) TorccolMotion.lenis.stop(); }
    ficha.scrollTop = 0;
    history.replaceState(null, "", "#peca-" + p.slug);

    if (temGsap()) {
      var de = origem ? origem.getBoundingClientRect() : null;
      gsap.fromTo(".ficha-txt > *, .relacionados", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .04, ease: "power3.out", delay: .15 });
      if (!jaAberta) gsap.fromTo(ficha, { opacity: 0 }, { opacity: 1, duration: .25 });
      gsap.fromTo(".ficha-faixa", { xPercent: 50, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .8, ease: "expo.out" });
      /* a foto do card "voa" até a ficha */
      (fImg.decode ? fImg.decode() : Promise.resolve()).catch(function () {}).then(function () {
        var para = fImg.getBoundingClientRect();
        if (de && para.width) {
          gsap.fromTo(fImg, { x: de.left - para.left, y: de.top - para.top, scaleX: de.width / para.width, scaleY: de.height / para.height, transformOrigin: "0 0" },
            { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .75, ease: "expo.out" });
        } else {
          gsap.fromTo(fImg, { scale: .8, opacity: 0 }, { scale: 1, opacity: 1, duration: .6, ease: "back.out(1.6)" });
        }
      });
    }
  }
  function atualizarBotaoLista() {
    $("#f-lista").textContent = lista.indexOf(atual.slug) > -1 ? "Tirar da cotação" : "Adicionar à cotação";
  }
  grade.addEventListener("click", function (e) { var b = e.target.closest(".item"); if (b) abrir(b.getAttribute("data-slug"), $(".img img", b)); });
  $("#f-rel").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) abrir(b.getAttribute("data-slug"), $("img", b)); });
  $(".fechar", ficha).addEventListener("click", function () { ficha.close(); });
  ficha.addEventListener("click", function (e) { if (e.target === ficha) ficha.close(); });
  ficha.addEventListener("close", function () {
    if (window.TorccolMotion && TorccolMotion.lenis) TorccolMotion.lenis.start();
    history.replaceState(null, "", filtro === "todos" ? location.pathname : "#" + filtro);
  });

  /* Lista de cotação */
  var barra = $("#cotacao");
  function atualizarBarra() {
    var ativa = lista.length > 0, era = barra.classList.contains("ativa");
    barra.classList.toggle("ativa", ativa);
    document.body.classList.toggle("tem-cotacao", ativa);
    $("#c-qtd").textContent = lista.length + (lista.length === 1 ? " peça" : " peças");
    if (ativa && era && window.gsap) gsap.fromTo("#c-qtd", { scale: 1.5 }, { scale: 1, duration: .5, ease: "back.out(3)" });
    var nomes = lista.map(function (s) { return T.produtos.filter(function (p) { return p.slug === s; })[0]; }).filter(Boolean)
      .map(function (p) { return "• " + p.nome; });
    $("#c-enviar").href = zap("Olá, Torccol! Quero orçamento destas peças do catálogo:\n" + nomes.join("\n") + "\n\nMedidas e quantidades: ");
  }
  $("#f-lista").addEventListener("click", function () {
    var i = lista.indexOf(atual.slug);
    if (i > -1) lista.splice(i, 1); else lista.push(atual.slug);
    salvar(); atualizarBotaoLista(); atualizarBarra(); desenhar(false);
  });
  $("#c-limpar").addEventListener("click", function () { lista = []; salvar(); atualizarBarra(); desenhar(false); });

  /* Estado inicial pelo hash */
  var h = location.hash.slice(1);
  if (familia(h)) { filtro = h; $$(".chip", abas).forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-f") === h); }); }
  desenhar(false); atualizarBarra();
  if (window.gsap) gsap.from(itens.filter(function (el) { return el.style.display !== "none"; }), { y: 40, opacity: 0, duration: .7, ease: "power3.out", stagger: .04, delay: .1 });
  if (h.indexOf("peca-") === 0) abrir(h.slice(5));
})();
