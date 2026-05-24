// Nav scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
});

// Mobile nav toggle
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

// Close mobile nav on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('navLinks').classList.remove('open');
  });
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => observer.observe(s));

// Language colors for GitHub repos
const langColors = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051',
  Go: '#00ADD8', Rust: '#dea584', Java: '#b07219',
  'Jupyter Notebook': '#DA5B0B', Markdown: '#083fa1',
};

// Fetch GitHub repos
async function loadRepos() {
  const grid = document.getElementById('repos-grid');
  try {
    const res = await fetch('https://api.github.com/users/goyalsandeep2k/repos?sort=updated&per_page=12');
    const repos = await res.json();
    if (!Array.isArray(repos) || repos.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);font-size:14px">No public repositories found.</p>';
      return;
    }
    grid.innerHTML = repos.map(repo => {
      const lang = repo.language || '';
      const color = langColors[lang] || '#8b949e';
      const desc = repo.description || 'No description provided.';
      const updated = new Date(repo.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      return `
        <a href="${repo.html_url}" target="_blank" class="repo-card" style="text-decoration:none;color:inherit">
          <div class="repo-card-top">
            <span class="repo-name">${repo.name}</span>
            <span class="repo-visibility">${repo.private ? 'Private' : 'Public'}</span>
          </div>
          <p class="repo-desc">${desc}</p>
          <div class="repo-meta">
            ${lang ? `<span class="repo-lang"><span class="lang-dot" style="background:${color}"></span>${lang}</span>` : ''}
            ${repo.stargazers_count > 0 ? `<span class="repo-lang">⭐ ${repo.stargazers_count}</span>` : ''}
            <span class="repo-lang" style="margin-left:auto">Updated ${updated}</span>
          </div>
        </a>`;
    }).join('');
  } catch (err) {
    grid.innerHTML = `
      <div class="repo-card" style="grid-column:1/-1">
        <div class="repo-card-top"><span class="repo-name">claude-skills</span><span class="repo-visibility">Public</span></div>
        <p class="repo-desc">Sandeep's Claude AI Skills built with the Anthropic Agent SDK</p>
        <div class="repo-meta"><span class="repo-lang"><span class="lang-dot" style="background:#e34c26"></span>HTML</span></div>
      </div>`;
  }
}

// Fetch podcast artwork via iTunes API
async function loadPodcastArtwork() {
  const podcasts = [
    { id: 'art-jre',     query: 'joe rogan experience',        fallback: '🎙️' },
    { id: 'art-tim',     query: 'tim ferriss show',            fallback: '⚡' },
    { id: 'art-jocko',  query: 'jocko willink podcast',       fallback: '🪖' },
    { id: 'art-mi',     query: 'master investor podcast',     fallback: '📈' },
    { id: 'art-lex',    query: 'lex fridman podcast',         fallback: '🤖' },
    { id: 'art-huberman', query: 'huberman lab podcast',      fallback: '🧠' },
    { id: 'art-doac',   query: 'diary of a ceo steven bartlett', fallback: '📓' },
    { id: 'art-foc',    query: 'fall of civilizations podcast', fallback: '🏛️' },
  ];

  for (const pod of podcasts) {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(pod.query)}&media=podcast&entity=podcast&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const artwork = data.results[0].artworkUrl600 || data.results[0].artworkUrl100;
        if (artwork) {
          const img = document.getElementById(pod.id);
          if (img) {
            img.src = artwork;
            img.classList.add('loaded');
            // hide fallback emoji
            const fallback = img.closest('.podcast-art-wrap')?.querySelector('.podcast-art-fallback');
            if (fallback) fallback.style.display = 'none';
          }
        }
      }
    } catch (e) {
      // fallback emoji stays visible
    }
  }
}

// Classify article tag from title/content
function getArticleTag(title) {
  const t = title.toLowerCase();
  if (t.includes('travel') || t.includes('japan') || t.includes('places') || t.includes('itinerary')) return 'Travel';
  if (t.includes('ai') || t.includes('genai') || t.includes('agent') || t.includes('claude') || t.includes('llm')) return 'AI';
  if (t.includes('tpm') || t.includes('program') || t.includes('smartsheet') || t.includes('sdlc') || t.includes('leadership')) return 'TPM';
  return 'Article';
}

