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
