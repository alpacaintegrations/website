const MAPPINGS = [
  { match: /complete gids/i, url: '/blog/sprintsubsidie-mkb-limburg-gids' },
  { match: /wel en niet in aanmerking|voorwaarden van de sprintsubsidie|de voorwaarden/i, url: '/blog/sprintsubsidie-voorwaarden-wat-komt-in-aanmerking' },
  { match: /ai implementeren|ai kunt implementeren|ai-project/i, url: '/blog/ai-implementeren-sprintsubsidie' },
  { match: /bedrijfsprocessen automatiseren|automatiseren met (de )?sprintsubsidie|automatisering zonder ai/i, url: '/blog/bedrijfsprocessen-automatiseren-sprintsubsidie' },
  { match: /beste processen|processen (om te automatiseren )?vindt/i, url: '/blog/beste-processen-automatiseren-bedrijf' },
  { match: /administratie van een zakelijke opleider|ander voorbeeldproject/i, url: '/blog/sprintsubsidie-voorbeeld-administratie-automatiseren' },
  { match: /klantenservice automatiseren met ai|voorbeeldproject: klantenservice/i, url: '/blog/sprintsubsidie-voorbeeld-klantenservice-ai' },
  { match: /stappenplan|aanvragen.*sprintsubsidie/i, url: '/blog/sprintsubsidie-aanvragen-stappenplan' },
  { match: /subsidie-assistent/i, url: '#chatbot' },
  { match: /plan een( vrijblijvend)? gesprek/i, url: 'https://outlook.office365.com/book/Alpacaintegrations1@alpacaintegrations.ai/' },
  { match: /ai quickscan/i, url: 'https://www.alpacaintegrations.ai/scorecard' }
];

const PLACEHOLDER_REGEX = /\[([^\]]+)\]\(link\)/g;

export function mapPlaceholderLinks(input) {
  return input.replace(PLACEHOLDER_REGEX, (full, anchorText) => {
    for (const { match, url } of MAPPINGS) {
      if (match.test(anchorText)) {
        return `[${anchorText}](${url})`;
      }
    }
    throw new Error(`unmapped placeholder link: [${anchorText}](link)`);
  });
}
