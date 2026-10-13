(function () {
  var T = window.TORCCOL;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var IMG = "src/img/produtos/";

  function zap(texto) {
    return "https://wa.me/" + T.whatsapp + "?text=" + encodeURIComponent(texto);
  }
  function familia(id) { return T.familias.filter(function (f) { return f.id === id; })[0]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

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

  /* ---------- Home: famílias ---------- */
  var fams = $("#familias");
  if (fams) {
    fams.innerHTML = T.familias.map(function (f) {
      var itens = T.produtos.filter(function (p) { return p.familia === f.id; });
      var fotos = itens.slice(0, 2).map(function (p, i) {
        var pos = ["right:0;bottom:0;max-width:64%", "left:0;bottom:4%;max-width:42%"][i];
        return '<img src="' + IMG + p.img + '.webp" alt="" loading="lazy" style="' + pos + '">';
      }).join("");
      return '<a class="familia" href="produtos.html#' + f.id + '">' +
        "<h3>" + f.nome + "</h3><p>" + f.resumo + "</p>" +
        '<span class="qtd">' + itens.length + (itens.length > 1 ? " linhas de produto" : " linha") + "</span>" +
        '<div class="fotos" aria-hidden="true">' + fotos + "</div></a>";
    }).join("");
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
      listaComp.classList.toggle("filtrando", ativos.length > 0);
      var bons = [];
      T.compostos.forEach(function (c) {
        var el = $('[data-s="' + c.sigla + '"]', listaComp), selo = $(".selo", el);
        var notas = ativos.map(function (a) { return c.r[a]; });
        var ok = notas.length && notas.every(function (n) { return n === 2; });
        var parcial = !ok && notas.length && notas.every(function (n) { return n >= 1; });
        el.classList.toggle("ok", !!ok);
        el.classList.toggle("parcial", !!parcial);
        selo.textContent = ok ? "Indicado" : parcial ? "Com ressalvas" : "";
        if (ok) bons.push(c.sigla);
      });
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
      var n = T.produtos.filter(function (p) { return p.familia === f.id; }).length;
      return '<button type="button" class="chip" data-f="' + f.id + '" aria-pressed="false">' + f.nome + " (" + n + ")</button>";
    }).join("");

  var norm = function (s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };

  function desenhar() {
    var t = norm(termo);
    var vis = T.produtos.filter(function (p) {
      var okF = filtro === "todos" || p.familia === filtro;
      var alvo = norm([p.nome, p.desc, p.usos.join(" "), p.compostos.join(" "), familia(p.familia).nome].join(" "));
      return okF && (!t || alvo.indexOf(t) > -1);
    });
    $("#contagem").textContent = vis.length + (vis.length === 1 ? " peça" : " peças");
    grade.innerHTML = vis.length ? vis.map(function (p) {
      var sel = lista.indexOf(p.slug) > -1;
      return '<button type="button" class="item' + (sel ? " selecionado" : "") + '" data-slug="' + p.slug + '">' +
        '<span class="na-lista">Na cotação</span>' +
        '<span class="img"><img src="' + IMG + p.img + '.webp" alt="' + esc(p.nome) + ' fabricados pela Torccol" loading="lazy"></span>' +
        '<span class="corpo"><span class="fam">' + familia(p.familia).nome + "</span><h3>" + p.nome + "</h3><p>" + p.desc + "</p></span></button>";
    }).join("") : '<div class="vazio"><h3>Nada com “' + esc(termo) + '” no catálogo.</h3><p>Fabricamos sob desenho — descreva a peça e a gente orça.</p><a class="btn btn-verde" data-zap-dyn href="#">Descrever a peça no WhatsApp</a></div>';
    var dyn = $("[data-zap-dyn]", grade);
    if (dyn) { dyn.href = zap("Olá, Torccol! Procuro uma peça que não achei no catálogo: " + termo); dyn.target = "_blank"; }
  }

  abas.addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    filtro = b.getAttribute("data-f");
    $$(".chip", abas).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
    history.replaceState(null, "", filtro === "todos" ? location.pathname : "#" + filtro);
    desenhar();
  });
  $("#busca").addEventListener("input", function (e) { termo = e.target.value; desenhar(); });

  /* Ficha */
  var ficha = $("#ficha"), atual = null;
  function abrir(slug) {
    var p = T.produtos.filter(function (x) { return x.slug === slug; })[0]; if (!p) return;
    atual = p;
    $("#f-img").src = IMG + p.img + ".webp";
    $("#f-img").alt = p.nome;
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
    if (!ficha.open) ficha.showModal();
    ficha.scrollTop = 0;
    history.replaceState(null, "", "#peca-" + p.slug);
  }
  function atualizarBotaoLista() {
    var b = $("#f-lista"), dentro = lista.indexOf(atual.slug) > -1;
    b.textContent = dentro ? "Tirar da cotação" : "Adicionar à cotação";
  }
  grade.addEventListener("click", function (e) { var b = e.target.closest(".item"); if (b) abrir(b.getAttribute("data-slug")); });
  $("#f-rel").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) abrir(b.getAttribute("data-slug")); });
  $(".fechar", ficha).addEventListener("click", function () { ficha.close(); });
  ficha.addEventListener("click", function (e) { if (e.target === ficha) ficha.close(); });
  ficha.addEventListener("close", function () { history.replaceState(null, "", filtro === "todos" ? location.pathname : "#" + filtro); });

  /* Lista de cotação */
  var barra = $("#cotacao");
  function atualizarBarra() {
    barra.classList.toggle("ativa", lista.length > 0);
    document.body.classList.toggle("tem-cotacao", lista.length > 0);
    $("#c-qtd").textContent = lista.length + (lista.length === 1 ? " peça" : " peças");
    var nomes = lista.map(function (s) { return T.produtos.filter(function (p) { return p.slug === s; })[0]; }).filter(Boolean)
      .map(function (p) { return "• " + p.nome; });
    $("#c-enviar").href = zap("Olá, Torccol! Quero orçamento destas peças do catálogo:\n" + nomes.join("\n") + "\n\nMedidas e quantidades: ");
  }
  $("#f-lista").addEventListener("click", function () {
    var i = lista.indexOf(atual.slug);
    if (i > -1) lista.splice(i, 1); else lista.push(atual.slug);
    salvar(); atualizarBotaoLista(); atualizarBarra(); desenhar();
  });
  $("#c-limpar").addEventListener("click", function () { lista = []; salvar(); atualizarBarra(); desenhar(); });

  /* Estado inicial pelo hash */
  var h = location.hash.slice(1);
  if (familia(h)) { filtro = h; $$(".chip", abas).forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-f") === h); }); }
  desenhar(); atualizarBarra();
  if (h.indexOf("peca-") === 0) abrir(h.slice(5));
})();
