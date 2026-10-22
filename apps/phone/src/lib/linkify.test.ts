import { describe, expect, it } from 'vitest';
import { linkifyDescription } from './linkify';

describe('Exercise description linkifier (issue #29)', () => {
  it('renders plain text as a single text segment', () => {
    expect(linkifyDescription('Bar to chest.')).toEqual([{ type: 'text', text: 'Bar to chest.' }]);
  });

  it('turns a lone URL into a link', () => {
    expect(linkifyDescription('https://example.com/form')).toEqual([
      { type: 'link', text: 'https://example.com/form', href: 'https://example.com/form' },
    ]);
  });

  it('handles text around a URL', () => {
    expect(linkifyDescription('Watch https://example.com/form closely.')).toEqual([
      { type: 'text', text: 'Watch ' },
      { type: 'link', text: 'https://example.com/form', href: 'https://example.com/form' },
      { type: 'text', text: ' closely.' },
    ]);
  });

  it('supports multiple links and both styles', () => {
    expect(
      linkifyDescription(
        'See [the guide](https://example.com/guide) and https://example.com/video',
      ),
    ).toEqual([
      { type: 'text', text: 'See ' },
      { type: 'link', text: 'the guide', href: 'https://example.com/guide' },
      { type: 'text', text: ' and ' },
      { type: 'link', text: 'https://example.com/video', href: 'https://example.com/video' },
    ]);
  });

  it('keeps punctuation outside bare links', () => {
    expect(linkifyDescription('Go to https://example.com/form, then rest.')).toEqual([
      { type: 'text', text: 'Go to ' },
      { type: 'link', text: 'https://example.com/form', href: 'https://example.com/form' },
      { type: 'text', text: ', then rest.' },
    ]);
  });

  it('normalizes www links to https', () => {
    expect(linkifyDescription('www.example.com')).toEqual([
      { type: 'link', text: 'www.example.com', href: 'https://www.example.com' },
    ]);
  });
});
