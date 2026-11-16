(function () {
  'use strict';

  /* ---------- NeoSoft branding ---------- */
  function neosoftSign(slide) {
    if (slide.querySelector('.neosoft-sign')) return;
    var div = document.createElement('div');
    div.className = 'neosoft-sign';
    var span = document.createElement('span');
    span.textContent = 'NeoSoft · Formation IA & DevOps';
    div.appendChild(span);
    slide.appendChild(div);
  }
  function addNeoSoftBranding() {
    var slidesAll = document.querySelectorAll('main section.slide');
    if (slidesAll.length > 1) {
      neosoftSign(slidesAll[1]); // slide objectifs (après la couverture éventuelle)
      neosoftSign(slidesAll[slidesAll.length - 1]); // slide de synthèse
    }
    var foot = document.querySelector('footer.foot');
    if (foot && !foot.querySelector('.neosoft-foot')) {
      var s = document.createElement('span');
      s.className = 'neosoft-foot';
      s.textContent = 'NeoSoft';
      foot.appendChild(s);
    }
  }

  /* ---------- Mermaid ---------- */
  function renderMermaid() {
    if (!window.mermaid) return Promise.resolve();
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#eef2ff', primaryBorderColor: '#4f46e5', primaryTextColor: '#1e293b',
        lineColor: '#64748b', secondaryColor: '#ecfeff', tertiaryColor: '#f8fafc',
        fontFamily: 'Segoe UI, Inter, sans-serif', fontSize: '15px'
      }
    });
    return window.mermaid.run({ querySelector: '.mermaid' }).catch(function (e) { console.warn(e); });
  }

  /* ---------- Copy buttons on code blocks ---------- */
  function addCopyButtons() {
    document.querySelectorAll('pre, .prompt-box').forEach(function (block) {
      var btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copier';
      btn.addEventListener('click', function () {
        var text = block.innerText.replace(/^Copier\s*/, '').replace(/Copié !\s*$/, '');
        navigator.clipboard.writeText(text.replace(/Copier$/, '').trim()).then(function () {
          btn.textContent = 'Copié !';
          setTimeout(function () { btn.textContent = 'Copier'; }, 1500);
        });
      });
      if (getComputedStyle(block).position === 'static') block.style.position = 'relative';
      block.appendChild(btn);
    });
  }

  /* ---------- Quiz ---------- */
  function initQuiz() {
    var quizzes = document.querySelectorAll('.quiz');
    var scoreBox = document.querySelector('.score-box');
    var answered = 0, good = 0;
    function updateScore() {
      if (scoreBox) scoreBox.textContent = 'Score : ' + good + ' / ' + answered + ' répondues — ' + quizzes.length + ' questions au total';
    }
    quizzes.forEach(function (quiz) {
      var answer = parseInt(quiz.getAttribute('data-answer'), 10);
      var opts = quiz.querySelectorAll('.opt');
      opts.forEach(function (opt, idx) {
        opt.addEventListener('click', function () {
          if (quiz.classList.contains('answered')) return;
          quiz.classList.add('answered');
          answered++;
          if (idx === answer) good++;
          opts.forEach(function (o, j) {
            o.disabled = true;
            if (j === answer) o.classList.add('correct');
            else if (j === idx) o.classList.add('wrong');
          });
          updateScore();
        });
      });
    });
    var reset = document.querySelector('[data-reset-quiz]');
    if (reset) reset.addEventListener('click', function () { location.reload(); });
    updateScore();
  }

  /* ---------- Reading progress ---------- */
  function initProgress() {
    var bar = document.createElement('div');
    bar.className = 'progress';
    document.body.appendChild(bar);
    window.addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    });
  }

  /* ---------- Highlight current module in top bar ---------- */
  function highlightCurrent() {
    var path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.topbar a[href]').forEach(function (a) {
      if (a.getAttribute('href') === path) a.classList.add('active');
    });
  }

  /* ---------- Module title on first slide (presentation mode only) ---------- */
  function addModuleTitle() {
    var hero = document.querySelector('.hero');
    var first = document.querySelector('main section.slide');
    if (!hero || !first || first.querySelector('.module-title') || first.classList.contains('cover')) return;
    var h1 = hero.querySelector('h1');
    if (!h1) return;
    var div = document.createElement('div');
    div.className = 'module-title';
    var t = document.createElement('div');
    t.className = 'module-name';
    t.textContent = h1.textContent;
    div.appendChild(t);
    first.insertBefore(div, first.firstChild);
  }

  /* ---------- Presentation mode ---------- */
  var slides = [], current = 0, counter;
  function show(i) {
    if (!slides.length) return;
    current = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (s, j) { s.classList.toggle('active', j === current); });
    slides[current].scrollTop = 0;
    counter.textContent = (current + 1) + ' / ' + slides.length;
    history.replaceState(null, '', '#s' + (current + 1));
  }
  function togglePresent() {
    // Measure positions before hiding slides, otherwise every rect is empty.
    var visible = 0;
    if (!document.body.classList.contains('present')) {
      slides.forEach(function (s, j) {
        if (s.getBoundingClientRect().top < window.innerHeight / 2) visible = j;
      });
    }
    var on = document.body.classList.toggle('present');
    try { on ? sessionStorage.setItem('present', '1') : sessionStorage.removeItem('present'); } catch (err) {}
    if (on) {
      show(visible);
    } else {
      slides.forEach(function (s) { s.classList.remove('active'); });
      slides[current].scrollIntoView();
      history.replaceState(null, '', location.pathname);
    }
  }
  function toggleNotes() { document.body.classList.toggle('show-notes'); }

  /* ---------- Cross-page navigation (between parts) ---------- */
  function pageStep(dir) {
    var links = Array.prototype.slice.call(document.querySelectorAll('.topbar a[href]'))
      .map(function (a) { return a.getAttribute('href'); })
      .filter(function (h) { return /\.html$/.test(h); });
    var path = location.pathname.split('/').pop() || 'index.html';
    var idx = links.indexOf(path);
    if (idx === -1) return;
    var target = links[idx + dir];
    if (target) {
      try { sessionStorage.setItem('presentStart', dir > 0 ? 'first' : 'last'); } catch (err) {}
      location.href = target;
    }
  }

  function initPresentation() {
    slides = Array.prototype.slice.call(document.querySelectorAll('section.slide'));
    counter = document.createElement('div');
    counter.className = 'slide-counter';
    document.body.appendChild(counter);

    document.querySelectorAll('[data-action="present"]').forEach(function (b) { b.addEventListener('click', togglePresent); });
    document.querySelectorAll('[data-action="notes"]').forEach(function (b) { b.addEventListener('click', toggleNotes); });

    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      var k = e.key.toLowerCase();
      if (k === 'p') { togglePresent(); return; }
      if (k === 'n') { toggleNotes(); return; }
      if (!document.body.classList.contains('present')) return;
      if (k === 'arrowright' || k === 'pagedown' || k === ' ') {
        e.preventDefault();
        if (current >= slides.length - 1) pageStep(1); else show(current + 1);
      } else if (k === 'arrowleft' || k === 'pageup') {
        e.preventDefault();
        if (current <= 0) pageStep(-1); else show(current - 1);
      }
      else if (k === 'home') show(0);
      else if (k === 'end') show(slides.length - 1);
      else if (k === 'escape') togglePresent();
    });

    var m = location.hash.match(/^#s(\d+)$/);
    var keepPresent = false, start = 'first';
    try {
      keepPresent = sessionStorage.getItem('present') === '1';
      start = sessionStorage.getItem('presentStart') || 'first';
      sessionStorage.removeItem('presentStart');
    } catch (err) {}
    if (m && slides.length) {
      document.body.classList.add('present');
      show(parseInt(m[1], 10) - 1);
    } else if (keepPresent && slides.length) {
      document.body.classList.add('present');
      show(start === 'last' ? slides.length - 1 : 0);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    addCopyButtons();
    addNeoSoftBranding();
    addModuleTitle();
    highlightCurrent();
    initQuiz();
    initProgress();
    renderMermaid().then(initPresentation);
  });
})();
