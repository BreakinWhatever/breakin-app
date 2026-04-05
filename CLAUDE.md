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

When the user says "scrape les offres", run the following:

### Step 1 — Create a ScrapeRun
```bash
curl -s -X POST http://localhost:3000/api/scrape-runs \
  -H "Content-Type: application/json" \
  -d '{"source": "<source_name>"}'
```
Save the returned `id` as `scrapeRunId`.

### Step 2 — Fetch offers from sources

#### Adzuna (FR jobs)
```bash
curl -s "https://api.adzuna.com/v1/api/jobs/fr/search/1?app_id={ADZUNA_APP_ID}&app_key={ADZUNA_API_KEY}&what=private+credit+analyst&where=Paris&results_per_page=50&content-type=application/json"
```
Normalize each result:
- title: `result.title`
- company: `result.company.display_name`
- city: `result.location.display_name` (first part)
- country: "France"
- contractType: `result.contract_type` or "CDI"
- description: `result.description`
- url: `result.redirect_url`
- source: "adzuna"
- salary: `result.salary_min` - `result.salary_max` if present
- postedAt: `result.created`

#### WTTJ (Welcome to the Jungle)
```bash
curl -s "https://www.welcometothejungle.com/api/v1/jobs?query=private+credit&location=Paris&per_page=50"
```
Normalize each result:
- title: `result.name`
- company: `result.organization.name`
- city: `result.office.city`
- country: `result.office.country_code` mapped to country name
- contractType: `result.contract_type.fr`
- description: `result.description`
- url: `https://www.welcometothejungle.com/fr/companies/` + `result.organization.slug` + `/jobs/` + `result.slug`
- source: "wttj"
- salary: `result.salary` if present
- postedAt: `result.published_at`

#### Reed (UK jobs)
```bash
curl -s -u "{REED_API_KEY}:" "https://www.reed.co.uk/api/1.0/search?keywords=private+credit+analyst&locationName=London&resultsToTake=50"
```
Normalize each result:
- title: `result.jobTitle`
- company: `result.employerName`
- city: `result.locationName`
- country: "United Kingdom"
- contractType: map `result.contractType` or "Permanent"
- description: `result.jobDescription`
- url: `result.jobUrl`
- source: "reed"
- salary: `result.minimumSalary` - `result.maximumSalary` if present
- postedAt: `result.date`

### Step 3 — Import offers
Combine all normalized offers from all sources and POST them:
```bash
curl -s -X POST http://localhost:3000/api/offers/import \
  -H "Content-Type: application/json" \
  -d '{"offers": [...], "scrapeRunId": "<scrapeRunId>"}'
```
The API deduplicates by URL automatically. Response: `{ imported, duplicates, total }`.

### Step 4 — Score offers against CV
1. Fetch the CV:
   ```bash
   curl -s http://localhost:3000/api/cv
   ```
2. Fetch newly imported offers (status "new"):
   ```bash
   curl -s "http://localhost:3000/api/offers?status=new"
   ```
3. For each offer, read the title + description and determine:
   - **contractType**: one of "CDI", "CDD", "Stage", "Alternance", "VIE", "Freelance". Read the actual content — don't guess from keywords alone. If the description says "6-month internship" it's Stage, if it says "permanent role" it's CDI, if "apprenticeship/alternance" it's Alternance, etc.
   - **score**: 0-100 (how well the candidate matches)
   - **analysis**: 2-3 sentences explaining the score
4. Update the offer (contract type + score in one call):
   ```bash
   curl -s -X PUT http://localhost:3000/api/offers/<id> \
     -H "Content-Type: application/json" \
     -d '{"contractType": "<type>"}'
   ```
   Then POST the score:
   ```bash
   curl -s -X POST http://localhost:3000/api/offers/<id>/score \
     -H "Content-Type: application/json" \
     -d '{"score": <number>, "analysis": "<text>"}'
   ```

### Step 5 — Report
Summarize:
- Total offers scraped
- New offers imported
- Duplicates skipped
- Top 5 offers by match score (title, company, score)
