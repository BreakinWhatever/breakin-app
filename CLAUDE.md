@AGENTS.md

# BreakIn — Agent Instructions

This is BreakIn, a cold emailing system for finance job hunting.
The app runs on http://localhost:3000.

## Running the Agent ("lance l'agent")

When the user says "lance l'agent", run the 3 phases below in order. Present results after each phase and wait for user validation before executing.

### Phase 1 — Sourcing (trouver de nouveaux contacts)

1. Fetch active campaigns:
   ```bash
   curl -s http://localhost:3000/api/campaigns
   ```
2. For each active campaign, search Apollo for matching contacts:
   ```bash
   curl -s -X POST http://localhost:3000/api/apollo/search \
     -H "Content-Type: application/json" \
     -d '{"title": "<targetRole>", "city": "<targetCity>", "sector": "Private Credit"}'
   ```
3. Present the results to the user: name, title, company, email
4. Ask: "Importer ces contacts ? (tous / selection / passer)"
5. If approved, import:
   ```bash
   curl -s -X POST http://localhost:3000/api/apollo/import \
     -H "Content-Type: application/json" \
     -d '{"contacts": [...], "campaignId": "<campaignId>"}'
   ```

### Phase 2 — Mails initiaux (pour les nouveaux contacts)

1. Fetch outreaches with status "identified" (contacts pas encore contactes):
   ```bash
   curl -s "http://localhost:3000/api/outreaches?status=identified"
   ```
2. For each, fetch the campaign's template:
   ```bash
   curl -s http://localhost:3000/api/templates/<templateId>
   ```
3. Generate a personalized initial email using the template + contact info:
   - Replace {firstName}, {companyName}, {role} with real values
   - Adapt the tone if needed (French for FR/CI, English for UK)
4. Post each draft:
   ```bash
   curl -s -X POST http://localhost:3000/api/emails \
     -H "Content-Type: application/json" \
     -d '{"outreachId": "<id>", "type": "initial", "subject": "<subject>", "body": "<body>"}'
   ```
5. Present all drafts to the user for validation

### Phase 3 — Relances (follow-ups pour les contacts deja contactes)

1. Fetch pending follow-ups:
   ```bash
   curl -s http://localhost:3000/api/agent/pending
   ```
2. For each pending outreach, generate a follow-up email draft:
   - Read the contact info, company, previous emails
   - Write a short (3-4 sentences), professional follow-up
   - Use French for France/Cote d'Ivoire contacts, English for UK contacts
   - Don't repeat the previous email word for word
   - Politely reference the initial outreach
   - Suggest a 15-minute call
3. Post each draft:
   ```bash
   curl -s -X POST http://localhost:3000/api/emails \
     -H "Content-Type: application/json" \
     -d '{"outreachId": "<id>", "type": "followup", "subject": "Re: <previous subject>", "body": "<draft body>"}'
   ```
4. Update the outreach:
   ```bash
   curl -s -X PUT http://localhost:3000/api/outreaches/<id> \
     -H "Content-Type: application/json" \
     -d '{"aiSuggestion": "Follow-up ready for review", "nextActionType": "followup_<n+1>"}'
   ```

### Resume final

Report back:
- Nouveaux contacts importes
- Mails initiaux generes
- Relances generees

The user then goes to the dashboard to approve/modify/ignore each draft before sending.

## API Reference

- `GET /api/agent/pending` — outreaches needing follow-up
- `GET /api/agent/suggestions` — draft emails pending approval
- `GET /api/contacts` — all contacts
- `GET /api/companies` — all companies
- `GET /api/campaigns` — all campaigns
- `GET /api/outreaches` — all outreaches
- `GET /api/emails` — all emails
- `GET /api/templates` — all templates
- `GET /api/settings` — app settings
- `POST /api/apollo/search` — search Apollo for contacts
- `POST /api/apollo/import` — import contacts from Apollo
- `POST /api/emails` — create email draft
- `POST /api/emails/:id/approve` — approve a draft
- `POST /api/emails/:id/send` — send an approved email
- `GET /api/offers` — all job offers (query: city, contractType, source, status, minScore, search, companyId)
- `GET /api/offers/:id` — single job offer
- `PUT /api/offers/:id` — update offer (status, matchScore, matchAnalysis, companyId)
- `POST /api/offers/import` — bulk import offers (deduplicates by URL)
- `POST /api/offers/:id/score` — set matchScore + matchAnalysis on an offer
- `GET /api/scrape-runs` — list scrape runs
- `POST /api/scrape-runs` — create a new scrape run
- `GET /api/cv` — current CV data
- `GET /api/applications` — all applications (query: status, source, search)
- `GET /api/applications/:id` — single application with offer, contact, coverLetter
- `POST /api/applications` — create application (required: companyName, role)
- `PUT /api/applications/:id` — update application fields
- `DELETE /api/applications/:id` — delete application (returns 204)
- `GET /api/cover-letters` — all cover letters with application count
- `POST /api/cover-letters` — create cover letter (required: title, body)
- `PUT /api/cover-letters/:id` — update cover letter (title, body, language)
- `POST /api/cover-letters/generate` — generate cover letter stub (accepts offerId, language)

