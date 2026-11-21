/**
 * Utility to strip HTML tags and unescape HTML entities from Pronote rich text
 */
const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&#039;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&eacute;': 'é',
  '&Eacute;': 'É',
  '&egrave;': 'è',
  '&Egrave;': 'È',
  '&ecirc;': 'ê',
  '&Ecirc;': 'Ê',
  '&euml;': 'ë',
  '&Euml;': 'Ë',
  '&agrave;': 'à',
  '&Agrave;': 'À',
  '&acirc;': 'â',
  '&Acirc;': 'Â',
  '&auml;': 'ä',
  '&Auml;': 'Ä',
  '&icirc;': 'î',
  '&Icirc;': 'Î',
  '&iuml;': 'ï',
  '&Iuml;': 'Ï',
  '&ocirc;': 'ô',
  '&Ocirc;': 'Ô',
  '&ouml;': 'ö',
  '&Ouml;': 'Ö',
  '&ugrave;': 'ù',
  '&Ugrave;': 'Ù',
  '&ucirc;': 'û',
  '&Ucirc;': 'Û',
  '&uuml;': 'ü',
  '&Uuml;': 'Ü',
  '&ccedil;': 'ç',
  '&Ccedil;': 'Ç',
  '&oelig;': 'œ',
  '&OElig;': 'Œ',
  '&rsquo;': "'",
  '&lsquo;': "'",
  '&rdquo;': '"',
  '&ldquo;': '"',
  '&hellip;': '…',
  '&ndash;': '–',
  '&mdash;': '—',
  '&laquo;': '«',
  '&raquo;': '»',
  '&deg;': '°',
  '&euro;': '€',
};

export function cleanPronoteHtml(raw: string | null | undefined): string {
  if (!raw) return '';
  let text = String(raw);

  // 1. Replace line breaks and block separators
  text = text.replace(/<(br|BR)\s*\/?>/gi, '\n');
  text = text.replace(/<\/(div|p|li|h[1-6]|tr)>/gi, '\n');
  text = text.replace(/<(div|p|li|h[1-6]|tr)[^>]*>/gi, '');

  // 2. Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // 3. Decode named and numeric entities
  text = text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    if (HTML_ENTITIES[entity]) return HTML_ENTITIES[entity];

    // Hex entities &#x1F600;
    if (entity.startsWith('&#x') || entity.startsWith('&#X')) {
      const code = parseInt(entity.substring(3, entity.length - 1), 16);
      return !isNaN(code) ? String.fromCharCode(code) : entity;
    }

    // Decimal entities &#8217;
    if (entity.startsWith('&#')) {
      const code = parseInt(entity.substring(2, entity.length - 1), 10);
      return !isNaN(code) ? String.fromCharCode(code) : entity;
    }

    return entity;
  });

  // 4. Normalize whitespace and remove redundant blank lines
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l, i, arr) => l.length > 0 || (i > 0 && arr[i - 1].length > 0));

  return lines.join('\n').trim();
}
