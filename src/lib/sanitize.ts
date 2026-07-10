import sanitizeHtml from 'sanitize-html'

// Hosts an editor may embed via <iframe> in rich content. Anything else is
// stripped by allowedIframeHostnames below — a wide-open "any https iframe"
// policy would let an editor embed arbitrary (potentially hostile) third-party
// pages into a public article.
const ALLOWED_IFRAME_HOSTS = [
  'www.google.com',        // Google Maps embeds
  'maps.google.com',
  'www.youtube.com',       // video
  'www.youtube-nocookie.com',
  'player.vimeo.com',
]

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
    // img src is same-origin (/api/images/..) or https; links may also be mailto/tel.
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    // Embeds (maps, video, etc.) must be https — blocks javascript:/data: URIs in iframe src
    allowedSchemesByTag: { iframe: ['https'] },
    // Only embed from the trusted host allowlist above.
    allowedIframeHostnames: ALLOWED_IFRAME_HOSTS,
    allowIframeRelativeUrls: false,
  })
}
