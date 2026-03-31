const axios = require('axios');

/**
 * Search using DuckDuckGo Instant Answer API (no key required)
 * Falls back to a structured response if unavailable
 */
async function searchWeb(query) {
  try {
    // DuckDuckGo Instant Answers (free, no key)
    const res = await axios.get('https://api.duckduckgo.com/', {
      params: {
        q: query,
        format: 'json',
        no_html: 1,
        skip_disambig: 1,
        t: 'metatron-bot'
      },
      timeout: 8000
    });

    const data = res.data;
    const results = [];

    // Abstract (featured snippet)
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        snippet: data.AbstractText.slice(0, 300),
        url: data.AbstractURL || data.AbstractSource
      });
    }

    // Related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 60),
            snippet: topic.Text.slice(0, 200),
            url: topic.FirstURL
          });
        }
      }
    }

    if (results.length === 0) {
      // Fallback: provide Google search link
      return [{
        title: `Busca: ${query}`,
        snippet: 'Clique para ver os resultados completos no Google.',
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
      }, {
        title: `${query} — Wikipedia`,
        snippet: 'Consulte a Wikipedia para informações detalhadas.',
        url: `https://pt.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`
      }];
    }

    return results;
  } catch (e) {
    // Always return something useful
    return [{
      title: `Pesquisar: ${query}`,
      snippet: 'Erro ao buscar. Clique para pesquisar no Google.',
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`
    }];
  }
}

module.exports = { searchWeb };
