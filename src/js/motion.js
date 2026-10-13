/* Movimento do site: intro, rolagem suave, revelações e cenas presas ao scroll.
   Estados iniciais são aplicados aqui (não no CSS): sem JS, o site fica estático e legível. */
(function () {
  var html = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  function fimIntro() {
    if (!html.classList.contains("com-intro")) return;
    html.classList.remove("com-intro");
    document.dispatchEvent(new Event("torccol:intro-fim"));
  }
  if (!window.gsap) { fimIntro(); return; }

  gsap.registerPlugin(ScrollTrigger);
  if (window.Flip) gsap.registerPlugin(Flip);
  window.TorccolMotion = { ativo: true };

  var reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = matchMedia("(pointer: fine)").matches;
  var mm = gsap.matchMedia();

  /* ---------- Rolagem suave ---------- */
  var lenis = null;
  if (window.Lenis && fino && !reduz) {
    lenis = new Lenis({ lerp: .11, wheelMultiplier: 1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.TorccolMotion.lenis = lenis;
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href"); if (id.length < 2) return;
      var alvo = $(id); if (!alvo) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(alvo, { offset: -20, duration: 1.2 });
      else alvo.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", id);
    });
  });

  /* ---------- Cabeçalho que some ao descer ---------- */
  var topo = $(".topo");
  if (topo) {
    ScrollTrigger.create({
      start: 140, end: "max",
      onUpdate: function (s) { topo.classList.toggle("escondido", s.direction === 1 && s.scroll() > 400); topo.classList.toggle("rolado", s.scroll() > 10); }
    });
  }

  /* ---------- Quebra de título em palavras com máscara ---------- */
  function quebrar(el) {
    if (el.dataset.quebrado) return $$(".pal > span", el);
    el.dataset.quebrado = 1;
    var txt = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = txt.map(function (w) { return '<span class="pal" aria-hidden="true"><span>' + w + "</span></span>"; }).join(" ");
    return $$(".pal > span", el);
  }

  /* ---------- Intro + herói ---------- */
  var intro = $(".intro");
  var h1 = $(".heroi h1");
  var heroiTl = gsap.timeline({ paused: true });
  if (h1) {
    var pals = quebrar(h1);
    gsap.set(pals, { yPercent: 115 });
    gsap.set(".heroi [data-surge]", { y: 24, opacity: 0 });
    gsap.set(".palco .faixa", { xPercent: 40, opacity: 0 });
    heroiTl
      .to(".palco .faixa", { xPercent: 0, opacity: 1, duration: 1, ease: "expo.out" }, 0)
      .to(pals, { yPercent: 0, duration: 1, ease: "expo.out", stagger: .045 }, .05)
      .to(".heroi [data-surge]", { y: 0, opacity: 1, duration: .8, ease: "power3.out", stagger: .08 }, .45);
  }
  if (intro && html.classList.contains("com-intro")) {
    try { sessionStorage.setItem("torccol-intro", "1"); } catch (e) {}
    gsap.timeline({ onComplete: function () { intro.remove(); } })
      .fromTo(".intro-faixa", { clipPath: "polygon(0 0,0 0,0 100%,0 100%)" },
        { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", duration: .7, ease: "expo.inOut" })
      .from(".intro-faixa img", { scale: .8, opacity: 0, duration: .5, ease: "power3.out" }, "-=.25")
      .to(".intro", { clipPath: "polygon(0 0,100% 0,100% 0,0 0)", duration: .8, ease: "expo.inOut" }, "+=.25")
      .add(function () { fimIntro(); heroiTl.play(); }, "-=.45");
  } else {
    if (intro) intro.remove();
    fimIntro();
    heroiTl.play();
  }

  /* Herói: o palco sai devagar ao rolar */
  if ($(".heroi")) {
    gsap.to(".heroi-texto", { yPercent: -18, ease: "none", scrollTrigger: { trigger: ".heroi", start: "top top", end: "bottom top", scrub: true } });
  }

  /* ---------- Títulos de seção ---------- */
  $$("[data-titulo]").forEach(function (el) {
    var pals = quebrar(el);
    gsap.from(pals, { yPercent: 115, duration: .9, ease: "expo.out", stagger: .04, scrollTrigger: { trigger: el, start: "top 85%" } });
  });
  $$("[data-surge]:not(.heroi [data-surge])").forEach(function (el) {
    gsap.from(el, { y: 28, opacity: 0, duration: .8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  /* ---------- Contadores ---------- */
  $$("[data-conta]").forEach(function (el) {
    var fim = parseFloat(el.getAttribute("data-conta")), ini = parseFloat(el.getAttribute("data-de") || 0);
    var suf = el.getAttribute("data-suf") || "", milhar = el.hasAttribute("data-milhar");
    var o = { v: ini };
    var fmt = function (v) { v = Math.round(v); return (milhar ? v.toLocaleString("pt-BR") : v) + suf; };
    el.textContent = fmt(ini);
    gsap.to(o, { v: fim, duration: 1.8, ease: "power2.out", onUpdate: function () { el.textContent = fmt(o.v); },
      scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  /* ---------- Famílias: trilho horizontal preso ao scroll ---------- */
  var trilho = $("#trilho");
  if (trilho) {
    mm.add("(min-width: 921px)", function () {
      var dist = function () { return trilho.scrollWidth - window.innerWidth + 40; };
      var tw = gsap.to(trilho, {
        x: function () { return -dist(); }, ease: "none",
        scrollTrigger: { trigger: ".linhas", start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: .6, invalidateOnRefresh: true,
          onUpdate: function (s) { gsap.set(".linhas .progresso span", { scaleX: s.progress }); } }
      });
      $$(".painel-img img", trilho).forEach(function (img) {
        gsap.fromTo(img, { xPercent: 10, rotate: 4 }, { xPercent: -6, rotate: -3, ease: "none",
          scrollTrigger: { trigger: img.closest(".painel"), containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
      });
    });
  }

  /* ---------- Sob medida: barra de progresso dos passos ---------- */
  var passos = $(".passos");
  if (passos) {
    var lis = $$("li", passos);
    gsap.fromTo(".passos-barra span", { scaleY: 0 }, { scaleY: 1, ease: "none",
      scrollTrigger: { trigger: passos, start: "top 70%", end: "bottom 55%", scrub: true,
        onUpdate: function (s) { var n = Math.min(lis.length - 1, Math.floor(s.progress * lis.length)); lis.forEach(function (li, i) { li.classList.toggle("ativo", i <= n); }); } } });
    $$(".sob-fotos img").forEach(function (img, i) {
      gsap.fromTo(img, { clipPath: "polygon(14% 0,14% 0,0 100%,0 100%)" }, { clipPath: "polygon(14% 0,100% 0,86% 100%,0 100%)", duration: 1.2, ease: "expo.inOut", delay: i * .15,
        scrollTrigger: { trigger: ".sob-fotos", start: "top 75%" } });
    });
  }

  /* ---------- Segmentos: faixas que andam com o scroll ---------- */
  $$(".seg-linha").forEach(function (el) {
    var dir = parseFloat(el.getAttribute("data-dir"));
    gsap.fromTo(el, { xPercent: dir > 0 ? -30 : 0 }, { xPercent: dir > 0 ? 0 : -30, ease: "none",
      scrollTrigger: { trigger: ".segmentos", start: "top bottom", end: "bottom top", scrub: .4 } });
  });

  /* ---------- Fábrica: revelação inclinada + zoom interno ---------- */
  $$(".fabrica-grade figure").forEach(function (fig, i) {
    var img = $("img", fig);
    gsap.fromTo(fig, { clipPath: "polygon(0 0,0 0,0 100%,0 100%)" }, { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", duration: 1.1, ease: "expo.inOut", delay: (i % 3) * .1,
      scrollTrigger: { trigger: fig, start: "top 88%" } });
    if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1.02, ease: "none", scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- 100%: número preso ao scroll ---------- */
  var cem = $(".reuso .cem");
  if (cem) {
    var o = { v: 0 };
    gsap.to(o, { v: 100, ease: "none", onUpdate: function () { cem.textContent = Math.round(o.v) + "%"; },
      scrollTrigger: { trigger: ".reuso", start: "top 80%", end: "center 55%", scrub: .5 } });
    gsap.fromTo(cem, { scale: .7, rotate: -8.5 }, { scale: 1, rotate: 0, ease: "none", scrollTrigger: { trigger: ".reuso", start: "top 80%", end: "center 55%", scrub: .5 } });
  }

  /* ---------- Botões magnéticos ---------- */
  if (fino) {
    $$(".btn, .zap").forEach(function (b) {
      var xTo = gsap.quickTo(b, "x", { duration: .4, ease: "power3" }), yTo = gsap.quickTo(b, "y", { duration: .4, ease: "power3" });
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .25); yTo((e.clientY - r.top - r.height / 2) * .35);
      });
      b.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
    });
  }

  /* Recalcula posições quando as imagens terminarem de carregar */
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
