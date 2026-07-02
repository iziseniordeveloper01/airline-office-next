import sanitizeHtml from 'sanitize-html'

export function cleanHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''
  return sanitizeHtml(dirty, {
    allowedTags: [
      'p','b','strong','i','em','u','s','a',
      'ul','ol','li','h2','h3','h4',
      'blockquote','table','thead','tbody','tr','td','th',
      'img','br','hr','iframe',
    ],
    allowedAttributes: {
      a:      ['href', 'target', 'rel'],
      img:    ['src', 'alt', 'width', 'height'],
      td:     ['colspan', 'rowspan'],
      th:     ['colspan', 'rowspan'],
      iframe: ['src', 'width', 'height', 'frameborder', 'loading', 'allowfullscreen', 'referrerpolicy', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // Embeds (maps, video, etc.) must be https — blocks javascript:/data: URIs in iframe src
    allowedSchemesByTag: { iframe: ['https'] },
  })
}
