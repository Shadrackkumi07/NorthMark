// Shared by the static build and browser navigation to prevent schema drift.
export function pageSchema(site, page, trail, faqs = []) {
  const abs = (p) => `${site.url}${p}`;
  const url = abs(page.path);
  const org = {
    '@type': ['Organization', 'LocalBusiness'],
    '@id': `${site.url}/#org`,
    name: site.name,
    legalName: site.legalName,
    url: `${site.url}/`,
    logo: site.logo,
    image: site.ogImage,
    telephone: site.phone,
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.locality,
      addressRegion: site.region,
      addressCountry: site.country
    },
    areaServed: site.areaServed.map((c) => ({
      '@type': 'City',
      name: `${c.name}, ${c.region}`,
      sameAs: c.sameAs
    })),
    knowsAbout: site.knowsAbout,
    ...(site.sameAs.length ? { sameAs: site.sameAs } : {})
  };
  const graph = [
    org,
    {
      '@type': 'WebSite',
      '@id': `${site.url}/#website`,
      url: `${site.url}/`,
      name: site.name,
      publisher: { '@id': `${site.url}/#org` },
      inLanguage: 'en-US'
    },
    {
      '@type': page.path === '/about' ? 'AboutPage' : page.path === '/contact' ? 'ContactPage' : page.type === 'hub' ? 'CollectionPage' : page.type === 'faq' ? 'FAQPage' : 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      isPartOf: { '@id': `${site.url}/#website` },
      about: { '@id': `${site.url}/#org` },
      ...(page.path !== '/' ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
      primaryImageOfPage: { '@type': 'ImageObject', url: site.ogImage },
      ...(page.published ? { datePublished: page.published, dateModified: page.updated || page.published } : {}),
      inLanguage: 'en-US'
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: trail.map((t, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: t.name,
        item: abs(t.path)
      }))
    }
  ];
  if (['service', 'industry', 'location'].includes(page.type)) {
    graph.push({
      '@type': 'Service',
      '@id': `${url}#service`,
      name: page.serviceName || page.h1,
      serviceType: page.serviceType || page.primary,
      description: page.description,
      url,
      provider: { '@id': `${site.url}/#org` },
      areaServed: (page.areaServed || site.areaServed.map((c) => c.name)).map((name) => {
        const c = site.areaServed.find((a) => a.name === name);
        return { '@type': 'City', name: c ? `${c.name}, ${c.region}` : name };
      }),
      ...(page.audience ? { audience: { '@type': 'BusinessAudience', name: page.audience } } : {})
    });
  }
  if (page.type === 'guide') {
    graph.push({
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: page.h1,
      description: page.description,
      mainEntityOfPage: { '@id': `${url}#webpage` },
      author: { '@id': `${site.url}/#org` },
      publisher: { '@id': `${site.url}/#org` },
      image: site.ogImage,
      ...(page.published ? { datePublished: page.published, dateModified: page.updated || page.published } : {}),
      inLanguage: 'en-US'
    });
  }
  if (faqs.length) {
    const faqNode = {
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a.join(' ') }
      }))
    };
    if (page.type === 'faq') {
      Object.assign(graph[2], faqNode);
    } else {
      graph.push({ '@type': 'FAQPage', '@id': `${url}#faq`, isPartOf: { '@id': `${url}#webpage` }, ...faqNode });
    }
  }
  if (page.path === '/') graph.splice(3, 1);
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