## Scraping d'offres ("scrape les offres")

When the user says "scrape les offres", run the following phases in order.

### Phase 0 — Load company registry

Fetch all active companies with scraping config:
```bash
curl -s "http://localhost:3000/api/companies?active=true" \
  -H "Authorization: Bearer $BREAKIN_API_TOKEN"
```

Filter to companies where `atsType` is not null. Group by `atsType`.

---

### Phase 1 — Create ScrapeRun

```bash
curl -s -X POST http://localhost:3000/api/scrape-runs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BREAKIN_API_TOKEN" \
  -d '{"source": "registry"}'
```

Save the returned `id` as `scrapeRunId`.

---

### Phase 2 — Scrape per ATS type

For each company in the registry, call the appropriate handler:

#### Handler: workday
```
POST https://{atsConfig.tenant}.{atsConfig.wdServer}.myworkdayjobs.com/wday/cxs/{atsConfig.tenant}/{atsConfig.site}/jobs
Headers: Accept: application/json, Content-Type: application/json, Accept-Language: en-US, User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Body: { "appliedFacets": {}, "limit": 20, "offset": 0, "searchText": "" }
```
For each result in `jobPostings`, GET the detail:
```
GET https://{tenant}.{wdServer}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/job/{result.externalPath}
```

#### Handler: greenhouse
```
GET https://boards-api.greenhouse.io/v1/boards/{atsConfig.boardToken}/jobs?content=true
```

#### Handler: lever
```
GET https://api.lever.co/v0/postings/{atsConfig.slug}?mode=json
```
EU firms: `https://api.eu.lever.co/v0/postings/{slug}?mode=json`

#### Handler: smartrecruiters
```
GET https://api.smartrecruiters.com/v1/companies/{atsConfig.companyIdentifier}/postings
```

#### Handler: workable
```
GET https://apply.workable.com/api/v1/widget/accounts/{atsConfig.clientname}
```

#### Handler: ashby
```
GET https://api.ashbyhq.com/posting-api/job-board/{atsConfig.clientname}?includeCompensation=true
```

#### Handler: custom (Tavily)
Use the Tavily MCP tool with `{ query: atsConfig.query, max_results: 10 }`.
Parse the results to extract: title, company, url, description, postedAt.

---

### Phase 3 — Filter, normalize, import

For each result from all handlers:

