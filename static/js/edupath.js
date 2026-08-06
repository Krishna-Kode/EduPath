/* ============================================================
   EduPath — Main JavaScript
   ============================================================ */

/* ── Dark-mode toggle ───────────────────────────────────────── */
(function () {
  const html     = document.documentElement;
  const btn      = document.getElementById('darkToggle');
  const icon     = document.getElementById('darkIcon');
  const STORAGE  = 'ep-theme';

  function applyTheme(theme) {
    html.setAttribute('data-bs-theme', theme);
    if (icon) {
      icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars';
    }
    localStorage.setItem(STORAGE, theme);
  }

  // Restore saved preference
  const saved = localStorage.getItem(STORAGE)
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(saved);

  if (btn) {
    btn.addEventListener('click', () => {
      applyTheme(html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark');
    });
  }
})();


/* ── Chat module ────────────────────────────────────────────── */
(function () {
  const chatBody  = document.getElementById('ep-chat-body');
  const chatInput = document.getElementById('ep-chat-input');
  const sendBtn   = document.getElementById('ep-send-btn');
  const startBtn  = document.getElementById('ep-start-btn');
  const statusEl  = document.getElementById('ep-chat-status');

  if (!chatBody) return;  // Not on chat page

  let sessionActive = false;

  /* ── helpers ── */
  function setStatus(msg, type = 'info') {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = `ep-chat-status text-${type} small ms-2`;
  }

  function scrollBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function appendBubble(text, role) {
    const div = document.createElement('div');
    div.className = `ep-bubble ep-bubble-${role}`;
    div.textContent = text;
    chatBody.appendChild(div);
    scrollBottom();
    return div;
  }

  function showTyping() {
    const wrap = document.createElement('div');
    wrap.id = 'ep-typing';
    wrap.className = 'ep-bubble ep-bubble-bot ep-bubble-typing';
    wrap.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(wrap);
    scrollBottom();
  }

  function hideTyping() {
    const el = document.getElementById('ep-typing');
    if (el) el.remove();
  }

  function setInputEnabled(enabled) {
    if (chatInput) chatInput.disabled = !enabled;
    if (sendBtn)   sendBtn.disabled   = !enabled;
  }

  /* ── Start session ── */
  async function startSession() {
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Connecting…';
    }
    setStatus('Connecting to EduPath AI…', 'muted');
    try {
      const res  = await fetch('/api/chat/start', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      sessionActive = true;
      setStatus('● Connected', 'success');
      setInputEnabled(true);
      if (startBtn) startBtn.closest('.ep-start-row')?.remove();
      appendBubble(
        'Hello! I\'m EduPath AI, your personal career and study guide. How can I help you today?',
        'bot'
      );
    } catch (err) {
      setStatus('Connection failed: ' + err.message, 'danger');
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="bi bi-play-circle"></i> Start Conversation';
      }
    }
  }

  /* ── Send message ── */
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || !sessionActive) return;
    chatInput.value = '';
    appendBubble(text, 'user');
    setInputEnabled(false);
    showTyping();

    try {
      const res  = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      hideTyping();
      if (data.error) {
        appendBubble('Sorry, something went wrong: ' + data.error, 'bot');
      } else {
        appendBubble(data.reply, 'bot');
      }
    } catch (err) {
      hideTyping();
      appendBubble('Network error. Please try again.', 'bot');
    } finally {
      setInputEnabled(true);
      chatInput.focus();
    }
  }

  /* ── Event listeners ── */
  if (startBtn) startBtn.addEventListener('click', startSession);

  if (sendBtn)  sendBtn.addEventListener('click', sendMessage);

  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
})();


