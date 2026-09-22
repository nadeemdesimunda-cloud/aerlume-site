const SITE = 'https://mintravo.com';
const SITE_NAME = 'Mintravo';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function nav(active) {
    const link = (href, label, key) =>
        `<a href="${href}"${active === key ? ' class="active"' : ''}>${label}</a>`;
    return `
    <nav class="topnav">
      <div class="wrap topnav-inner">
        <a class="brand" href="/">
          <span class="mark"><img src="/mintravo-mark.svg?v=7" alt=""></span>
          <span class="brand-word">Mintr<span class="color">avo</span></span>
        </a>
        <div class="navlinks">
          ${link('/', 'Search', 'home')}
          ${link('/blog', 'Blog', 'blog')}
          ${link('/about', 'About', 'about')}
          ${link('/contact', 'Contact', 'contact')}
        </div>
        <a class="navcta" href="/">Search trips</a>
      </div>
    </nav>`;
}

function footer() {
    return `
    <footer class="sitefooter">
      <div class="wrap">
        <div class="footgrid">
          <div>
            <div class="footbrand"><span class="mark"><img src="/mintravo-mark-reversed.svg?v=1" alt=""></span><span class="brand-word">Mintr<span class="color">avo</span></span></div>
            <p class="tag">The travel meta-search that scans flights, hotels, cars, and buses in one search. Find, compare, go.</p>
          </div>
          <div class="footcol"><h5>Company</h5><a href="/about">About</a><a href="/blog">Blog</a><a href="/contact">Contact</a><a href="/#explore">Explore</a></div>
          <div class="footcol"><h5>Support</h5><a href="/contact">Help &amp; contact</a><a href="/">Price alerts</a><a href="/">Status</a></div>
          <div class="footcol"><h5>Legal</h5><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/cookies">Cookies</a><a href="/affiliate-disclosure">Affiliate disclosure</a></div>
        </div>
        <div class="footbottom">
          <span>Mintravo is a meta-search. We earn affiliate commission when you book via our partners at no extra cost to you. Prices are live from partners and may change.</span>
          <span>© ${new Date().getFullYear()} Mintravo Travel</span>
        </div>
      </div>
    </footer>`;
}

function renderPage({ title, description, canonical, body, jsonLd, active, breadcrumbs }) {
    const safeTitle = escapeHtml(title);
    const safeDesc = escapeHtml(description);
    const crumbHtml = breadcrumbs
        ? `<div class="breadcrumbs">${breadcrumbs.map((c, i) =>
            i === breadcrumbs.length - 1
                ? escapeHtml(c.label)
                : `<a href="${c.href}">${escapeHtml(c.label)}</a> › `
        ).join('')}</div>`
        : '';

    const ldScripts = (jsonLd || []).map((obj) =>
        `<script type="application/ld+json">${JSON.stringify(obj)}</script>`
    ).join('\n');

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${safeDesc}">
<link rel="canonical" href="${canonical}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDesc}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDesc}">
<link rel="icon" href="/mintravo-mark.svg?v=7" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site-pages.css">
<title>${safeTitle}</title>
${ldScripts}
</head>
<body>
${nav(active)}
<main class="wrap">
  <header class="page-hero">
    ${crumbHtml}
    <h1>${safeTitle.replace(/ — Mintravo$/, '')}</h1>
  </header>
  ${body}
</main>
${footer()}
</body>
</html>`;
}

function renderBlogIndex(posts) {
    const cards = posts.map((post) => `
      <a class="blog-card" href="/blog/${post.slug}">
        <div class="cat">${escapeHtml(post.category)}</div>
        <h2>${escapeHtml(post.title)}</h2>
        <p>${escapeHtml(post.excerpt)}</p>
        <span class="read">Read article →</span>
      </a>`).join('');

    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Mintravo Travel Blog',
            url: `${SITE}/blog`,
            description: 'Travel tips, route guides, and money-saving advice from Mintravo.',
            publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
            ],
        },
    ];

    return renderPage({
        title: 'Travel Blog — Mintravo',
        description: 'Route guides, booking tips, and budget travel advice to help you plan smarter trips across Europe and beyond.',
        canonical: `${SITE}/blog`,
        active: 'blog',
        breadcrumbs: [{ href: '/', label: 'Home' }, { label: 'Blog' }],
        jsonLd,
        body: `
          <p class="lede">Practical guides for booking flights, trains, hotels, and cars — without opening ten tabs.</p>
          <div class="blog-grid">${cards}</div>`,
    });
}

function renderBlogPost(post) {
    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            dateModified: post.updated || post.date,
            author: { '@type': 'Organization', name: SITE_NAME },
            publisher: {
                '@type': 'Organization',
                name: SITE_NAME,
                url: SITE,
                logo: { '@type': 'ImageObject', url: `${SITE}/mintravo-mark.svg` },
            },
            mainEntityOfPage: `${SITE}/blog/${post.slug}`,
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
                { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE}/blog/${post.slug}` },
            ],
        },
    ];

    return renderPage({
        title: `${post.title} — Mintravo`,
        description: post.excerpt,
        canonical: `${SITE}/blog/${post.slug}`,
        active: 'blog',
        breadcrumbs: [
            { href: '/', label: 'Home' },
            { href: '/blog', label: 'Blog' },
            { label: post.title },
        ],
        jsonLd,
        body: `
          <div class="meta-row">
            <span class="meta-pill">${escapeHtml(post.category)}</span>
            <span class="meta-pill">${escapeHtml(post.date)}</span>
            <span class="meta-pill">${escapeHtml(post.readTime)} read</span>
          </div>
          <article class="prose">${post.content}</article>
          <p><a href="/blog">← Back to all articles</a></p>`,
    });
}

module.exports = { renderPage, renderBlogIndex, renderBlogPost, SITE, SITE_NAME };
