@AGENTS.md

# BreakIn — Agent Instructions

This is BreakIn, a cold emailing system for finance job hunting.
The app runs on http://localhost:3000.

## Running the Agent ("lance l'agent")

When the user says "lance l'agent", do the following:

1. **Fetch pending outreaches:**
   ```bash
   curl -s http://localhost:3000/api/agent/pending | python3 -m json.tool
   ```

2. **For each pending outreach**, generate a follow-up email draft:
   - Read the contact info, company, previous emails
   - Write a short (3-4 sentences), professional follow-up email
   - Use French for France/Cote d'Ivoire contacts, English for UK contacts
   - Don't repeat the previous email word for word
   - Politely reference the initial outreach
   - Suggest a 15-minute call

3. **Post each draft to the API:**
   ```bash
   curl -X POST http://localhost:3000/api/emails \
     -H "Content-Type: application/json" \
     -d '{"outreachId": "<id>", "type": "followup", "subject": "Re: <previous subject>", "body": "<draft body>"}'
   ```

4. **Update the outreach:**
   ```bash
   curl -X PUT http://localhost:3000/api/outreaches/<id> \
     -H "Content-Type: application/json" \
     -d '{"aiSuggestion": "Follow-up ready for review", "nextActionType": "followup_<n+1>"}'
   ```

5. **Report back** how many drafts were created.

The user will then go to the dashboard to approve/modify/ignore each draft.

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
