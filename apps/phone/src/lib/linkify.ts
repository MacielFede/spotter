export type DescriptionSegment =
  | { type: 'text'; text: string }
  | { type: 'link'; text: string; href: string };

/**
 * Markdown-style `[label](url)` links or bare URLs (`https://…`, `www.…`).
 * Detection is at render time; nothing is stored (ADR 0021).
 */
const TOKEN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>()]+|www\.[^\s<>()]+)/gi;

/** Sentence punctuation directly after a bare URL is not part of the link. */
const TRAILING_PUNCTUATION = /[.,;:!?]+$/;

const hrefFor = (url: string): string => (url.startsWith('www.') ? `https://${url}` : url);

/**
 * Splits a free-text description into plain-text and link segments. Multiple
 * links of either style are supported, and a description that is only a URL
 * renders as a single link.
 */
export function linkifyDescription(description: string): DescriptionSegment[] {
  const segments: DescriptionSegment[] = [];
  let cursor = 0;
  TOKEN.lastIndex = 0;

  for (let match = TOKEN.exec(description); match; match = TOKEN.exec(description)) {
    const [full, markdownLabel, markdownHref, bareUrl] = match;
    const start = match.index;
    let text: string;
    let href: string;
    let end: number;

    if (markdownLabel !== undefined && markdownHref !== undefined) {
      text = markdownLabel;
      href = markdownHref;
      end = start + full.length;
    } else if (bareUrl !== undefined) {
      const trimmed = bareUrl.replace(TRAILING_PUNCTUATION, '');
      if (!trimmed) continue;
      text = trimmed;
      href = hrefFor(trimmed);
      end = start + trimmed.length;
      // Resume after the link, leaving trailing punctuation as plain text.
      TOKEN.lastIndex = end;
    } else {
      continue;
    }

    if (start > cursor) segments.push({ type: 'text', text: description.slice(cursor, start) });
    segments.push({ type: 'link', text, href });
    cursor = end;
  }

  if (cursor < description.length) {
    segments.push({ type: 'text', text: description.slice(cursor) });
  }

  return segments;
}
