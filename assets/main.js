/* 张敬 · 作品集 v2 交互
   只有三件事：星野（氛围）、打字机（一次性的开场）、月相（唯一的常驻动效）。
   prefers-reduced-motion 一律静态直出。 */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 星野 ---------- */
  var canvas = document.getElementById("starfield");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rafId = 0;

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var count = Math.min(110, Math.floor(w * h / 12000));
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.1 + 0.3,
          depth: Math.random() * 0.8 + 0.2,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.012 + 0.004
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var twinkle = reduced ? 0.7 : 0.55 + 0.45 * Math.sin(s.phase + t * s.speed);
        var alpha = (0.12 + s.depth * 0.34) * twinkle;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.r > 1.05
          ? "rgba(157, 140, 240, " + alpha.toFixed(3) + ")"
          : "rgba(240, 233, 216, " + alpha.toFixed(3) + ")";
        ctx.fill();
      }
      rafId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    if (reduced) {
      draw(0); cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(draw);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { cancelAnimationFrame(rafId); }
        else { rafId = requestAnimationFrame(draw); }
      });
    }
  }

  /* ---------- 打字机：首屏终端 ----------
     逐段逐字打出，段落间停一拍。开场只演一次。 */
  var term = document.getElementById("termtyping");
  if (term) {
    var LINES = [
      [{ c: "t-p", t: "$ " }, { c: "", t: "status --zhangjing" }],
      [{ c: "t-ok", t: "● " }, { c: "", t: "purple   " }, { c: "t-dim", t: " 校园制度问答 · 515 sessions" }],
      [{ c: "t-ok", t: "● " }, { c: "", t: "termify  " }, { c: "t-dim", t: " 字符动画工坊 · v1.2.0 online" }],
      [{ c: "t-ok", t: "● " }, { c: "t-moon", t: "moon     困了，还醒着" }]
    ];
    var caret = document.createElement("span");
    caret.className = "t-caret";
    caret.textContent = "▊";

    function renderAll() {
      LINES.forEach(function (segs) {
        segs.forEach(function (s) {
          var el = document.createElement("span");
          el.className = s.c;
          el.textContent = s.t;
          term.appendChild(el);
        });
        term.appendChild(document.createTextNode("\n"));
      });
      term.appendChild(caret);
    }

    if (reduced) {
      renderAll();
    } else {
      var li = 0, si = 0, ci = 0;
      var curSpan = null;
      function typeStep() {
        if (li >= LINES.length) return;
        var segs = LINES[li];
        if (si >= segs.length) {
          term.insertBefore(document.createTextNode("\n"), caret);
          li++; si = 0; ci = 0;
          setTimeout(typeStep, 260);
          return;
        }
        if (!curSpan || ci === 0) {
          curSpan = document.createElement("span");
          curSpan.className = segs[si].c;
          term.insertBefore(curSpan, caret);
        }
        curSpan.textContent = segs[si].t.slice(0, ++ci);
        if (ci >= segs[si].t.length) { si++; ci = 0; curSpan = null; }
        setTimeout(typeStep, segs[si] && segs[si].c ? 10 : 18 + Math.random() * 26);
      }
      term.appendChild(caret);
      setTimeout(typeStep, 700);
    }
  }

  /* ---------- 月相：随滚动走完一个周期 ----------
     0 新月 → 0.5 满月 → 1 残月。写进 CSS 变量，位移交给样式层。
     同时把天色从深夜推向黎明前——读完一整页，夜就过去了。 */
  var moonBtn = document.getElementById("moonphase");
  if (moonBtn) {
    moonBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
    if (reduced) {
      moonBtn.style.setProperty("--mp", 0.5); // 静置满月
    } else {
      // 天色两端：深夜蓝黑 → 黎明前的暖紫灰。变化刻意压得很小。
      var NIGHT = [14, 13, 22], DAWN = [31, 25, 43];
      function sky(p) {
        var c = NIGHT.map(function (n, i) {
          return Math.round(n + (DAWN[i] - n) * p);
        });
        document.body.style.backgroundColor = "rgb(" + c.join(",") + ")";
      }
      var ticking = false;
      function phase() {
        ticking = false;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
        moonBtn.style.setProperty("--mp", p.toFixed(4));
        moonBtn.classList.toggle("waning", p > 0.5);
        sky(p);
      }
      window.addEventListener("scroll", function () {
        if (!ticking) { ticking = true; requestAnimationFrame(phase); }
      }, { passive: true });
      phase();
    }
  }

  /* ---------- 显影入场：标题与信件段落，一次性 ---------- */
  var wipes = document.querySelectorAll("[data-wipe]");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -30px 0px" });
    wipes.forEach(function (el) { io.observe(el); });
  } else {
    wipes.forEach(function (el) { el.classList.add("is-in"); });
  }
})();