**1. Filter** — reject if title or description contains these role keywords:
- IT: developer, software, engineer, data scientist, devops, infrastructure, cybersecurity
- Legal: lawyer, counsel, compliance (standalone), paralegal, notaire
- HR: human resources, talent acquisition, recruiter (unless it's a finance recruiter firm)
- Accounting: accountant, comptable, audit (standalone)
- Marketing: marketing, communication, brand

**2. Normalize** to:
```json
{
  "title": "...",
  "company": "company.name",
  "city": "company.city",
  "country": "company.country",
  "contractType": "CDI",
  "description": "...",
  "url": "...",
  "source": "company.atsType",
  "salary": null,
  "postedAt": null
}
```
contractType: infer from title + description ("alternance", "stage", "VIE", "CDD" → set accordingly, else "CDI").

**3. Import**:
```bash
curl -s -X POST http://localhost:3000/api/offers/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BREAKIN_API_TOKEN" \
  -d '{"offers": [...], "scrapeRunId": "<scrapeRunId>"}'
```

**4. Update lastScrapedAt** for each company:
```bash
curl -s -X PUT http://localhost:3000/api/companies/<company.id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BREAKIN_API_TOKEN" \
  -d '{"lastScrapedAt": "<ISO timestamp>"}'
```

---

### Phase 4 — Score new offers

**1. Fetch newly imported offers:**
```bash
curl -s "http://localhost:3000/api/offers?status=new" \
  -H "Authorization: Bearer $BREAKIN_API_TOKEN"
```

**2. Fetch CV:**
```bash
curl -s http://localhost:3000/api/cv \
  -H "Authorization: Bearer $BREAKIN_API_TOKEN"
```

**3. For each new offer, score 0-100 based on:**
- Role relevance (Private Credit > LevFin > M&A > Debt Advisory > TS > PE)
- Seniority match (Analyst/Associate preferred, not VP+ unless notable firm)
- City match (Paris = +10, London = +5, Dubai/Zurich/Geneva = +3)
- Firm tier (Tier 1 = +15, Tier 2 = +10, Tier 3 = +5)
- Contract type: CDI/VIE = +10, Stage/Alternance = +5 if match, CDD = neutral

```bash
curl -s -X POST http://localhost:3000/api/offers/<id>/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BREAKIN_API_TOKEN" \
  -d '{"score": <number>, "analysis": "<2-3 sentences>"}'
```

---

### Phase 5 — Report

Summarize:
- Companies scraped: X
- New offers imported: Y
- Duplicates skipped: Z
- Top 5 offers by score (title, company, city, score)

Send Telegram notification for any offer with score >= 85:
```
🔥 Nouvelle offre score {score}/100
{title} @ {company} ({city})
{url}
```

# sync-test
# manual-test
# test-1775492144
test
# final-test-1775492355
# test-1775492387
test-direct-1775492405
# triggered-1775492423
# trigger-final-1775492456
# debug-1775492480
# now-1775492873
# fix-test-1775492898

---

## Auto-Apply ("postule à cette offre" ou status apply_requested)

Triggered by:
- User says "postule à cette offre [URL ou ID]"
- Offer status = "apply_requested" (set by the web app when user clicks Postuler)

### Constants

```
BOT_TOKEN=8652954767:AAEIsaifAOZA5nBK8qbde1CgnOLHWQLH0LY
CHAT_ID=6232011371
APP_URL=http://localhost:3000
API_TOKEN=$BREAKIN_API_TOKEN
CV_FR=/root/breakin/Ousmane_Thienta_CV_FR.pdf
CV_EN=/root/breakin/Ousmane_Thienta_CV_EN.pdf
APPLY_LOG=/root/breakin/APPLY_LOG.md
```

### Helper: send Telegram

```bash
tg() {
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{\"chat_id\":\"${CHAT_ID}\",\"text\":\"$1\",\"parse_mode\":\"HTML\",\"disable_web_page_preview\":true}" > /dev/null
}
```

### Phase 0 — Load pending offers

```bash
curl -s "${APP_URL}/api/offers?status=apply_requested" \
  -H "Authorization: Bearer ${API_TOKEN}"
```

For each offer:

---

### Phase 1 — START notification

```
tg "🚀 <b>Candidature lancée</b>
<b>{title}</b> @ {company}
📍 {city}, {country}
📧 {profile_email}
🔗 {url}"
```

---

### Phase 2 — Language detection + Profile selection

Read title + description. Count EN keywords (the, and, for, with, our, you) vs FR keywords (le, la, les, et, pour, avec, notre, vous).

If EN majority:
- Email: applications@ousmanethienta.com
- CV: $CV_EN
- Language: en

If FR majority (default):
- Email: candidatures@ousmanethienta.com
- CV: $CV_FR
- Language: fr

---

### Phase 3 — Generate cover letter

```bash
curl -s -X POST "${APP_URL}/api/cover-letters/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -d "{\"offerId\": \"{offer_id}\", \"language\": \"{lang}\"}"
```

Save the cover letter text. If generation fails, continue without cover letter (note in APPLY_LOG).

---

### Phase 4 — Auto-apply with dev-browser

Detect ATS type from offer URL or atsType field.

#### Retry logic (ALL ATS types)
- Max 3 attempts per offer
- Wait 10s between retries
- On each failure: screenshot, log error, retry
- After 3 failures: FAIL notification, mark status "apply_failed", stop

#### ATS: Greenhouse (HPS, Sixth Street)
```
URL pattern: job-boards.greenhouse.io or boards.greenhouse.io
```
```bash
dev-browser "
1. Navigate to {url}
2. Click 'Apply for this job'
3. Fill: First Name=Ousmane, Last Name=Thienta, Email={email}, Phone=+33646230380
4. Upload Resume: {cv_path}
5. If cover letter field exists: paste cover letter text
6. Submit form
7. Confirm success page or confirmation message
"
```

#### ATS: SmartRecruiters (Bridgepoint)
```
URL pattern: careers.smartrecruiters.com
```
```bash
dev-browser "
1. Navigate to {url}
2. Click 'Apply'
3. Fill: First Name=Ousmane, Last Name=Thienta, Email={email}, Phone=+33646230380
4. Upload CV: {cv_path}
5. Submit
6. Look for confirmation
"
```

#### ATS: Workday (Rothschild, Ardian, BlackRock, Ares, ICG, Macquarie, HLo)
```
URL pattern: *.myworkdayjobs.com
```
```bash
dev-browser "
1. Navigate to {url}
2. Click 'Apply' or 'Postuler'
3. If account required: create account with {email}, password=BreakIn2026!
   OR choose 'Apply as guest' if available
4. Fill all required fields:
   - First Name: Ousmane
   - Last Name: Thienta
   - Email: {email}
   - Phone: +33646230380
   - Address: Paris, France (if required)
5. Upload CV: {cv_path}
6. Navigate through all wizard steps (may be 3-5 pages)
7. Submit on final page
8. Wait for confirmation email mention or success page
"
```

#### ATS: Lever
```
URL pattern: jobs.lever.co or jobs.eu.lever.co
```
```bash
dev-browser "
1. Navigate to {url}
2. Click 'Apply'
3. Fill: Name=Ousmane Thienta, Email={email}, Phone=+33646230380
4. Upload Resume: {cv_path}
5. Cover letter field: paste text if present
6. Submit
"
```

#### ATS: Taleo (BNP, SG, CA-CIB, Natixis)
```
URL pattern: taleo.net or tbe.taleo.net
```
```bash
dev-browser "
1. Navigate to {url}
2. Click 'Postuler en tant qu invité' or 'Apply as guest'
3. Fill email: {email}, confirm email
4. Fill: Prénom=Ousmane, Nom=Thienta, Téléphone=+33646230380
5. Upload CV: use base64 injection if direct upload fails
   - Read file as base64: base64 {cv_path}
   - Inject via JS: document.querySelector('[type=file]').value = ...
6. Navigate multi-step form (3-7 steps)
7. Submit on final step
8. Look for 'Votre candidature a été soumise' or similar
"
```

#### ATS: Custom / Unknown
```bash
dev-browser "
1. Navigate to {url}
2. Look for: 'Apply', 'Postuler', 'Candidater', 'Submit application'
3. Fill form with:
   - Name: Ousmane Thienta
   - Email: {email}
   - Phone: +33646230380
   - Upload CV: {cv_path}
4. Submit
5. Confirm success
"
```

#### Special cases
- **CAPTCHA detected**: Stop, send TG: '⚠️ CAPTCHA sur {company} — candidature manuelle requise: {url}', mark status 'apply_failed'
- **Already applied**: Log it, send TG: 'ℹ️ Déjà postulé chez {company}', mark status 'applied'
- **Login required (no guest option)**: Send TG with URL for manual apply, mark 'apply_failed'

---

### Phase 5 — Update DB

On success:
```bash
curl -s -X PUT "${APP_URL}/api/offers/{offer_id}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -d '{"status": "applied"}'

curl -s -X POST "${APP_URL}/api/applications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -d "{
    \"offerId\": \"{offer_id}\",
    \"companyName\": \"{company}\",
    \"role\": \"{title}\",
    \"source\": \"auto\",
    \"status\": \"applied\",
    \"appliedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }"
```

On failure:
```bash
curl -s -X PUT "${APP_URL}/api/offers/{offer_id}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -d '{"status": "apply_failed"}'
```

---

### Phase 6 — Log to APPLY_LOG.md

```bash
cat >> $APPLY_LOG << EOF
## $(date '+%Y-%m-%d %H:%M') | {company} | {title}
- URL: {url}
- ATS: {ats_type}
- Profile: {lang} ({email})
- Result: SUCCESS / FAILED ({reason})
- Notes: {any_observations}
EOF
```

---

### Phase 7 — END notification

On success:
```
tg "✅ <b>Candidature envoyée !</b>
<b>{title}</b> @ {company}
📍 {city}
📧 {email}
📎 CV {lang} envoyé"
```

On failure:
```
tg "❌ <b>Échec candidature</b>
<b>{title}</b> @ {company}
❓ Raison: {error_reason}
🔗 Postuler manuellement: {url}"
```

---

### Robustness rules

1. **Never crash silently** — toujours log l'erreur et notifier sur TG
2. **Screenshot on error** — sauvegarder dans /root/breakin/screenshots/{company}-{timestamp}.png
3. **Retry 3x** — attendre 10s entre chaque tentative
4. **Timeout 5 min max** per offer — si dépassé, fail proprement
5. **Never apply twice** — vérifier status != "applied" avant de commencer
6. **Fallback always** — si tout échoue, envoyer l'URL pour candidature manuelle sur TG

<!-- watcher-ping: sync test 10:13:24 -->

<!-- watcher-ping: post-FDA test 10:15:11 -->

<!-- watcher-ping: desktop path test 10:16:52 -->
