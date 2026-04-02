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
