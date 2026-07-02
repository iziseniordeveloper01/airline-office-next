import { Node, mergeAttributes } from '@tiptap/core'

// Lets editors embed maps, videos, etc. directly inside the content flow —
// sanitize.ts allows iframe tags with an https src to match.
export const Iframe = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: '100%' },
      height: { default: '450' },
    }
  },

  parseHTML() {
    return [{ tag: 'iframe' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['iframe', mergeAttributes(HTMLAttributes, {
      frameborder: '0',
      loading: 'lazy',
      allowfullscreen: 'true',
      referrerpolicy: 'no-referrer-when-downgrade',
    })]
  },
})
