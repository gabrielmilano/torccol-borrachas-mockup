/* Herói com física: as peças caem, quicam e podem ser arrastadas. É borracha. */
(function () {
  var palco = document.getElementById("palco");
  var cv = document.getElementById("fisica");
  if (!palco || !cv || !window.Matter) return;

  var M = Matter;
  var fino = matchMedia("(pointer: fine)").matches;
  var PASTA = "src/img/pecas/";
  /* f = largura da peça em fração da largura do palco; q = quique */
  var PECAS = [
    { src: "esfera", forma: "c", w: 239, h: 240, f: .22, q: .8 },
    { src: "rotor-preto", forma: "c", w: 316, h: 270, f: .25 },
    { src: "bucha-verde", forma: "b", w: 283, h: 282, f: .19 },
    { src: "rolo-vermelho", forma: "b", w: 261, h: 240, f: .2 },
    { src: "ventosa-vermelha", forma: "b", w: 316, h: 159, f: .2 },
    { src: "estrela-amarela", forma: "c", w: 133, h: 133, f: .13 },
    { src: "roda-vermelha", forma: "b", w: 106, h: 116, f: .12 },
    { src: "rotor-vermelho", forma: "b", w: 304, h: 179, f: .21 },
    { src: "esfera-2", forma: "c", w: 142, h: 142, f: .12, q: .85 },
    { src: "roda-verde", forma: "b", w: 114, h: 135, f: .12 },
    { src: "banda-vermelha", forma: "b", w: 183, h: 127, f: .17 },
    { src: "estrela-verde", forma: "c", w: 93, h: 98, f: .1 },
    { src: "coxim", forma: "b", w: 153, h: 184, f: .11 },
    { src: "estrela-vermelha", forma: "c", w: 107, h: 99, f: .11 },
    { src: "bucha-amarela", forma: "b", w: 88, h: 181, f: .07 },
    { src: "roda-preta", forma: "b", w: 128, h: 91, f: .13 },
    { src: "anel-acoplamento", forma: "c", w: 107, h: 114, f: .11 }
  ];

  var eng, render, runner, corpos = [], timers = [], larguraMontada = 0, rodando = false;

  function montar() {
    var W = palco.clientWidth, H = palco.clientHeight;
    if (W < 60 || H < 60) return;
    larguraMontada = W;
    var esc = W < 520 ? 1.1 : 1.2;

    eng = M.Engine.create();
    eng.gravity.y = 1.15;
    render = M.Render.create({
      canvas: cv, engine: eng,
      options: { width: W, height: H, wireframes: false, background: "transparent", pixelRatio: Math.min(window.devicePixelRatio || 1, 2) }
    });

    var esp = 400, opts = { isStatic: true, render: { visible: false }, friction: .6 };
    var piso = H * .93;
    var inclin = 8.5 * Math.PI / 180;
    M.Composite.add(eng.world, [
      M.Bodies.rectangle(W / 2, piso + esp / 2, W * 3, esp, opts),
      /* parede esquerda inclinada como a borda da faixa do logo */
      M.Bodies.rectangle(W * .05 - esp / 2, H / 2, esp, H * 3, Object.assign({ angle: inclin }, opts)),
      M.Bodies.rectangle(W + esp / 2 - 2, H / 2, esp, H * 3, opts)
    ]);

    corpos = [];
    PECAS.forEach(function (p, i) {
      var largura = W * p.f * esc, s = largura / p.w, alto = p.h * s;
      var x = W * (.22 + Math.random() * .62), y = -alto - i * 40;
      var comum = {
        restitution: p.q || .55, friction: .35, frictionAir: .008, density: .002,
        angle: (Math.random() - .5) * 1.2,
        render: { sprite: { texture: PASTA + p.src + ".webp", xScale: s, yScale: s } }
      };
      var b = p.forma === "c"
        ? M.Bodies.circle(x, y, Math.min(largura, alto) / 2 * .94, comum)
        : M.Bodies.rectangle(x, y, largura * .92, alto * .9, Object.assign({ chamfer: { radius: Math.min(largura, alto) * .18 } }, comum));
      corpos.push(b);
      timers.push(setTimeout(function () {
        M.Composite.add(eng.world, b);
        M.Body.setAngularVelocity(b, (Math.random() - .5) * .2);
      }, 90 * i));
    });

    /* peça que escapar volta pelo alto */
    M.Events.on(eng, "afterUpdate", function () {
      corpos.forEach(function (b) {
        if (b.position.y > H + 300 || b.position.x < -300 || b.position.x > W + 300) {
          M.Body.setPosition(b, { x: W * (.3 + Math.random() * .5), y: -120 });
          M.Body.setVelocity(b, { x: 0, y: 0 });
        }
      });
    });

    if (fino) {
      var mouse = M.Mouse.create(cv);
      /* não sequestrar a rolagem da página */
      ["mousewheel", "DOMMouseScroll", "wheel"].forEach(function (ev) { cv.removeEventListener(ev, mouse.mousewheel); });
      var mc = M.MouseConstraint.create(eng, { mouse: mouse, constraint: { stiffness: .18, damping: .08, render: { visible: false } } });
      M.Composite.add(eng.world, mc);
      render.mouse = mouse;
      M.Events.on(mc, "startdrag", function () { palco.classList.add("pegando"); });
      M.Events.on(mc, "enddrag", function () { palco.classList.remove("pegando"); });
    }

    runner = M.Runner.create();
    rodar(true);
  }

  function rodar(on) {
    if (!runner || on === rodando) return;
    rodando = on;
    if (on) { M.Runner.run(runner, eng); M.Render.run(render); }
    else { M.Runner.stop(runner); M.Render.stop(render); }
  }

  function desmontar() {
    timers.forEach(clearTimeout); timers = [];
    if (!eng) return;
    rodar(false);
    M.Composite.clear(eng.world, false);
    M.Engine.clear(eng);
    render.textures = {};
    eng = render = runner = null;
  }

  /* toque/clique: sacode as peças perto do ponto */
  palco.addEventListener("pointerdown", function (e) {
    if (!eng) return;
    var r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    corpos.forEach(function (b) {
      var dx = b.position.x - px, dy = b.position.y - py, d = Math.sqrt(dx * dx + dy * dy);
      if (d < r.width * .45) {
        var k = (1 - d / (r.width * .45)) * .06 * b.mass;
        M.Body.applyForce(b, b.position, { x: (dx / (d || 1)) * k * .6, y: -k });
      }
    });
  }, { passive: true });

  /* pausa fora da tela */
  new IntersectionObserver(function (es) { rodar(es[0].isIntersecting); }, { threshold: 0 }).observe(palco);

  var t;
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(function () {
      if (Math.abs(palco.clientWidth - larguraMontada) > 40) { desmontar(); montar(); }
    }, 300);
  });

  function iniciar() {
    palco.classList.add("fisica-on");
    var dica = palco.querySelector(".dica span");
    if (dica) dica.textContent = fino ? "Arraste e jogue as peças." : "Toque para sacudir.";
    montar();
  }
  if (document.documentElement.classList.contains("com-intro")) {
    document.addEventListener("torccol:intro-fim", iniciar, { once: true });
  } else {
    iniciar();
  }
})();
