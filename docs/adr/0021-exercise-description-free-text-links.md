# 21. Exercise description is free text with auto-detected links

Date: 2026-10-11

## Status

Accepted

## Context

The spec says an Exercise description "can be a link or a string", and a link should be tappable.

## Decision

The description is a **single free-text field**. The app **auto-detects** URLs (and markdown-style
links) at render time and makes them tappable; there is no stored `kind`. A description that is
just a URL renders as a tappable link; anything else renders as plain text.

## Consequences

- No extra schema field for link-ness; the Exercise stays `{ id, title, description }`.
- All three platforms need a small, consistent linkifier so links behave the same everywhere.
- Because it is free text, multiple links in one description are naturally supported.
