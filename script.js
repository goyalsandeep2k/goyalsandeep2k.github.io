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
    { id: 'art-jre',   query: 'joe rogan experience',  fallback: '🎙️' },
    { id: 'art-tim',   query: 'tim ferriss show',       fallback: '⚡' },
    { id: 'art-jocko', query: 'jocko willink podcast',  fallback: '🪖' },
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

loadRepos();
loadPodcastArtwork();