/* ── Roadmap loader ─────────────────────────────────────────── */
(function () {
  const container = document.getElementById('ep-roadmap-container');
  if (!container) return;

  fetch('/api/roadmap')
    .then(r => r.json())
    .then(data => {
      if (!data.phases) {
        container.innerHTML = '<p class="text-muted">Complete your profile to see a personalised roadmap.</p>';
        return;
      }
      let html = `<h5 class="ep-section-title mb-4">${data.title}</h5><div class="ep-timeline">`;
      data.phases.forEach(p => {
        const tasks = p.tasks.map(t => `<li>${t}</li>`).join('');
        html += `
          <div class="ep-timeline-item">
            <div class="ep-timeline-phase">${p.phase} <span class="text-ep-primary">— Months ${p.months}</span></div>
            <div class="ep-card p-3">
              <ul class="mb-0 ps-3">${tasks}</ul>
            </div>
          </div>`;
      });
      html += '</div>';
      container.innerHTML = html;
    })
    .catch(() => {
      container.innerHTML = '<p class="text-danger">Failed to load roadmap. Please try again.</p>';
    });
})();


/* ── Stream selection ───────────────────────────────────────── */
(function () {
  const cards = document.querySelectorAll('.ep-stream-card');
  const detail = document.getElementById('ep-stream-detail');
  if (!cards.length) return;

  const info = {
    Science: {
      careers: ['Medical Doctor', 'Software Engineer', 'Research Scientist', 'Data Analyst', 'Aerospace Engineer'],
      exams:   ['JEE Main/Advanced', 'NEET', 'BITSAT', 'VITEEE', 'NDA (PCM)'],
      skills:  ['Physics', 'Chemistry', 'Mathematics / Biology', 'Computer Science', 'Lab skills'],
      color:   '#3b6cf7',
    },
    Commerce: {
      careers: ['Chartered Accountant', 'Investment Banker', 'Entrepreneur', 'Financial Analyst', 'HR Manager'],
      exams:   ['CA Foundation', 'IPMAT', 'CUET', 'DU JAT', 'SET/SUAT'],
      skills:  ['Accounting', 'Economics', 'Business Studies', 'Statistics', 'English'],
      color:   '#198754',
    },
    Arts: {
      careers: ['IAS/IPS Officer', 'Lawyer', 'Journalist', 'Psychologist', 'UX Designer'],
      exams:   ['CLAT', 'NID / NIFT', 'UPSC CSE', 'IIMC Entrance', 'CUET Humanities'],
      skills:  ['History / Pol Sci', 'Geography', 'English', 'Psychology', 'Fine Arts'],
      color:   '#7c5cd8',
    },
  };

  function list(arr) {
    return arr.map(i => `<li class="mb-1">${i}</li>`).join('');
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const key = card.dataset.stream;
      const d   = info[key];
      if (!d || !detail) return;
      detail.innerHTML = `
        <div class="ep-card p-4 mt-4">
          <h5 class="fw-bold mb-3" style="color:${d.color}">${key} Stream — Deep Dive</h5>
          <div class="row g-4">
            <div class="col-md-4">
              <h6 class="text-ep-primary"><i class="bi bi-briefcase"></i> Career Options</h6>
              <ul class="ps-3">${list(d.careers)}</ul>
            </div>
            <div class="col-md-4">
              <h6 class="text-ep-primary"><i class="bi bi-pencil-square"></i> Key Exams</h6>
              <ul class="ps-3">${list(d.exams)}</ul>
            </div>
            <div class="col-md-4">
              <h6 class="text-ep-primary"><i class="bi bi-lightbulb"></i> Important Subjects</h6>
              <ul class="ps-3">${list(d.skills)}</ul>
            </div>
          </div>
          <a href="/profile" class="btn btn-sm mt-3" style="background:${d.color};color:#fff">
            <i class="bi bi-person-check"></i> Build My Profile for ${key}
          </a>
        </div>`;
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();


/* ── Animated progress bars on dashboard ────────────────────── */
(function () {
  const bars = document.querySelectorAll('.ep-progress-bar-anim');
  if (!bars.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const bar = e.target;
        bar.style.width = bar.dataset.width + '%';
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.2 });
  bars.forEach(b => { b.style.width = '0'; observer.observe(b); });
})();
