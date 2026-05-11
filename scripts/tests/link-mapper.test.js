import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mapPlaceholderLinks } from '../link-mapper.js';

describe('mapPlaceholderLinks', () => {
  test('vervangt link met "complete gids" naar pillar URL', () => {
    const input = 'Lees de [complete gids over de Sprintsubsidie MKB](link).';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/sprintsubsidie-mkb-limburg-gids'));
    assert.ok(!out.includes('](link)'));
  });

  test('vervangt link met "voorwaarden" naar voorwaarden blog', () => {
    const input = 'Bekijk [de voorwaarden van de Sprintsubsidie](link).';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/sprintsubsidie-voorwaarden-wat-komt-in-aanmerking'));
  });

  test('vervangt link met "AI implementeren" naar ai blog', () => {
    const input = '[hoe je AI kunt implementeren](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/ai-implementeren-sprintsubsidie'));
  });

  test('vervangt link met "bedrijfsprocessen automatiseren" naar automatisering blog', () => {
    const input = '[bedrijfsprocessen automatiseren met de Sprintsubsidie](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/bedrijfsprocessen-automatiseren-sprintsubsidie'));
  });

  test('vervangt link met "beste processen" naar processen blog', () => {
    const input = '[hoe je de beste processen vindt om te automatiseren](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/beste-processen-automatiseren-bedrijf'));
  });

  test('vervangt link met "administratie van een zakelijke opleider" naar tafelgasten', () => {
    const input = '[administratie van een zakelijke opleider automatiseren](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/sprintsubsidie-voorbeeld-administratie-automatiseren'));
  });

  test('vervangt link met "klantenservice automatiseren met AI" naar ecommerce', () => {
    const input = '[voorbeeldproject: klantenservice automatiseren met AI](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/sprintsubsidie-voorbeeld-klantenservice-ai'));
  });

  test('vervangt link met "stappenplan" naar aanvragen blog', () => {
    const input = '[stappenplan voor het aanvragen](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/blog/sprintsubsidie-aanvragen-stappenplan'));
  });

  test('vervangt subsidie-assistent naar chatbot-anchor', () => {
    const input = '[Stel je vraag aan onze subsidie-assistent](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('#chatbot'));
  });

  test('vervangt "plan een gesprek" naar Outlook booking', () => {
    const input = '[plan een vrijblijvend gesprek](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('outlook.office365.com/book/Alpacaintegrations1'));
  });

  test('vervangt "AI quickscan" naar scorecard', () => {
    const input = '[doe de AI quickscan](link)';
    const out = mapPlaceholderLinks(input);
    assert.ok(out.includes('/scorecard'));
  });

  test('laat reeds volledige URLs ongemoeid', () => {
    const input = '[RVO](https://www.rvo.nl/onderwerpen/mit)';
    const out = mapPlaceholderLinks(input);
    assert.equal(out, input);
  });

  test('flagt onbekende placeholder-link met fout', () => {
    const input = '[iets totaal onbekends en niet gemapt](link)';
    assert.throws(() => mapPlaceholderLinks(input), /unmapped placeholder/i);
  });
});
