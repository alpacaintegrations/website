const SITE = 'https://alpacaintegrations.ai';
const RICK_LINKEDIN = 'https://www.linkedin.com/in/rickalpacaintegrations';

function wrap(obj) {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
}

function blogPosting(cfg) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: cfg.title,
    description: cfg.description,
    author: {
      '@type': 'Person',
      name: 'Rick',
      url: RICK_LINKEDIN
    },
    publisher: {
      '@type': 'Organization',
      name: 'Alpaca Integrations',
      url: SITE
    },
    datePublished: cfg.datePublished,
    dateModified: cfg.dateModified,
    image: `${SITE}/images/og/${cfg.ogImage}`,
    mainEntityOfPage: `${SITE}/blog/${cfg.slug}`
  };
}

function faqPage(faqItems) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  };
}

function howTo(name, steps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text
    }))
  };
}

export function generateSchemas(cfg) {
  const out = [wrap(blogPosting(cfg))];
  if (cfg.faqItems && cfg.faqItems.length > 0) {
    out.push(wrap(faqPage(cfg.faqItems)));
  }
  if (cfg.howToSteps && cfg.howToSteps.length > 0) {
    out.push(wrap(howTo(cfg.howToName || cfg.title, cfg.howToSteps)));
  }
  return out;
}
