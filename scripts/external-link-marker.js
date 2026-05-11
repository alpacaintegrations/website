const ANCHOR_REGEX = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi;

function isExternal(href) {
  return /^(https?:|mailto:)/.test(href);
}

export function markExternalLinks(html) {
  return html.replace(ANCHOR_REGEX, (full, before, href, after) => {
    if (!isExternal(href)) return full;
    const combined = `${before} ${after}`;
    if (/target=/.test(combined)) return full;
    const trimmedBefore = before.trim();
    const beforeOut = trimmedBefore ? trimmedBefore + ' ' : '';
    const afterOut = after.trim() ? ' ' + after.trim() : '';
    return `<a ${beforeOut}href="${href}" target="_blank" rel="noopener"${afterOut}>`;
  });
}
