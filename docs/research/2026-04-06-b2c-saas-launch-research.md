# BreakIn B2C SaaS Launch Research
**Date:** 2026-04-06
**Product:** BreakIn — Job hunting automation for junior finance professionals
**Target:** Analysts & Associates seeking Private Credit, M&A, LevFin roles in Paris & London

---

## Table of Contents
1. [Waitlist & Newsletter Services](#1-waitlist--newsletter-services)
2. [SEO & Analytics Tools](#2-seo--analytics-tools)
3. [Growth Strategy — How Competitors Launched](#3-growth-strategy--how-competitors-launched)
4. [TikTok/Instagram Content Strategy](#4-tiktokinstagram-content-strategy)
5. [Content Creation Tools (AI-Powered)](#5-content-creation-tools-ai-powered)
6. [Raw Footage to Finished Content Pipeline](#6-raw-footage-to-finished-content-pipeline)
7. [Launch Playbook — Day by Day](#7-launch-playbook--day-by-day)

---

## 1. Waitlist & Newsletter Services

### Recommendation: **GetWaitlist + Loops.so** (or GetWaitlist + Beehiiv if you want built-in newsletter growth)

### Full Comparison

| Tool | Type | Referral System | Free Tier | Paid Starting | Embed Widget | Email Sequences | Best For |
|------|------|----------------|-----------|---------------|-------------|----------------|----------|
| **GetWaitlist** | Waitlist-only | Yes (leaderboard, position tracking) | 7-day trial only (free tier removed June 2025) | $15/mo (unlimited signups) | Yes (Webflow, Carrd, Notion, custom) | Basic (welcome, updates) | Viral waitlist with zero-code setup |
| **LaunchList** | Waitlist-only | Yes (leaderboard, rewards) | 100 submissions free | $19-$79 one-time payment | Yes | Basic | Budget-friendly, pay-once model |
| **Viral Loops** | Referral platform | Yes (most sophisticated — multi-level, viral coefficient tracking) | 14-day trial | $35/mo | Yes | Via integrations | Campaign-heavy referral programs |
| **KickoffLabs** | Waitlist + contests | Yes (gamification, fraud prevention) | Testing only | $19/mo | Yes (landing pages included) | Yes | Contests, giveaways, gamified launches |
| **Beehiiv** | Newsletter + waitlist | Yes (built-in referral program + recommendation network) | Free up to 2,500 subscribers | $43/mo (Scale) | Yes | Yes (full sequences) | Content-first startups, newsletter growth |
| **Loops.so** | Email for SaaS | Via API (build your own) | 1,000 contacts free | $49/mo (5K contacts) | Via API | Yes (loops = automated sequences) | Technical founders, API-first |
| **ConvertKit (Kit)** | Email marketing | No native referral (needs SparkLoop integration) | 1,000 subscribers free | $29/mo | Yes | Yes (full automation) | Solo creators, email-first |
| **Resend** | Transactional + broadcast email | No referral system | 1,000 contacts free | $40/mo (5K contacts) | Via API only | Basic broadcasts | Developers who want clean API email |
| **Waitwhile** | Physical queue management | No | N/A | N/A | N/A | N/A | NOT relevant (restaurants, clinics) |
| **Waitlist.me** | Physical queue management | No | N/A | N/A | N/A | N/A | NOT relevant (in-person queues) |

### Detailed Analysis of Top Picks

#### GetWaitlist — Best Pure Waitlist Tool
- **URL:** https://getwaitlist.com
- **Key strength:** Zero-code viral waitlist in minutes
- **Referral mechanics:** Users get unique referral links. Each successful referral moves them up the leaderboard. Leaderboard is customizable and embeddable.
- **API:** Full REST API for custom implementations
- **Integrations:** Zapier, webhooks, Mailchimp, ConvertKit
- **Analytics:** Signup sources, referral tracking, basic spam protection
- **Embed:** Copy-paste widget for Webflow, Carrd, Notion, or custom HTML
- **Pricing:** $15/mo after 7-day trial. Unlimited signups on all plans.
- **Verdict:** Best choice if your #1 goal is a viral waitlist with referral mechanics. No free tier is the downside, but $15/mo is cheap.

#### Beehiiv — Best Newsletter-First Platform with Built-in Referrals
- **URL:** https://www.beehiiv.com
- **Key strength:** Referral program + recommendation network + full newsletter platform
- **Referral mechanics:** Subscribers get unique links. You set custom rewards at milestone tiers (e.g., 3 referrals = PDF guide, 10 referrals = beta access, 25 referrals = lifetime discount). Tracks everything natively.
- **Free plan:** Up to 2,500 subscribers, unlimited sends, referral program included, Beehiiv branding
- **Paid plans:** Scale ($43/mo) removes branding, adds ad network, paid subscriptions. Max ($96/mo) adds priority support.
- **Growth engine:** Built-in recommendation network means other Beehiiv newsletters can recommend yours. This is passive growth.
- **Verdict:** If you plan to run a newsletter alongside the waitlist (recommended), Beehiiv is the best all-in-one. Free plan is generous. Referrals are native.

#### Loops.so — Best for Technical Founders
- **URL:** https://loops.so
- **Key strength:** Developer-friendly API, React Email templates, clean UX
- **Free plan:** 1,000 contacts, unlimited sends, Loops branding
- **Paid:** $49/mo for 5K contacts
- **Sequences:** "Loops" = automated email flows triggered by events (signup, referral, milestone)
- **API:** Modern REST API, React Email support, event-based triggers
- **Verdict:** Best if you want full control via API and plan to build custom waitlist logic. No native referral system — you'd build it yourself.

### My Recommendation for BreakIn

**Option A (Simplest):** GetWaitlist ($15/mo) for the viral waitlist + Beehiiv (free) for newsletter/email sequences.
- GetWaitlist handles referral mechanics, leaderboard, embed widget
- Beehiiv handles welcome sequences, update emails, launch announcement
- Connect via Zapier or webhooks

**Option B (Technical):** Build custom waitlist with Loops.so (free for first 1K)
- More control but more work
- Build referral tracking yourself
- Best if you want everything under one roof later

**Option C (All-in-one):** Just use Beehiiv (free)
- Use Beehiiv's referral program as the waitlist itself
- "Subscribe to get early access. Refer 3 friends to get beta access."
- Simplest setup, no integrations needed
- Downside: no position-tracking/leaderboard like GetWaitlist

---

## 2. SEO & Analytics Tools

### Analytics: Recommendation Matrix

| Tool | Privacy | Free Tier | Best For | GDPR Compliant | Cookie Banner Needed | API |
|------|---------|-----------|----------|----------------|---------------------|-----|
| **PostHog** | High (cookieless mode) | 1M events/mo, 5K session replays | Full product analytics (funnels, A/B tests, feature flags) | Yes (cookieless mode) | No (cookieless) | Yes (full API) |
| **Plausible** | Highest | No free tier (self-host only) | Lightweight traffic stats | Yes (EU-hosted) | No | Yes |
| **Vercel Analytics** | High | Free on Vercel Pro | Basic traffic data if already on Vercel | Yes | No | Limited |
| **Google Analytics** | Low | Free | Maximum feature set | Questionable in EU | Yes | Yes |

### Recommendation: **PostHog (free tier)**

PostHog is the clear winner for BreakIn:
- **Free tier is absurd:** 1M analytics events, 5K session replays, 1M feature flag requests, all free monthly
- **Product analytics:** Funnels, retention cohorts, user paths — critical for understanding conversion
- **Session replay:** Watch actual users interact with BreakIn, find UX issues
- **A/B testing:** Built-in experiments for testing pricing, onboarding flows, landing page variants
- **Feature flags:** Roll out features to segments (e.g., beta users only)
- **No cookie banner required** in cookieless mode (EU-compliant)
- **API-friendly:** Full API for an AI agent to query analytics data programmatically
- **Over 90% of companies use PostHog completely free**

**Add Plausible ($9/mo) later** if you want a separate, ultra-simple public-facing analytics dashboard for your landing page.

### SEO Automation — What an AI Agent Can Do

#### Fully Automatable via API/Agent:
1. **Meta tags generation:** Title, description, OG tags — can be templated and auto-generated per page
2. **Sitemap.xml:** Auto-regenerate on content changes, submit to Google Search Console API
3. **Structured data (Schema.org):** JSON-LD generation for Product, SoftwareApplication, FAQPage schemas
4. **robots.txt management**
5. **Internal linking optimization**
6. **Content optimization scoring** via tools like Frase.io or Clearscope API

#### Tools with APIs for Agent Automation:
| Tool | What It Does | API | Pricing |
|------|-------------|-----|---------|
| **Frase.io** | Content briefs, keyword research, SEO scoring, auto-publish with schema markup | Yes | From $15/mo |
| **Alli AI** | Deploy title tags, meta descriptions, schema at scale | Yes | From $249/mo (overkill for early stage) |
| **Google Search Console** | Track rankings, submit sitemaps, monitor indexing | Free API | Free |
| **Ahrefs API** | Backlink analysis, keyword research, site audit | Yes | From $99/mo |
| **Screaming Frog** | Technical SEO audit | CLI available | Free up to 500 URLs |

#### Recommended Agent-Friendly SEO Stack for BreakIn:
1. **Next.js built-in SEO:** generateMetadata(), sitemap.ts, robots.ts — all code-based, agent can modify
2. **Google Search Console API** (free) — agent monitors indexing, submits pages
3. **PostHog** (free) — agent tracks which pages convert
4. **Frase.io** ($15/mo) — agent generates SEO-optimized content briefs
5. **Schema.org JSON-LD** — agent generates structured data per page type

---

## 3. Growth Strategy — How Competitors Launched

### Cluely — The Viral Content Army Model

**Background:** Founded by Roy Lee, suspended from Columbia after posting a viral video using AI to land jobs at Amazon/Meta. Turned controversy into a brand: "Cheat on Everything."

**Growth Strategy:**
- **Content Army:** Hired 50+ content creators as paid interns. Each posted 4+ TikTok videos per day.
- **Clipper Army:** 700+ "clippers" whose job was to take Cluely content, chop it, repost across TikTok, YouTube Shorts, Instagram Reels
- **Volume Play:** 100 different videos → 1 goes viral → repost that video across 100 accounts → 20-30 go viral
- **Results in 6 weeks:**
  - 38M+ combined TikTok views
  - 220K+ new followers across all accounts
  - 1,500+ unpaid fan-made videos (organic UGC)
  - 11.4% engagement rate on TikTok
  - 5,800+ daily mentions at peak
- **Fundraising impact:** Social virality directly led to $15M Series A shortly after seed
- **Spending:** Reportedly invested $15M into TikTok content creation
- **Critical flaw:** No attribution tracking — couldn't tell which content drove actual conversions vs. just views

**Takeaways for BreakIn:**
- Volume matters enormously on short-form video. More posts = more chances to go viral.
- Controversy/boldness gets attention. BreakIn's angle: "The system is broken. 500 applications, zero responses. We fix that."
- Founder-led content is the cheapest version of this. You ARE the content army.
- Don't need 50 interns — but posting 1-2x/day consistently is critical.

### Teal — Product-Led Growth + Free Tool Strategy

**Background:** Launched November 2019 as a job search platform.

**Growth Strategy:**
- Built a completely free suite of tools: Chrome extension, LinkedIn Profile Review, Job Tracker, AI Resume Builder
- Let 85,000+ users get value for free before launching premium (Teal+)
- Product-led growth: free tools → users love it → word of mouth → premium upsell
- **Results:** 2M+ members, 100K+ paying customers
- **Fundraising:** $5M seed → $7.5M Series A
- **Key insight:** Give away genuine value for free. The free tool IS the marketing.

**Takeaways for BreakIn:**
- Offer a genuinely useful free tier or free tool (e.g., "Finance Interview Prep" or "Cold Email Generator")
- Free tool generates word-of-mouth and SEO traffic
- Convert to paid when users want automation/scale

### Simplify.jobs — Chrome Extension Distribution

**Growth Strategy:**
- Free Chrome extension that autofills job applications
- Distribution through Chrome Web Store (organic discovery)
- 75% success rate claim drives word-of-mouth
- Partnership with job boards and universities

**Takeaway:** Chrome extensions have built-in distribution via the Web Store. If BreakIn has a browser component, publish it.

### LazyApply — Controversial but Effective

**Growth Strategy:**
- Bold positioning: "We apply to jobs FOR you while you sleep"
- Polarizing — some love it, some hate it. Both generate discussion.
- Money-back guarantee (interview in 30 days or refund) reduces risk
- Pricing at $99 — high enough to signal value, low enough for desperate job seekers
- Heavy Reddit/forum presence in job hunting communities

**Takeaway:** Controversy drives organic conversation. A bold guarantee ("5 interviews in 30 days or your money back") is extremely powerful for conversion.

### Sonara — What NOT to Do

- Beta product with aggressive pricing ramp
- Reports of shutting down / instability
- Lesson: Don't scale pricing faster than value delivery

### Summary: What Works for Job Hunting SaaS

| Strategy | Effectiveness | Cost | Time to Results |
|----------|-------------|------|-----------------|
| TikTok content army (Cluely model) | Extremely high | High ($$$) | 1-6 weeks |
| Founder-led TikTok (budget version) | High | Free (time only) | 2-8 weeks |
| Free tool / freemium (Teal model) | Very high | Dev time | 2-6 months |
| Chrome extension (Simplify model) | High | Dev time | 1-3 months |
| Bold guarantee (LazyApply model) | High for conversion | Risk-based | Immediate |
| Reddit/community presence | Medium-high | Free (time only) | 2-4 weeks |
| Product Hunt launch | Medium | Free | 1 day spike |
| SEO/content marketing | High long-term | Time/content | 4-12 months |

### Best Growth Channels for Young Finance Professionals

| Channel | Why It Works | Content Type | Priority |
|---------|-------------|-------------|----------|
| **TikTok** | Finance professionals aged 22-28 are heavy TikTok users. #FinTok, #CareerTok are massive. Algorithm rewards new creators. | Screen recordings, day-in-the-life, tips, demos | #1 |
| **LinkedIn** | Where finance professionals live professionally. Build-in-public posts perform well. | Written posts, carousels, founder journey updates | #2 |
| **Instagram Reels** | Cross-post TikTok content. Visual platform where young professionals spend time. | Reposted TikToks, polished versions | #3 |
| **Twitter/X** | Build-in-public community. SaaS founders, indie hackers. Less finance audience. | Threads, metrics sharing, hot takes | #4 |
| **Reddit** | r/financialcareers, r/M&A, r/consulting — direct access to target users | Genuine help, not promotion. Value-first. | #5 |
| **YouTube Shorts** | Cross-post TikTok content for additional reach. Longer shelf life. | Reposted TikToks | #6 |

---

## 4. TikTok/Instagram Content Strategy

### The 3-Second Rule

**65% of viewer decisions happen in the first 3 seconds.** If you don't hook them, they scroll.

**45% of people who watch the first 3 seconds will watch for 30+ seconds.**

The #1 ranking signal on TikTok in 2026 is **completion rate**, not likes. A 30-second video with 80% watch time outranks a 60-second video with 40% watch time.

### Hook Formulas That Work for Finance Audience

#### Pattern Interrupt Hooks (Best for demos)
- "I automated my entire job search and got 5 interviews in a week"
- "This is what sending 200 cold emails in finance looks like"
- "POV: You just automated what takes analysts 40 hours"

#### Pain Point Hooks (Best for problem-aware audience)
- "You've sent 500 applications and heard nothing back. Here's why."
- "Every finance analyst in Paris is doing this wrong"
- "The cold email template that got me into Private Credit"
- "I was rejected from 47 firms. Then I built this."

#### Curiosity Gap Hooks
- "There's a tool finance recruiters don't want you to know about"
- "The biggest mistake junior bankers make when job hunting"
- "I found a way to skip the application black hole"

#### Social Proof Hooks
- "This tool helped 200 analysts land interviews last month"
- "3 users got PE offers using this exact workflow"

#### Founder Story Hooks (Most authentic for Ousmane)
- "I left LGT Capital Partners and couldn't find a job. So I built this."
- "After my Private Credit internship ended, I was stuck. Here's what I did."
- "I'm a finance professional who learned to code to solve my own problem"

### Optimal Video Structure (21-34 seconds)

```
[0-3s]  HOOK — Pattern interrupt or bold statement
[3-8s]  CONTEXT — Quick setup of the problem
[8-25s] VALUE — Show the product in action (screen recording)
[25-30s] CTA — "Link in bio" or "Comment BREAKIN for early access"
```

### Content Pillars (Rotate between these)

1. **Product Demos** (40% of content): Screen recordings showing BreakIn in action
   - "Watch me send 50 personalized cold emails in 2 minutes"
   - "This is how BreakIn finds every PE firm hiring in Paris"
   - Zoom into key features, use cursor highlights

2. **Finance Career Tips** (30% of content): Pure value, no product mention
   - "3 things I learned in Private Credit at LGT"
   - "How to write a cold email that actually gets replies"
   - "The networking mistake every analyst makes"
   - Builds authority and trust. Audience follows for value.

3. **Founder Journey / Build in Public** (20% of content): Relatable, authentic
   - "Day 47 of building a job hunting tool"
   - "I just hit 1,000 waitlist signups. Here's what's working."
   - "Showing my investor deck to my mom"
   - Behind-the-scenes of coding, designing, struggling

4. **Social Proof / Results** (10% of content): Testimonials and wins
   - "Another BreakIn user just landed an M&A role"
   - Screenshot DMs of users thanking you
   - Before/after stories

### Hashtag Strategy

**Use 3-5 hashtags per post. Mix broad + niche.**

Primary (always include 1-2):
- `#financecareers` `#financetok` `#careeradvice` `#jobsearch`

Niche (rotate, include 1-2):
- `#investmentbanking` `#privateequity` `#privatecredit` `#mergersandacquisitions`
- `#leveragedfinance` `#financeinternship` `#wallstreet` `#cityoflondon`
- `#analyststoassociate` `#ibrecruiting`

Growth (include 1):
- `#buildinpublic` `#startuplife` `#saas` `#techfounder`

### Posting Schedule

**Frequency:** 1-2 posts per day minimum. Consistency > quality at the start.

**Best times for European finance audience:**
- **Morning window:** 8:00-9:00 AM CET (commute time, pre-work scrolling)
- **Lunch window:** 12:00-1:00 PM CET
- **Evening window:** 6:00-8:00 PM CET (post-work, highest engagement)
- **Peak days:** Tuesday-Thursday for professional content, Saturday for casual/founder content

**Cross-posting strategy:**
1. Post on TikTok first (algorithm favors native content)
2. Wait 24 hours, download without watermark
3. Post same video on Instagram Reels
4. Post on YouTube Shorts
5. Extract key frame → LinkedIn carousel or written post

### Caption Strategy

**TikTok captions:** Short, punchy, with CTA
- "This is what job hunting should look like in 2026. Link in bio for early access."
- "Built this because I was tired of the application black hole. Who relates?"

**Instagram captions:** Slightly longer, more context
- Include a mini-story or tip
- End with a question to drive comments

**LinkedIn posts:** Full written content
- Write a 200-word post expanding on the video topic
- Include the video as a native upload
- Tag relevant people/companies

---

## 5. Content Creation Tools (AI-Powered)

### Video Editing — The Tool Landscape

| Tool | Type | Price | API/Automation | Best For |
|------|------|-------|---------------|----------|
| **FFmpeg** | CLI video processor | Free (open source) | Full CLI, scriptable | Cutting, merging, captions, transitions, format conversion |
| **Remotion** | Programmatic video (React) | Free for <4 employees | Full API, React components | Data-driven videos, batch generation, templates |
| **CapCut** | GUI video editor | Free | NO public API (as of 2026) | Manual editing only, no automation |
| **Shotstack** | Cloud video API | $150-300/100 videos | Full REST API | Cloud rendering at scale |
| **Creatomate** | Cloud video API | $200-999/mo | Full REST API | Template-based video generation |
| **JSON2Video** | Cloud video API | Pay per video | REST API + SDKs | JSON-to-video conversion |

### Key Finding: CapCut Has NO Public API

As of March 2026, CapCut does not offer a public API for automated video rendering. Their "Open Platform" only allows building plugins inside the editor. You cannot automate CapCut.

**This means: FFmpeg + Remotion is the automation stack.**

### Remotion — Programmatic Video with React

**URL:** https://www.remotion.dev

Remotion is the most powerful tool for automated video creation:
- Write video as React components (JSX + CSS)
- Each frame is rendered by Chromium, then encoded to MP4 via FFmpeg
- **Claude Code + Remotion:** Describe video in plain English → Claude generates React components → Remotion renders MP4
- **Real benchmark:** 50 personalized demo videos from 1 template in 15 minutes
- **Free** for individuals and teams with 3 or fewer employees
- **Remotion Lambda:** Cloud rendering at scale via AWS

**The Claude Code Video Toolkit** (https://github.com/digitalsamba/claude-code-video-toolkit):
- MIT-licensed, AI-native video production workspace
- Includes skills for: Remotion compositions, FFmpeg post-processing, Playwright screen recording, voiceover generation, music generation
- 13 slash commands: `/setup`, `/video`, `/scene-review`, `/design`, `/generate-voiceover`
- Costs ~$1-2/month after setup (uses Modal's $30/mo free compute tier)
- **This is the closest thing to "give Claude raw footage and get finished content"**

### FFmpeg — The Swiss Army Knife

FFmpeg can do everything needed for TikTok content:
- Cut/trim videos to exact timestamps
- Merge multiple clips
- Add text overlays and captions (burn-in subtitles from SRT/ASS files)
- Add zoom-in effects (crop + scale at specific timestamps)
- Add background music with automatic voice ducking
- Convert to vertical format (9:16)
- Add Ken Burns zoom/pan effects
- Add transitions between clips (40+ xfade types)
- Generate thumbnails from specific frames
- Adjust speed (speed ramps)

**Claude Code + FFmpeg:** There are MCP servers and skills specifically for this:
- `ffmpeg-cli` skill on FastMCP: Full video/audio processing via natural language
- Video Editor MCP server: Natural language → FFmpeg commands
- FFmpeg Transitions & Effects skill: 40+ xfade transition types

### Transcription & Captions

| Tool | Type | Price | Word-Level Timestamps | Output Formats |
|------|------|-------|----------------------|----------------|
| **Whisper (OpenAI)** | Open-source, local | Free | Yes (via whisper-timestamped/WhisperX) | SRT, VTT, JSON, ASS |
| **faster-whisper** | Optimized Whisper | Free | Yes | SRT, VTT, JSON |
| **WhisperX** | Whisper + alignment | Free | Yes (best accuracy) | SRT, VTT, JSON |
| **OpenAI Whisper API** | Cloud API | $0.006/min | Yes | SRT, VTT, JSON |
| **Deepgram** | Cloud API | $0.0043/min | Yes | SRT, VTT, JSON |

**Recommendation:** Use **WhisperX** locally (free, best word-level timestamps) or OpenAI Whisper API (cheap, cloud-based). Both generate SRT files that FFmpeg can burn into videos.

### Voiceover Generation

| Tool | Price | Voice Quality | Voice Cloning | API |
|------|-------|--------------|---------------|-----|
| **ElevenLabs** | Free (10 min/mo), Starter $5/mo (30 min), Creator $22/mo (100 min) | Best in class | Yes (Creator+ for professional) | Yes |
| **OpenAI TTS** | $0.015/1K chars | Very good | No | Yes |
| **Qwen3-TTS** | Free (open source) | Good | Yes | Local |
| **Fish.audio** | Free tier available | Good | Yes | Yes |

**Recommendation:** **ElevenLabs Starter ($5/mo)** for voiceover. 30 minutes/month is plenty for short-form content. Clone your own voice for authenticity.

### Thumbnail Generation

- **Claude Code + HTML/CSS:** Generate thumbnail as HTML, screenshot with Playwright
- **Remotion:** Render a single frame as PNG
- **Canva API:** Template-based, but requires paid plan for API
- **FFmpeg:** Extract specific frame from video as thumbnail

### Social Media Scheduling

| Tool | Free Tier | Paid From | Best For | API | TikTok Support |
|------|-----------|-----------|----------|-----|----------------|
| **Buffer** | 3 channels free | $6/mo/channel | Solopreneurs, simplicity | Yes | Yes |
| **Later** | N/A | $25/mo | Instagram-first, visual planning | Limited | Yes |
| **Hootsuite** | N/A | $99/mo | Teams, comprehensive analytics | Yes (150+ integrations) | Yes |
| **upload-post.com** | Unknown | Unknown | Multi-platform auto-publish | Yes | Yes (TikTok, IG, YT, FB, LinkedIn) |

**Recommendation:** **Buffer (free)** to start. 3 channels = TikTok + Instagram + LinkedIn. $6/mo per additional channel. Clean, simple, gets out of the way.

**Important limitation:** All scheduling tools rely on platform APIs. Some post types (carousels, collaborative posts) cannot be scheduled through third-party tools. TikTok scheduling has the most restrictions.

---

## 6. Raw Footage to Finished Content Pipeline

### The Realistic 2026 Pipeline

Here's what you can actually build today with Claude Code:

```
RAW SCREEN RECORDING (Loom/OBS/QuickTime)
          │
          ▼
    ┌─────────────┐
    │  STEP 1:    │  Whisper/WhisperX
    │  Transcribe │  → Full transcript with word-level timestamps
    └─────┬───────┘
          │
          ▼
    ┌─────────────┐
    │  STEP 2:    │  Claude (LLM)
    │  Write      │  → Script/voiceover text
    │  Script     │  → Identify key moments for cuts/zooms
    │             │  → Write captions for each platform
    └─────┬───────┘
          │
          ▼
    ┌─────────────┐
    │  STEP 3:    │  ElevenLabs API ($5/mo)
    │  Generate   │  → Voiceover audio from script
    │  Voiceover  │  → Cloned voice or stock voice
    └─────┬───────┘
          │
          ▼
    ┌─────────────┐
    │  STEP 4:    │  FFmpeg (free)
    │  Edit       │  → Cut to key moments
    │  Video      │  → Add zoom-ins on important UI elements
    │             │  → Add transitions between scenes
    │             │  → Overlay voiceover audio
    │             │  → Add background music with ducking
    │             │  → Burn in captions (from Whisper SRT)
    │             │  → Convert to 9:16 vertical
    │             │  → Output: 30-60 second TikTok-ready video
    └─────┬───────┘
          │
          ▼
    ┌─────────────┐
    │  STEP 5:    │  FFmpeg + Playwright
    │  Generate   │  → Extract best frame as thumbnail
    │  Thumbnail  │  → Or render HTML thumbnail via Playwright
    └─────┬───────┘
          │
          ▼
    ┌─────────────┐
    │  STEP 6:    │  Claude (LLM)
    │  Platform   │  → TikTok caption (short, hooks, hashtags)
    │  Captions   │  → Instagram caption (longer, story format)
    │             │  → LinkedIn post (professional, expanded)
    │             │  → YouTube Shorts description
    └─────┬───────┘
          │
          ▼
    ┌─────────────┐
    │  STEP 7:    │  Buffer API (free) or manual
    │  Schedule   │  → Schedule across platforms
    │  Posts      │  → Optimal times per platform
    └─────────────┘
```

### What Claude Code Can Do TODAY

Using the Claude Code Video Toolkit + FFmpeg skills:

1. **Transcribe raw recording** → Whisper generates transcript + timestamps
2. **Analyze transcript** → Claude identifies the best 30-second segment, writes a hook, suggests cut points
3. **Generate FFmpeg commands** → Claude writes precise FFmpeg commands for:
   - Cutting to the best segment
   - Adding zoom-ins (`crop` + `scale` filters at specific timestamps)
   - Adding text overlays for captions
   - Adding background music
   - Burning in animated subtitles
4. **Generate voiceover** → ElevenLabs API call with script text
5. **Merge everything** → FFmpeg combines screen recording + voiceover + captions + music
6. **Generate thumbnail** → FFmpeg extracts a frame, or Playwright screenshots an HTML design
7. **Write platform captions** → Claude writes optimized text for each platform

### What Still Requires Manual Work

- **Reviewing the final cut** — AI can't judge "feel" or "vibe" perfectly
- **Music selection** — Choosing trending sounds requires human judgment (or you use royalty-free library)
- **Uploading to TikTok** — No reliable automated TikTok upload (their API is restrictive)
- **Engaging with comments** — Must be manual for authenticity

### Alternative: n8n Workflow Automation

For a more visual, no-code pipeline, n8n.io offers pre-built workflow templates:
- "Automate video voiceover & subtitles with Whisper, OpenAI TTS & FFmpeg"
- "Transform long videos into viral shorts with AI"
- "Extract viral-worthy clips from YouTube videos with Gemini AI & FFmpeg"
- "Fully automated AI video generation & multi-platform publishing"

n8n is self-hosted (free) or cloud ($20/mo). Good if you want a visual workflow builder rather than pure code.

### Alternative: Remotion for Template-Based Videos

For recurring content formats (e.g., weekly "Top 5 Finance Jobs" or "Market Update"), Remotion is better than FFmpeg:
- Build a React template once
- Feed in new data (job listings, stats, metrics) as JSON
- Render unique videos automatically
- Batch produce 10+ variations in minutes

### Cost Breakdown for Full Pipeline

| Component | Monthly Cost |
|-----------|-------------|
| Whisper (local) | Free |
| ElevenLabs Starter | $5/mo |
| FFmpeg | Free |
| Claude Code (already have) | Included |
| Buffer (scheduling) | Free (3 channels) |
| Remotion | Free (<4 employees) |
| **Total** | **$5/mo** |

---

## 7. Launch Playbook — Day by Day

### Context
- Founder: Ousmane, young finance professional (Private Credit background at LGT Capital Partners)
- Authentic angle: "I built the tool I wished I had"
- Budget: $0 paid ads, organic only
- Timeline: 4 weeks pre-launch → Launch week → 4 weeks post-launch

---

### PRE-LAUNCH: WEEK 1 (T-28 days) — Foundation

**Monday: Set up infrastructure**
- [ ] Deploy landing page (Vercel, custom domain)
- [ ] Set up GetWaitlist ($15/mo) or Beehiiv (free) with referral program
- [ ] Embed waitlist widget on landing page
- [ ] Set up PostHog analytics (free) on landing page
- [ ] Set up Buffer (free) — connect TikTok, Instagram, LinkedIn

**Tuesday: Create accounts & profiles**
- [ ] Create TikTok account (@breakin.finance or @trybreakIn)
- [ ] Create Instagram account
- [ ] Optimize LinkedIn profile: "Building BreakIn — Job hunting automation for finance"
- [ ] Bio on all platforms: Clear value prop + "Join the waitlist" link

**Wednesday: Content batch — Film 7 videos**
- [ ] Video 1: "I left Private Credit at LGT and couldn't find a job. So I built this." (founder story)
- [ ] Video 2: "The cold email that got me 3 interviews" (pure value)
- [ ] Video 3: "What 500 rejected applications look like" (pain point)
- [ ] Video 4: First product demo — "Watch this find every PE firm hiring in Paris"
- [ ] Video 5: "Why your CV gets rejected in 6 seconds" (educational)
- [ ] Video 6: "I'm building a job hunting tool. Day 1." (build in public)
- [ ] Video 7: "The networking hack no one talks about in finance" (value)

**Thursday: Edit & prepare content**
- [ ] Edit all 7 videos using FFmpeg/CapCut (add captions, trim to 30s, add hooks)
- [ ] Write captions for each platform
- [ ] Create thumbnails
- [ ] Schedule in Buffer: 1 video/day for the first week

**Friday: Set up email sequences**
- [ ] Welcome email: "You're on the waitlist! Here's what BreakIn does..."
- [ ] Referral email (Day 2): "Move up the waitlist — share your unique link"
- [ ] Value email (Day 5): "3 cold email templates for finance roles" (give value while they wait)
- [ ] Update email (Day 14): "We're launching in 2 weeks. Here's what's new."

**Weekend: Community groundwork**
- [ ] Join Reddit communities: r/financialcareers, r/consulting, r/MBA, r/careeradvice
- [ ] Start being helpful (NO promotion yet — just answer questions genuinely)
- [ ] Join relevant Discord/Slack communities for finance professionals
- [ ] Identify 10-20 finance content creators on TikTok for future collaboration

---

### PRE-LAUNCH: WEEK 2 (T-21 days) — Build Audience

**Daily actions:**
- [ ] Post 1 TikTok/Reel per day (from Week 1 batch + new content)
- [ ] Post 1 LinkedIn text post per day (expand on video topics)
- [ ] Engage: Reply to EVERY comment within 1 hour. Comment on 20 other creators' posts.
- [ ] Track analytics: which hooks work? which topics resonate?

**Monday: Film new batch of 7 videos**
- Focus on what performed best in Week 1
- Include 2 product demos, 3 career tips, 2 founder journey

**Wednesday: LinkedIn deep dive**
- [ ] Write a "building in public" post: "I'm building BreakIn. Here's why."
- [ ] Include your story: internship ended, job market is broken, building the solution
- [ ] Tag former colleagues, classmates, professors
- [ ] Share waitlist link

**Thursday: Reddit value post**
- [ ] Write a genuinely helpful post on r/financialcareers (e.g., "I spent 6 months in Private Credit — AMA about breaking in")
- [ ] Do NOT mention BreakIn. Build credibility first.

**Friday: Email the list**
- [ ] Send update to waitlist: "500 people joined this week" (social proof)
- [ ] Include 1 useful tip + referral CTA

**Metric targets for end of Week 2:**
- 200+ waitlist signups
- 5K+ TikTok views across all posts
- 500+ LinkedIn post impressions

---

### PRE-LAUNCH: WEEK 3 (T-14 days) — Accelerate

**Monday: Film "controversy" content**
- [ ] "Unpopular opinion: The finance application process is designed to waste your time"
- [ ] "Why I think cold emailing works better than applying online"
- [ ] "The lie finance recruiters tell you about networking"
- Hot takes drive engagement. Be opinionated but genuine.

**Tuesday: Collaborate**
- [ ] DM 5 finance TikTok creators: "I'm building a job hunting tool for finance. Would love your feedback."
- [ ] Don't ask them to promote. Ask for feedback. If they like it, they'll share organically.
- [ ] Offer free lifetime access in exchange for a video review

**Wednesday: Submit to directories**
- [ ] BetaList (https://betalist.com) — submit for pre-launch listing
- [ ] Submit to Product Hunt "Upcoming" page
- [ ] Submit to SaaS directories: SaaSHub, AlternativeTo, etc.

**Thursday: Reddit strategic post**
- [ ] Post on r/SideProject or r/SaaS: "I'm a finance professional building a job hunting tool. Here's what I learned."
- [ ] Genuine, not promotional. Share the journey, mention the tool naturally.

**Friday: Content milestone**
- [ ] You should have 14+ videos published by now
- [ ] Analyze what's working: which hooks, topics, formats
- [ ] Double down on top-performing formats

**Metric targets for end of Week 3:**
- 500+ waitlist signups
- 20K+ total TikTok views
- 1 video with 5K+ views (early signal of viral potential)

---

### PRE-LAUNCH: WEEK 4 (T-7 days) — Hype Week

**Monday: Announce launch date**
- [ ] TikTok/Reel: "BreakIn launches in 7 days. Here's what it does." (best demo yet)
- [ ] LinkedIn post: Long-form story about why you built this
- [ ] Email to waitlist: "We launch next [day]. Here's how to get early access."

**Tuesday: Urgency content**
- [ ] "Only the top 100 on the waitlist get free beta access" (drives referrals)
- [ ] Show the waitlist leaderboard (screenshot) — social proof

**Wednesday: Behind the scenes**
- [ ] "5 days until launch. Here's what I'm working on." (screen recording of final features)
- [ ] Raw, unpolished — shows you're a real builder

**Thursday: Testimonial content**
- [ ] If you have any beta testers, ask for video testimonials
- [ ] "This beta tester just used BreakIn to land 3 interviews"
- [ ] Even text DM screenshots work as social proof

**Friday: Pre-launch email**
- [ ] Email to entire waitlist: "We launch Monday. Here's what to expect."
- [ ] Include: what they'll get, when, how to access
- [ ] Final referral push: "Top 50 referrers get 3 months free"

**Weekend: Prepare launch assets**
- [ ] Film 3 launch-day videos (different angles)
- [ ] Write all social copy in advance
- [ ] Prepare Product Hunt listing (ship Tuesday)
- [ ] Draft launch emails (launch day + day after)

**Metric targets for end of Week 4:**
- 1,000+ waitlist signups
- 50K+ total TikTok views
- Growing daily: 50+ signups/day
- Email open rate > 40%

---

### LAUNCH WEEK

#### Launch Day (Monday)

**6:00 AM CET:**
- [ ] Send launch email to entire waitlist: "BreakIn is LIVE. Get access now."
- [ ] Activate the product (turn off waitlist gate for top referrers/beta users)

**8:00 AM CET:**
- [ ] Post TikTok #1: Best product demo video. Strong hook. "It's live."
- [ ] Post Instagram Reel: Same video
- [ ] Post LinkedIn: Long-form launch story + product link

**12:00 PM CET:**
- [ ] Post TikTok #2: Different angle. "Here's what happened when I launched BreakIn"
- [ ] Engage with every single comment and DM all day

**6:00 PM CET:**
- [ ] Post TikTok #3: Reaction video. "We just hit [X] signups in 12 hours"
- [ ] Email update to waitlist: "X people joined today. Here's what they're saying."

**All day:**
- [ ] Reply to every comment within 15 minutes
- [ ] DM everyone who comments with genuine engagement
- [ ] Share on Reddit (r/SideProject launch post)
- [ ] Share in all Discord/Slack communities you've been active in

#### Launch Day +1 (Tuesday)

- [ ] Submit to Product Hunt at 12:01 AM PST (Tuesday is optimal)
- [ ] Engage with all Product Hunt comments throughout the day
- [ ] Post TikTok: "We launched on Product Hunt. Here's how it's going."
- [ ] Email to list: "We're on Product Hunt! Would love your support."

#### Launch Day +2-5 (Wednesday-Saturday)

- [ ] Continue posting 1-2 TikToks daily
- [ ] Share metrics publicly: "Day 3: X signups, Y interviews landed"
- [ ] Address objections in content: "But does automated cold emailing actually work?"
- [ ] Create tutorial content: "How to set up BreakIn in 5 minutes"
- [ ] Collect and share user testimonials/DMs

---

### POST-LAUNCH: WEEKS 1-4

#### Week 1 Post-Launch: Momentum

- [ ] Continue 1 TikTok/day minimum
- [ ] Send weekly newsletter to all users + waitlist (product updates + career tips)
- [ ] Identify top 10 power users → ask for testimonials
- [ ] Monitor PostHog analytics: where do users drop off? What features get used?
- [ ] Fix top 3 UX issues based on session replays
- [ ] Post "Week 1 metrics" on LinkedIn (build in public)

#### Week 2: Optimize Conversion

- [ ] Analyze onboarding funnel in PostHog
- [ ] A/B test landing page headline
- [ ] Create "how to" content addressing common user questions
- [ ] Start SEO content: write 2 blog posts targeting "cold email templates for finance" and "how to break into private credit"
- [ ] Reach out to finance blogs/newsletters for features

#### Week 3: Referral Push

- [ ] Launch formal referral program within the product
- [ ] "Invite 3 friends, get 1 month free" or similar
- [ ] Create shareable content users can send to friends
- [ ] Post user success stories (with permission)

#### Week 4: Content System

- [ ] By now you have data on what content works
- [ ] Batch film 2 weeks of content in one session
- [ ] Set up the full automated pipeline (raw recording → edited video)
- [ ] Begin SEO strategy: target long-tail keywords
- [ ] Evaluate: what's working? Double down. What's not? Kill it.

---

### Key Organic Growth Channels (Ongoing, Post-Launch)

| Channel | Action | Frequency |
|---------|--------|-----------|
| **TikTok** | Post 1-2 videos/day, always with captions | Daily |
| **LinkedIn** | 1 written post + 1 video per day | Daily |
| **Instagram Reels** | Cross-post from TikTok | Daily |
| **YouTube Shorts** | Cross-post from TikTok | 3x/week |
| **Reddit** | Help in finance communities, mention tool when relevant | 3x/week |
| **Email newsletter** | Product updates + career tips | Weekly |
| **Blog/SEO** | Long-form posts targeting job search keywords | 2x/month |
| **Product Hunt** | Respond to all comments, update listing | As needed |
| **Indie Hackers** | Share journey, metrics, learnings | Weekly |
| **Hacker News** | Show HN post when product is polished | Once |

---

### Launch Timeline Summary

| Week | Focus | Key Metric Target |
|------|-------|-------------------|
| **T-28** | Foundation: landing page, waitlist, accounts, first 7 videos | Infrastructure live |
| **T-21** | Build audience: daily posting, LinkedIn push, community engagement | 200 waitlist signups |
| **T-14** | Accelerate: controversy content, collaborations, directory submissions | 500 waitlist signups |
| **T-7** | Hype: announce date, urgency, testimonials, prep launch assets | 1,000 waitlist signups |
| **Launch** | Go live: 3 TikToks, Product Hunt, email blast, full-court press | 500+ launch day signups |
| **L+1 week** | Momentum: daily content, user feedback, quick fixes | First paying users |
| **L+2 weeks** | Optimize: funnel analysis, A/B tests, SEO start | Conversion optimization |
| **L+3 weeks** | Referral: formal program, shareable content, success stories | Organic referral loop |
| **L+4 weeks** | System: batch content, automated pipeline, evaluate & iterate | Sustainable growth engine |

---

## Appendix A: Tool Costs Summary

| Tool | Purpose | Monthly Cost |
|------|---------|-------------|
| GetWaitlist | Viral waitlist | $15 |
| Beehiiv (free) | Newsletter + email sequences | $0 |
| PostHog (free) | Analytics, session replay, A/B tests | $0 |
| Buffer (free) | Social scheduling (3 channels) | $0 |
| ElevenLabs Starter | Voiceover generation | $5 |
| FFmpeg | Video editing | $0 |
| Remotion | Programmatic video | $0 |
| Whisper (local) | Transcription/captions | $0 |
| Vercel (hobby) | Hosting | $0 |
| **Total** | | **$20/mo** |

## Appendix B: Product Hunt Alternatives for Launch

| Platform | URL | Type | Traffic Potential |
|----------|-----|------|------------------|
| Product Hunt | producthunt.com | Tech/SaaS launch | 10K-80K visitors in 24h |
| BetaList | betalist.com | Pre-launch startups | 1K-5K visitors |
| Hacker News (Show HN) | news.ycombinator.com | Dev/tech community | 10K-80K visitors |
| Indie Hackers | indiehackers.com | Builder community | 500-2K visitors |
| Reddit (r/SideProject) | reddit.com/r/SideProject | Maker community | 500-5K visitors |
| Reddit (r/SaaS) | reddit.com/r/SaaS | SaaS founders | 500-2K visitors |
| SaaSHub | saashub.com | SaaS directory | SEO long-tail |
| AlternativeTo | alternativeto.net | Software alternatives | SEO long-tail |

## Appendix C: Competitive Landscape — Job Hunting Tools

| Tool | Pricing | Strategy Used | Users/Scale |
|------|---------|--------------|-------------|
| **Teal** | Freemium (Teal+ paid) | Free tools → word of mouth → premium | 2M+ members, 100K+ paid |
| **Simplify.jobs** | Free Chrome extension | Chrome Web Store distribution + partnerships | Large (exact unknown) |
| **LazyApply** | $99 | Bold positioning + guarantee + Reddit | Medium |
| **Cluely** | Paid | TikTok content army (50+ creators, 700+ clippers) | Massive social, $120M valuation |
| **Sonara** | Paid (aggressive tiers) | Limited/unstable | Declining |
| **JobCopilot** | Paid | SEO + comparison content | Medium |
| **LoopCV** | Freemium | SEO + alternative comparisons | Medium |

---

## Sources

### Waitlist & Newsletter
- [12 Best Waitlist Software & Tools in 2026](https://waitlister.me/growth-hub/guides/best-pre-launch-waitlist-tools)
- [Best Pre-Launch Waitlist Tools in 2026: Compared (DEV Community)](https://dev.to/tahseen_rahman/best-pre-launch-waitlist-tools-in-2026-compared-20pg)
- [The 7 Best Waitlist Tools for SaaS Launches in 2026](https://www.baitlist.com/blog/best-waitlist-tools-2026)
- [GetWaitlist Pricing](https://getwaitlist.com/pricing)
- [GetWaitlist Documentation](https://getwaitlist.com/docs)
- [Beehiiv Pricing](https://www.beehiiv.com/pricing)
- [Beehiiv Referral Program](https://www.beehiiv.com/features/referral-program)
- [Beehiiv vs Kit vs Mailchimp Comparison](https://almcorp.com/blog/beehiiv-vs-kit-vs-mailchimp-comparison/)
- [Loops.so Pricing](https://loops.so/pricing)
- [Loops.so Review 2026](https://encharge.io/loops-review/)
- [Resend Audiences](https://resend.com/features/audiences)
- [Resend Pricing](https://resend.com/pricing)

### Analytics & SEO
- [PostHog Pricing](https://posthog.com/pricing)
- [PostHog vs Plausible](https://posthog.com/blog/posthog-vs-plausible)
- [Solopreneur Analytics Stack 2026](https://f3fundit.com/the-solopreneur-analytics-stack-2026-posthog-vs-plausible-vs-fathom-analytics-and-why-you-should-ditch-google-analytics/)
- [PostHog vs Plausible vs Fathom vs Mixpanel 2026](https://devtoolpicks.com/blog/posthog-vs-plausible-vs-fathom-vs-mixpanel-2026)
- [Plausible Self-Hosted Analytics](https://plausible.io/self-hosted-web-analytics)
- [AI Agents for SEO (Frase.io)](https://www.frase.io/blog/ai-agents-for-seo)
- [Complete Guide to AI SEO Agents 2026](https://www.gomega.ai/blog/complete-guide-ai-seo-agents/)

### Growth Strategy & Competitors
- [The Cluely Story: $120M in 3 Months](https://cotrugli.org/cluely-startup-growth-strategy-viral-marketing-case-study/)
- [How Cluely Went Viral (viral.app)](https://viral.app/blog/insights/cluely-viral-strategy)
- [Cluely's $15M TikTok Bet (Pavilion)](https://www.joinpavilion.com/blog/what-cluelys-15m-tiktok-bet-reveals-about-the-future-of-b2b-growth)
- [Cluely UGC Strategy (Startup Spells)](https://startupspells.com/p/cluely-ai-cheat-on-everything-ugc-viral-marketing-strategy)
- [Teal Raises Seed Round (PR Newswire)](https://www.prnewswire.com/news-releases/teal-raises-seed-round-to-champion-career-growth-and-optimize-the-job-search-301562394.html)
- [Teal $5M Funding (TechCrunch)](https://techcrunch.com/2020/07/08/tealhq-with-5-million-in-funding-looks-to-help-people-land-a-job/)
- [Teal $7.5M Series A (Refresh Miami)](https://refreshmiami.com/news/teal-raises-7-5m-to-expand-ai-powered-career-platform/)

### TikTok & Content Strategy
- [Short-Form Video Mastery 2026 (ALM Corp)](https://almcorp.com/blog/short-form-video-mastery-tiktok-reels-youtube-shorts-2026/)
- [TikTok Content Strategy 2026 (InfluenceFlow)](https://influenceflow.io/resources/tiktok-content-strategy-and-planning-the-complete-2026-guide/)
- [TikTok Hook Formulas (OpusClip)](https://www.opus.pro/blog/tiktok-hook-formulas)
- [TikTok 3-Second Rule (2Point Agency)](https://www.2pointagency.com/glossary/tiktok-creative-best-practices-the-3-second-rule/)
- [Best Times to Post on TikTok 2026 (Sprout Social)](https://sproutsocial.com/insights/best-times-to-post-on-tiktok/)
- [Best Times to Post on TikTok Europe 2026](https://www.postpone.app/tools/best-time-to-post/tiktok/in/europe)
- [Best Time to Post TikTok — Buffer Data](https://buffer.com/resources/best-time-to-post-on-tiktok/)
- [Finance Hashtags for TikTok](https://www.edigitalagency.com.au/tiktok/top-10-finance-hashtags-tiktok/)
- [SaaS Marketing on TikTok](https://winsomemarketing.com/saas-marketing/saas-marketing-on-tiktok-b2b-strategies-for-the-creator-economy/)
- [TikTok Marketing for SaaS Companies (TokPortal)](https://www.tokportal.com/verticals/tiktok-marketing-saas-companies)

### Content Creation & Video Tools
- [Remotion — Make Videos Programmatically](https://www.remotion.dev/)
- [Remotion + Claude Code Video Creation 2026](https://popularaitools.ai/blog/remotion-claude-code-video-creation-2026)
- [Claude Code Video Toolkit (GitHub)](https://github.com/digitalsamba/claude-code-video-toolkit)
- [FFmpeg CLI Skill (FastMCP)](https://fastmcp.me/skills/details/1613/ffmpeg-cli)
- [Video Editor MCP Server](https://mcpservers.org/servers/Kush36Agrawal/Video_Editor_MCP)
- [CapCut API Status 2026 — No Public API](https://samautomation.work/capcut-api/)
- [n8n Automated Video Pipeline](https://n8n.io/workflows/9197-automate-video-voiceover-and-subtitles-with-whisper-openai-tts-and-ffmpeg/)
- [n8n Long-to-Short Video Workflow](https://n8n.io/workflows/9867-transform-long-videos-into-viral-shorts-with-ai-and-schedule-to-social-media-using-whisper-and-gemini/)
- [Whisper-timestamped (GitHub)](https://github.com/linto-ai/whisper-timestamped)
- [WhisperX (GitHub)](https://github.com/m-bain/whisperX)
- [faster-whisper (GitHub)](https://github.com/SYSTRAN/faster-whisper)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- [ElevenLabs API Pricing](https://elevenlabs.io/pricing/api)

### Launch Strategy
- [How to Launch a SaaS Product 2026 (eAmped)](https://www.eamped.com/how-to-launch-saas-product-2026/)
- [Product Hunt Alternatives 2026](https://launchdirectories.com/blog/product-hunt-alternatives-18-places-to-launch-in-2026)
- [How to Launch Your SaaS (AutoSaaSLaunch)](https://autosaaslaunch.com/blog/how-to-launch-your-saas)
- [SaaS Marketing Strategy 2026 (Arcade)](https://www.arcade.software/post/saas-marketing-strategy)
- [Building in Public for B2B SaaS](https://jonathanrintala.com/blog/how-to-build-in-public-b2b-saas/)

### Social Scheduling
- [Buffer vs Hootsuite vs Later Comparison](https://www.conbersa.ai/learn/social-media-scheduling-tools-comparison)
- [Best Social Media Schedulers 2026 (Eclincher)](https://www.eclincher.com/articles/12-best-social-media-schedulers-in-2026-features-and-pricing)