// Extract first image from Medium HTML content
function extractThumb(content) {
  const m = content.match(/<img[^>]+src="([^"]+)"/);
  return m ? m[1] : null;
}

// Fallback emoji per tag
const tagEmoji = { Travel: '✈️', AI: '🤖', TPM: '📊', Article: '📝' };

async function loadBlog() {
  const grid = document.getElementById('blog-grid');
  try {
    const FEED = 'https://medium.com/feed/@goyalsandeep2k';
    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(FEED)}`);
    const text = await res.text();
    if (!text || !text.includes('<item>')) throw new Error('empty');

    const xml = new DOMParser().parseFromString(text, 'text/xml');
    const nodes = [...xml.querySelectorAll('item')].slice(0, 2);
    if (!nodes.length) throw new Error('no items');

    grid.innerHTML = nodes.map(el => {
      const title = el.querySelector('title')?.textContent || '';
      const guid  = el.querySelector('guid')?.textContent?.trim() || '';
      // Medium RSS: <link> is a text node between two tags — fall back to guid
      const linkEl = el.querySelector('link');
      const link = (linkEl?.nextSibling?.nodeValue || linkEl?.textContent || guid).trim();
      const pubDate = el.querySelector('pubDate')?.textContent || '';
      const encoded = el.getElementsByTagNameNS('http://purl.org/rss/1.0/modules/content/', 'encoded')[0]?.textContent || '';
      const description = el.querySelector('description')?.textContent || '';

      const tag     = getArticleTag(title);
      const thumb   = extractThumb(encoded);
      const date    = pubDate ? new Date(pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
      const excerpt = (description || encoded).replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim().slice(0, 150);
      const words   = encoded.replace(/<[^>]+>/g, '').split(/\s+/).length;
      const readTime = `${Math.max(1, Math.round(words / 200))} min read`;
      const thumbHtml = thumb
        ? `<div class="blog-card-thumb"><img src="${thumb}" alt="${title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'blog-thumb-fallback\\'>${tagEmoji[tag]}</div>'"></div>`
        : `<div class="blog-card-thumb"><div class="blog-thumb-fallback">${tagEmoji[tag]}</div></div>`;
      return `
        <a href="${link}" target="_blank" class="blog-card">
          ${thumbHtml}
          <div class="blog-card-body">
            <div class="blog-card-tag-row">
              <span class="blog-card-tag">${tag}</span>
              <span class="blog-card-readtime">⏱ ${readTime}</span>
            </div>
            <div class="blog-card-title">${title}</div>
            <div class="blog-card-excerpt">${excerpt}</div>
            <div class="blog-card-meta">
              <span>${date}</span>
              <span class="blog-card-read">Read on Medium →</span>
            </div>
          </div>
        </a>`;
    }).join('');
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--text-muted);font-size:14px;padding:16px 0">Could not load posts — <a href="https://medium.com/@goyalsandeep2k" target="_blank">view on Medium directly</a>.</p>`;
  }
}

loadRepos();
loadPodcastArtwork();
loadBlog();

// Visitor counter — persists in localStorage, starts at 250
(function () {
  const key = 'sg_visit_count';
  const lastKey = 'sg_last_visit';
  const today = new Date().toDateString();
  let count = parseInt(localStorage.getItem(key) || '0', 10);
  const lastVisit = localStorage.getItem(lastKey);
  if (!count || count < 250) count = 250;
  if (lastVisit !== today) {
    // New day: add a small random increment to simulate organic growth
    count += Math.floor(Math.random() * 3) + 1;
    localStorage.setItem(key, count);
    localStorage.setItem(lastKey, today);
  }
  const el = document.getElementById('visCount');
  if (el) el.textContent = count.toLocaleString();
})();

// Download a SKILL.md from GitHub raw URL
async function downloadSkill(url, filename, btn) {
  btn.textContent = '⏳ Downloading…';
  btn.classList.add('downloading');
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    btn.textContent = '✅ Downloaded!';
    setTimeout(() => {
      btn.textContent = '⬇ Install Skill';
      btn.classList.remove('downloading');
    }, 2500);
  } catch (e) {
    // Fallback: open raw file in new tab
    window.open(url, '_blank');
    btn.textContent = '⬇ Install Skill';
    btn.classList.remove('downloading');
  }
}
