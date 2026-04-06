# HelloTime.io Page Topology

## Global Layout
- Body > DIV (cookie consent overlay) > HEADER (sticky nav) > MAIN > 8 SECTIONS > FOOTER
- All sections: margin-bottom: 160px (except last: 0)
- Container: max-width 1160px, padding 0 40px, margin 0 auto
- Font: SF Pro Display (headings 700), SF Pro Text (body 400/500/600) → use Geist Sans
- Color: text #151619, muted #7F8491, border #C8CAD0/#E1E2E5, CTA bg #25272D
- No JS animation libraries. CSS transitions only (0.3s ease-in-out on hover).
- 3 autoplay/loop/muted videos

## Sections (top to bottom)
| # | Name | H font | Interaction | Height | Key elements |
|---|------|--------|-------------|--------|--------------|
| 0 | Hero | 80px/700/72px lh, center | static + video | 1286px | badge, h1, subtitle 24px/500, CTA 20px/700, video player, client logos |
| 1 | Features | 48px/700/48px lh, center | static | 1084px | h2, subtitle, illustration, 3 feature cards with images |
| 2 | Tracking | 48px/700/48px lh, center | click (People/Projects tabs) | 969px | h2, tab buttons, timeline screenshot |
| 3 | Costs | 48px/700/48px lh, center | static + 2 videos | 707px | h2, subtitle, 2 cards with videos |
| 4 | What is RP | 48px/700/48px lh, center | static | 562px | h2, 2-column comparison (PM vs RP), CTA |
| 5 | Testimonials | 48px/700/48px lh, center | static | 700px | h2, 4 testimonial cards with company logos |
| 6 | Playbook | 48px/700/48px lh, LEFT | static | 532px | h2, subtitle, playbook image, "Read our Playbook" link |
| 7 | Early Access | 48px/700/72px lh, center | static | 778px | h2, CTA, illustration, "Built by Moze" |

## Sticky Nav
- height: 71px, sticky top:0, z-index:100, bg white
- Links: Product, Pricing, Blog, About (16px/500, #363940)
- CTA: "Request access" outlined (16px/700, border #B0B3BB, 8px radius, 38px height)
