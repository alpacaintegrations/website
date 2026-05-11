const PATTERNS = [
  { id: 'niet-x-maar-y', regex: /\bNiet\s+\w+[^.,;]*,\s*maar\s+/gi },
  { id: 'korte-antwoord-opener', regex: /\bHet\s+korte\s+antwoord:/gi },
  { id: 'even-kort-opener', regex: /\bEven\s+kort\b/gi },
  { id: 'cruciale-punt-marker', regex: /\bHet\s+cruciale\s+punt:/gi },
  { id: 'em-dash', regex: /—/g },
  { id: 'en-dash', regex: /–/g }
];

export function findAiSignals(text) {
  const lines = text.split('\n');
  const signals = [];

  for (const { id, regex } of PATTERNS) {
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const matches = line.matchAll(new RegExp(regex.source, regex.flags));
      for (const match of matches) {
        signals.push({
          pattern: id,
          line: lineIdx + 1,
          excerpt: line.trim().slice(0, 120)
        });
      }
    }
  }

  return signals;
}

export function reportSignals(signals, filename) {
  if (signals.length === 0) {
    console.log(`  [ok] ${filename}: geen AI-signalen gevonden`);
    return;
  }
  console.log(`  [!] ${filename}: ${signals.length} AI-signaal-waarschuwing(en):`);
  for (const s of signals) {
    console.log(`      line ${s.line} [${s.pattern}]: ${s.excerpt}`);
  }
}
