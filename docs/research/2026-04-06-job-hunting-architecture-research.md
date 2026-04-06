# Job Hunting Automation Architecture Research

**Date:** 2026-04-06
**Focus:** Private Credit, Leveraged Finance, M&A, Direct Lending -- Paris & London

---

## 1. ATS Systems & Programmatic Access

### 1.1 Workday (BlackRock, Ardian, Ares, ICG, Rothschild, Houlihan Lokey, Macquarie)

**How it works:** Workday career sites follow the pattern `https://{tenant}.wd{N}.myworkdayjobs.com/{locale}/{site}`. Each company uses a different Workday data center (wd1, wd3, wd5, wd103, etc.).

**Hidden JSON API -- no official docs, but fully functional:**

```
POST https://{tenant}.wd{N}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs
```

Request body:
```json
{
  "appliedFacets": {},
  "limit": 20,
  "offset": 0,
  "searchText": ""
}
```

Headers required:
```
Accept: application/json
Content-Type: application/json
Accept-Language: en-US
User-Agent: Mozilla/5.0 ...
Referer: https://{tenant}.wd{N}.myworkdayjobs.com/en-US/{site}
```

Individual job details:
```
GET https://{tenant}.wd{N}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/job/{externalPath}
```

**Key limitation:** The listings endpoint returns only basic info (title, location, path). You must call the individual job detail endpoint for full descriptions.

**Pagination:** Use offset-based pagination. Stop when `jobPostings` array is empty or `offset + limit >= total`.

**Rate limits:** No official limits, but 1-2 req/sec recommended.

**Python example:**
```python
import requests

def fetch_workday_jobs(tenant, site, wd_server="wd3", limit=20, offset=0):
    url = f"https://{tenant}.{wd_server}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Accept-Language": "en-US",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": f"https://{tenant}.{wd_server}.myworkdayjobs.com/en-US/{site}",
    }
    payload = {
        "appliedFacets": {},
        "limit": limit,
        "offset": offset,
        "searchText": ""
    }
    resp = requests.post(url, json=payload, headers=headers)
    resp.raise_for_status()
    return resp.json()
```

---

### 1.2 Greenhouse (HPS Investment, Sixth Street, smaller funds)

**Fully public JSON API -- no authentication for GET endpoints:**

List all jobs:
```
GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs
GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
```

Single job with application questions:
```
GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs/{job_id}?questions=true&pay_transparency=true
```

Other endpoints:
```
GET https://boards-api.greenhouse.io/v1/boards/{board_token}/offices
GET https://boards-api.greenhouse.io/v1/boards/{board_token}/departments
GET https://boards-api.greenhouse.io/v1/boards/{board_token}
```

**Board token:** Found in the URL `https://boards.greenhouse.io/{board_token}` or `https://job-boards.greenhouse.io/{board_token}`.

**Authentication:** None for GET. POST (applications) requires Basic Auth with Base64-encoded API key.

**Rate limits:** Publicly documented as "cached and not rate limited."

**JSONP:** Supported via `?callback=functionName`.

**Response:** JSON with `id`, `internal_job_id`, `title`, `updated_at`, `requisition_id`, `location.name`, `absolute_url`.

**This is the gold standard for ATS APIs.**

---

### 1.3 Lever (various mid-size funds)

**Public API -- no authentication required:**

```
GET https://api.lever.co/v0/postings/{company_slug}?mode=json
GET https://api.lever.co/v0/postings/{company_slug}/{posting_id}
```

EU endpoint:
```
GET https://api.eu.lever.co/v0/postings/{company_slug}?mode=json
```

Query parameters: `skip`, `limit`, `location`, `commitment`, `team`, `department`, `level`, `group`.

**Rate limit:** 2 requests/second (429 if exceeded).

**Response:** JSON with `id`, `text`, `categories`, `description`, `hostedUrl`, `applyUrl`, `salaryRange`, `workplaceType`.

---

### 1.4 SmartRecruiters (Bridgepoint, Tikehau via WTTJ)

**Public Posting API -- no authentication required:**

```
GET https://api.smartrecruiters.com/v1/companies/{companyIdentifier}/postings
GET https://api.smartrecruiters.com/v1/companies/{companyIdentifier}/postings/{postingId}
```

Query parameters: `query`, `limit`, `offset`, `country`, `region`, `city`, `department`, `language`.

**No rate limit documented for the public posting API.**

---

### 1.5 Ashby (growing adoption among tech-forward funds)

**Public API -- no authentication:**

```
GET https://api.ashbyhq.com/posting-api/job-board/{clientname}?includeCompensation=true
```

Returns JSON with all relevant job posting fields. No filtering or searching available.

---

### 1.6 Workable (Hayfin Capital)

**Public widget endpoint -- no authentication:**

```
GET https://apply.workable.com/api/v1/widget/accounts/{clientname}
```

Returns published jobs. No filtering.

Authenticated API (for customers only):
```
GET https://{subdomain}.workable.com/spi/v3/jobs
```

---

### 1.7 Taleo / Oracle (BNP Paribas, Natixis, JPMorgan legacy)

**RSS feeds (when enabled by admin):**

Pattern: `https://{instance}.taleo.net/careersection/{section}/jobsearch.ftl` (HTML) with RSS icon.

RSS URL pattern: `https://{instance}.bbb.taleo.net/chp01/ats/servlet/Rss?org={ORG}&cws=45&WebPage=SRCHR_V2&WebVersion=0&_rss_version=2`

**Major limitations:**
- RSS feeds limited to 10 jobs per feed
- RSS must be enabled by admin (often OFF by default)
- No public JSON API for job seekers
- REST API exists but requires authenticated Taleo account (username, password, company code)
- Being phased out as firms migrate to newer ATS platforms

**Verdict:** Taleo is the hardest to work with programmatically. Scraping the HTML career section or using Google Jobs/eFinancialCareers as a proxy is more practical.

---

### 1.8 Eightfold AI (Morgan Stanley)

**No public API.** Requires OAuth token. Career portal at `{company}.eightfold.ai/careers`.

Must scrape or use third-party aggregators.

---

### 1.9 Avature (Goldman Sachs)

**No public API.** Career portal at custom domains (e.g., `recruiting360.avature.net`).

Must scrape or use third-party aggregators.

---

## 2. Target Firm Directory (Top 50 -- Paris & London)

### Banks -- Leveraged Finance / M&A

| # | Firm | ATS | Career URL | API Access |
|---|------|-----|-----------|------------|
| 1 | BNP Paribas CIB | Taleo/custom | `careers.cib.bnpparibas` / `bnpparibasgt.taleo.net` | RSS (limited) |
| 2 | Societe Generale | Custom | `careers.societegenerale.com` | Scrape only |
| 3 | Credit Agricole CIB | Custom | `jobs.ca-cib.com` | Scrape only |
| 4 | Natixis CIB | Taleo | `chu.tbe.taleo.net/chu03/ats/careers/jobSearch.jsp?org=NATIXIS` | RSS (limited) |
| 5 | Goldman Sachs | Avature | `goldmansachs.com/careers` | No public API |
| 6 | JP Morgan | Taleo (migrating) | `jpmchase.taleo.net` / `careers.jpmorgan.com` | RSS (limited) |
| 7 | Morgan Stanley | Eightfold | `morganstanley.eightfold.ai/careers` | No public API |
| 8 | Barclays | Custom | `search.jobs.barclays` | Scrape only |
| 9 | HSBC | Custom | `hsbc.com/careers` | Scrape only |
| 10 | Deutsche Bank | Yello/custom | `careers.db.com` / `db.recsolu.com` | Scrape only |
| 11 | Rothschild & Co | Workday | `rothschildandco.wd3.myworkdayjobs.com/RothschildAndCo_Lateral` | JSON API |
| 12 | Lazard | Custom | `lazard.com/careers` | Scrape only |
| 13 | Houlihan Lokey | Workday | `hl.wd1.myworkdayjobs.com/Campus` | JSON API |
| 14 | Moelis | Custom | `moelis.com/careers` | Scrape only |

### Private Credit / Direct Lending

| # | Firm | ATS | Career URL | API Access |
|---|------|-----|-----------|------------|
| 15 | Ares Management | Workday | `aresmgmt.wd1.myworkdayjobs.com/External` | JSON API |
| 16 | Blackstone Credit (BXCI) | Custom | `blackstone.com/careers` | Scrape only |
| 17 | ICG | Workday | `icg.wd3.myworkdayjobs.com/external_careers` | JSON API |
| 18 | Ardian | Workday | `ardian.wd103.myworkdayjobs.com/ArdianCareers` | JSON API |
| 19 | HPS Investment Partners | Greenhouse | `job-boards.greenhouse.io/hpsinvestmentpartners` | Full JSON API |
| 20 | Sixth Street | Greenhouse | `job-boards.greenhouse.io/sixthstreet` | Full JSON API |
| 21 | Hayfin Capital | Workable | `apply.workable.com/hayfin-capital-management/` | Widget API |
| 22 | Pemberton Asset Mgmt | Custom | `pembertonam.com/careers` | Scrape only |
| 23 | Tikehau Capital | WTTJ + custom | `tikehaucapital.com/en/careers` | Via WTTJ Algolia |
| 24 | Eurazeo | Custom | `eurazeo.com/en/talents/career-opportunities` | Scrape only |
| 25 | Muzinich & Co | Custom | `muzinich.com/about/careers` | Scrape only |
| 26 | Golub Capital | Custom | `golubcapital.com/careers` | Scrape only |
| 27 | Blue Owl Capital | Custom | `blueowl.com/careers` | Scrape only |
| 28 | AXA IM Alts (now BNP AM) | Custom | `alts.axa-im.com/about-us/people-and-careers` | Scrape only |
| 29 | Apollo Global | Custom | `apollo.com/careers` | Scrape only |
| 30 | KKR Credit | Custom | `kkr.com/careers/career-opportunities` | Scrape only |
| 31 | Carlyle | Custom | `carlyle.com/careers` | Scrape only |
| 32 | Oaktree Capital | Custom | `oaktreecapital.com/careers` | Scrape only |
| 33 | BlackRock (Private Credit) | Workday | `blackrock.wd1.myworkdayjobs.com/BlackRock_Professional` | JSON API |
| 34 | Macquarie | Workday | `mq.wd3.myworkdayjobs.com/CareersatMQ` | JSON API |
| 35 | Barings | Custom | `barings.com/guest/about/careers/professional` | Scrape only |
| 36 | Bridgepoint | SmartRecruiters | `careers.smartrecruiters.com/Bridgepoint` | Posting API |

### Additional LevFin/Credit Firms (London/Paris)

| # | Firm | ATS | Career URL | API Access |
|---|------|-----|-----------|------------|
| 37 | Permira Credit | Custom | `permira.com/careers` | Scrape only |
| 38 | CVC Credit | Custom | `cvc.com/careers` | Scrape only |
| 39 | Arcmont (now CVC Credit) | LinkedIn only | No dedicated portal found | LinkedIn scrape |
| 40 | Cheyne Capital | Custom | `cheynecapital.com/careers` | Scrape only |
| 41 | Bain Capital Credit | Custom | `baincapital.com/careers` | Scrape only |
| 42 | Man GLG | Custom | `man.com/careers` | Scrape only |
| 43 | PGIM (Prudential) | Custom | `pgim.com/careers` | Scrape only |
| 44 | Alcentra (now Franklin Templeton) | Custom | `franklintempleton.com/careers` | Scrape only |
| 45 | MV Credit | Custom | Small firm, LinkedIn primarily | LinkedIn scrape |
| 46 | Greenhill (now Mizuho) | Custom | Check Mizuho careers | Scrape only |
| 47 | Perella Weinberg | Custom | `pwpartners.com/careers` | Scrape only |
| 48 | Investec | Custom | `investec.com/careers` | Scrape only |
| 49 | Mediobanca | Custom | `mediobanca.com/en/careers` | Scrape only |
| 50 | Standard Chartered (LevFin) | Custom | `sc.com/careers` | Scrape only |

### Summary: Firms with direct API access (priority targets for automation)

**Workday JSON API (7 firms):** Rothschild, Houlihan Lokey, Ares, ICG, Ardian, BlackRock, Macquarie

**Greenhouse public API (2 firms):** HPS Investment, Sixth Street

**SmartRecruiters API (1 firm):** Bridgepoint

**Workable widget API (1 firm):** Hayfin

**WTTJ Algolia (several):** Tikehau, plus any firm posting on WTTJ

**No API / scrape-only (39 firms):** Rely on aggregators (eFinancialCareers, LinkedIn, Google Jobs)

---

## 3. eFinancialCareers

### API Availability

eFinancialCareers has a **recruiter-facing API** (for posting jobs, not retrieving):
- **Job API endpoint:** `https://core.ws.efinancialcareers.com/v1/jobs`
- **Resume API endpoint:** `https://core.ws.efinancialcareers.com/v1/resume-search`
- Authentication: Token-based
- Purpose: Job posting and resume search for recruiters

**No public job search API for job seekers.** The API is designed for employers to post, not for candidates to search.

### Scraping Options

**Apify scraper:** `apify.com/easyapi/efinancialcareers-jobs-scraper`
- Requires residential proxies (recommended)
- Cost: ~$0.001-0.05 per run (Apify compute units)
- Returns structured job data

**WebAutomation.io:** `webautomation.io/pde/efinancialcareers-extractor/539/`
- Alternative scraping solution

### Coverage for Target Roles

- **Leveraged Finance in France:** ~116 jobs listed
- **Leveraged Finance in UK:** ~2,641 jobs listed
- **Private Credit:** Strong coverage, major firms post here
- Coverage is excellent for banking and buy-side finance roles

### URL Patterns

- France: `efinancialcareers.fr/en/jobs/`
- UK: `efinancialcareers.co.uk/jobs/`
- Job URLs: `efinancialcareers.com/jobs-{Country}-{City}-{Title}.id{jobId}`

### Key Insight

eFinancialCareers uses its own redirect URLs, not direct company URLs. The job listing links to eFinancialCareers pages, and from there you may find the original company posting link, but it is not guaranteed.

---

## 4. LinkedIn Jobs

### Public Guest API (Best Approach -- No Login Required)

**Job Search:**
```
GET https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={query}&location={location}&start={offset}
```

**Job Details:**
```
GET https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}
```

**Company Typeahead:**
```
GET https://www.linkedin.com/jobs-guest/api/typeaheadHits?typeaheadType=COMPANY&query={term}
```

**City Typeahead:**
```
GET https://www.linkedin.com/jobs-guest/api/typeaheadHits?origin=jserp&typeaheadType=GEO&geoTypes=POPULATED_PLACE&query={term}
```

**Parameters:**
- `keywords` -- search terms
- `location` -- geographic filter
- `start` -- pagination offset (increments of 25)
- `f_TPR=r86400` -- posted in last 24 hours
- `f_E=2` -- entry level
- `f_JT=F` -- full time

**Response:** HTML with structured CSS classes:
- `base-card` -- job card container
- `base-search-card__title` -- title
- `base-search-card__subtitle` -- company
- `job-search-card__location` -- location
- `show-more-less-html__markup` -- description

**Rate limits:** LinkedIn returns 429 errors if you scrape too fast. Recommended: 2-3 second delays, User-Agent rotation, proxy rotation for volume.

**LinkedIn gives LinkedIn URLs, not direct company career page URLs.**

### Apify Scrapers (2026)

Several active scrapers:
- `apify.com/bebity/linkedin-jobs-scraper` -- no login required, uses public API
- `apify.com/cryptosignals/linkedin-jobs-scraper` -- public API, no auth
- `apify.com/curious_coder/linkedin-jobs-search-scraper` -- advanced features

**Cost:** Apify platform charges ~$0.001-0.05 per run. Free tier gives $5/month credit.

### LinkedIn Job Alerts via Email

**Parsing tools:**
- **Parseur** (`parseur.com`) -- auto-extracts structured data from LinkedIn job alert emails
- **Parsio** (`parsio.io`) -- predefined templates for LinkedIn job emails
- **Mailparser** (`mailparser.io`) -- custom parsing rules for any job board email

**Strategy:** Set up LinkedIn job alerts, forward to a parsing service, extract structured data. Low maintenance, LinkedIn-compliant, but delayed (emails sent 1x/day typically).

---

## 5. Google Jobs / SerpAPI

### SerpAPI Google Jobs API

**Endpoint:**
```
GET https://serpapi.com/search?engine=google_jobs&q={query}&location={location}&api_key={key}
```

**Parameters:**
- `q` -- search query (required)
- `engine` -- `google_jobs` (required)
- `api_key` -- your key (required)
- `location` -- city-level recommended
- `gl` -- country code (e.g., `fr`, `gb`)
- `hl` -- language code
- `next_page_token` -- pagination
- `lrad` -- search radius in km
- `ltype` -- work from home filter

**Response:** JSON with `jobs_results` array containing:
- Title, company, location, description
- `apply_options` -- **multiple application platform links per job, including the source URL**
- `detected_extensions` -- benefits, schedule, posting date

**Pricing (2026):**
- Free: 250 searches/month
- Developer: $75/month for 5,000 searches ($0.015/search)
- Enterprise: $3,750/month + $7.50-30/1,000 searches

**Key advantage:** `apply_options` returns the **direct source URL** (company career page), not just a Google URL. This is the best way to map aggregated listings back to source.

### Alternatives

- **SearchAPI.io** (`searchapi.io`) -- cheaper alternative
- **Apify Google Jobs Scraper** -- `apify.com/parseforge/google-jobs-scraper`

---

## 6. Welcome to the Jungle (WTTJ)

### Algolia API

WTTJ uses Algolia for its search backend. The public search keys are embedded in WTTJ's frontend JavaScript.

**How to find current keys:** Inspect network requests on `welcometothejungle.com/en/jobs` -- look for requests to `*.algolia.net`.

**Index structure:**
- Separate indexes for French and English listings (e.g., `wttj_fr`, `wttj_en`)
- Boosted job postings in a separate index
- Multi-query used for search results

**Capabilities:**
- Full-text search
- Filter by: keyword, contract type, remote policy, experience level, salary, job category
- Near real-time updates as companies post/remove jobs
- ~30 jobs per Algolia request
- ~30,000-50,000 active listings at any time

**No authentication needed** -- public search keys.

### Official WelcomeKit API (for employers/partners)

```
GET https://www.welcomekit.co/api/v1/external/jobs/all
Authorization: Bearer {WK_API_KEY}
```

Parameters: `status`, `contract_type`, `per_page`, `page`, `created_after`, `updated_after`, `published_after`.

This requires a WelcomeKit API key (employer access).

### WTTJ Apify Scrapers

- `apify.com/logiover/welcome-to-the-jungle-jobs-scraper` -- uses internal Algolia API
- `apify.com/saswave/welcome-to-the-jungle-scraper`

### Quality for Finance

WTTJ is strong for French mid-market and tech companies. Some finance firms use it (e.g., Tikehau Capital). Coverage for large banks and PE/credit funds is weaker compared to eFinancialCareers.

---

## 7. Existing Job Hunting Automation Tools

### Auto-Apply Tools (2026)

| Tool | What it does | Pricing |
|------|-------------|---------|
| **Sonara** | Scans millions of listings, auto-submits tailored resumes/cover letters | Subscription |
| **LazyApply** | Chrome extension, blasts resume across LinkedIn/Indeed | Subscription |
| **JobRight** | AI copilot: sources, customizes, submits | Subscription |
| **Simplify** | Free form-filling, no resume optimization | Free |
| **Teal** | Resume builder + ATS scoring + job tracking | Freemium |
| **JobCopilot** | Full automation: scan, match, submit | Subscription |
| **BulkApply** | Mass application submission | Subscription |
| **Scale.jobs** | Human-assisted application service | Per-application |

**How they source jobs:** Most pull from LinkedIn, Indeed, Glassdoor, and Google Jobs. Some scrape career pages directly.

### Career Page Monitoring

**OpenJobRadar** (`openjobradar.com`):
- Monitors 14+ ATS platforms (Greenhouse, Lever, Workday, Ashby, SmartRecruiters, etc.)
- Detects new positions, matches against user criteria, sends alerts
- **Completely free** -- no premium tier, no feature gates
- Key insight: 2-7 day lag between career page posting and aggregator appearance
- Candidates applying within 48 hours are 3x more likely to get interviews

### Open-Source Job Scrapers

**JobSpy** (`github.com/speedyapply/JobSpy`) -- **Best open-source option**
- Python library, 3.1k stars, MIT license
- Supports: LinkedIn, Indeed, Glassdoor, Google, ZipRecruiter, Bayt, Naukri, BDJobs
- Concurrent scraping, returns pandas DataFrame
- Proxy support, deduplication built-in

```python
from jobspy import scrape_jobs

jobs = scrape_jobs(
    site_name=["indeed", "linkedin", "glassdoor"],
    search_term="private credit analyst",
    location="London",
    results_wanted=20,
    hours_old=72,
    country_indeed='GB'
)
```

Limitations: LinkedIn rate limits around page 10. Job boards cap at ~1,000 results.

**JobFunnel** (`github.com/PaulMcInnis/JobFunnel`) -- scrapes into spreadsheet with dedup.

### Paid Aggregator APIs

**Fantastic.jobs** (`fantastic.jobs`):
- Indexes 175,000+ company career sites across 54 ATS platforms
- 1.8M+ jobs indexed per month
- AI-enriched data (up to 60 fields per job)
- Job added to database within 3 hours of posting
- Pricing: $200-4,000/month for job board solutions
- Expired job detection: $20/month companion actor

**TheirStack** (`theirstack.com`):
- Job postings API with freshness tracking

---

## 8. Deduplication Best Practices

### The Problem

The same job appears on: company career page, LinkedIn, eFinancialCareers, Google Jobs, WTTJ, Indeed, etc. Estimated 30-40% of aggregated listings may be duplicates or stale.

### Recommended Approach

**Step 1: Normalize fields**
```python
def normalize_for_dedup(job):
    return {
        "company": job["company"].lower().strip()
            .replace("ltd", "").replace("limited", "")
            .replace("s.a.", "").replace("sa", "").strip(),
        "title": job["title"].lower().strip()
            .replace("senior", "sr").replace("junior", "jr"),
        "city": job["city"].lower().strip(),
    }
```

**Step 2: Generate composite key**
```python
import hashlib

def dedup_key(job):
    normalized = normalize_for_dedup(job)
    raw = f"{normalized['company']}|{normalized['title']}|{normalized['city']}"
    return hashlib.md5(raw.encode()).hexdigest()
```

**Step 3: Fuzzy matching for near-duplicates**

Use RapidFuzz (faster than FuzzyWuzzy) for cases where exact hash doesn't match:

```python
from rapidfuzz import fuzz

def is_likely_duplicate(job_a, job_b, threshold=85):
    company_score = fuzz.ratio(job_a["company"].lower(), job_b["company"].lower())
    title_score = fuzz.ratio(job_a["title"].lower(), job_b["title"].lower())
    same_city = job_a["city"].lower() == job_b["city"].lower()

    if same_city and company_score > 80 and title_score > 80:
        return True
    if company_score > 90 and title_score > 90:
        return True
    return False
```

**Step 4: Source priority for merge**
When duplicates found, keep the record with:
1. Direct career page URL (highest priority -- most reliable for application)
2. Most recent posting date
3. Most complete data (salary, description, etc.)

### Standard Job Identifiers

There is no universal job posting ID. Best approaches:
- `company + title + city` hash (catches ~90%)
- Add `posted_date` within 7-day window to reduce false positives
- URL deduplication as a first pass (your current approach in `/api/offers/import`)

---

## 9. Optimal Scraping Architecture

### Recommended Source Hierarchy

| Priority | Source | Method | Frequency | Why |
|----------|--------|--------|-----------|-----|
| 1 | Direct career pages (Workday/Greenhouse/Lever/SmartRecruiters) | Native APIs | Every 6-12 hours | Freshest data, direct apply URL, no middleman |
| 2 | Google Jobs (via SerpAPI) | API | Daily | Aggregates everything, returns source URLs |
| 3 | LinkedIn (guest API) | Scrape | Daily | High coverage, catches roles from "scrape-only" firms |
| 4 | eFinancialCareers | Scrape/Apify | Every 2-3 days | Finance-specific, good for UK market |
| 5 | WTTJ (Algolia) | API | Daily | Good for French market, mid-market firms |
| 6 | Adzuna/Reed | API | Daily | UK market, structured APIs |

### Rate Limits Summary

| Source | Limit | Strategy |
|--------|-------|----------|
| Workday CXS API | ~1-2 req/sec (unofficial) | 3s delay between companies |
| Greenhouse API | No rate limit (cached) | Batch all at once |
| Lever API | 2 req/sec | 0.5s delay |
| SmartRecruiters | Not documented | 1 req/sec conservative |
| LinkedIn Guest | ~1 req/3s before 429 | 3s delay, proxy rotation |
| SerpAPI | Plan-dependent | Batch queries efficiently |
| WTTJ Algolia | Not documented | 1 req/sec conservative |

### Freshness / Stale Position Detection

1. **Check for 404s:** If a previously-stored job URL returns 404, mark as expired
2. **Re-scrape and diff:** If a job disappears from the source feed, mark as expired
3. **Time-based expiry:** Flag jobs older than 30 days as potentially stale
4. **Ghost job detection:** If same company reposts very similar job description repeatedly, flag as ghost job (text similarity > 90%)
5. **Recommended daily flow:**
   - Morning: Scrape all API sources
   - Check all stored job URLs for 404s (batch HEAD requests)
   - New jobs: score against CV, alert if high match
   - Disappeared jobs: mark as expired in DB

### Recommended Architecture for BreakIn v2

```
[Scheduler / Cron]
    |
    v
[Job Fetcher Service]
    |-- Workday fetcher (7 firms)
    |-- Greenhouse fetcher (2 firms)
    |-- Lever fetcher (as needed)
    |-- SmartRecruiters fetcher (1 firm)
    |-- Workable fetcher (1 firm)
    |-- LinkedIn guest API fetcher
    |-- Google Jobs / SerpAPI fetcher
    |-- eFinancialCareers Apify actor
    |-- WTTJ Algolia fetcher
    |-- Adzuna API fetcher
    |-- Reed API fetcher
    |
    v
[Normalizer]
    |-- Standardize fields (title, company, city, country, etc.)
    |-- Detect contract type from description
    |-- Extract salary when available
    |
    v
[Deduplicator]
    |-- URL-based exact dedup (first pass)
    |-- Company+Title+City hash dedup (second pass)
    |-- Fuzzy matching for near-duplicates (third pass)
    |-- Source priority merge
    |
    v
[Scorer]
    |-- Match against CV/profile
    |-- Score 0-100
    |-- Generate analysis
    |
    v
[Database]
    |-- offers table (existing)
    |-- scrape_runs table (existing)
    |
    v
[Alert System]
    |-- High-score new offers -> notification
    |-- Stale offer cleanup -> mark expired
```

### Cost Estimate (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| SerpAPI | 1,000 searches/month | $75 (Developer plan) |
| Apify (eFinancialCareers) | ~30 runs/month | ~$5-10 |
| Direct APIs (Workday, Greenhouse, etc.) | Unlimited | Free |
| LinkedIn guest scraping | Self-hosted | Free (proxy cost if needed) |
| WTTJ Algolia | Direct | Free |
| Adzuna API | 500 calls/month | Free tier |
| Reed API | 500 calls/month | Free tier |
| **Total** | | **~$80-90/month** |

---

## 10. Sources

### ATS APIs
- [Greenhouse Job Board API](https://developers.greenhouse.io/job-board.html)
- [Lever Postings API](https://github.com/lever/postings-api)
- [SmartRecruiters Posting API](https://developers.smartrecruiters.com/docs/posting-api)
- [Ashby Public Job Posting API](https://developers.ashbyhq.com/docs/public-job-posting-api)
- [Workable API Documentation](https://help.workable.com/hc/en-us/articles/115012771647)
- [Workday REST Directory](https://community.workday.com/sites/default/files/file-hosting/restapi/)
- [Fantastic.jobs ATS Coverage](https://fantastic.jobs/)

### Job Aggregators
- [SerpAPI Google Jobs API](https://serpapi.com/google-jobs-api)
- [eFinancialCareers Recruiter API Docs](https://recruiterhub.efinancialcareers.com/Hire-api-job-documentation.html)
- [WTTJ WelcomeKit API](https://developers.welcomekit.co/jobs-api/jobs/list-all-jobs)

### Scrapers & Tools
- [JobSpy on GitHub](https://github.com/speedyapply/JobSpy)
- [Apify LinkedIn Jobs Scraper](https://apify.com/bebity/linkedin-jobs-scraper)
- [Apify eFinancialCareers Scraper](https://apify.com/easyapi/efinancialcareers-jobs-scraper)
- [OpenJobRadar](https://openjobradar.com/)
- [Apify Pricing](https://apify.com/pricing)

### LinkedIn Public API
- [Scraping LinkedIn Jobs in 2026 (No Login)](https://dev.to/agenthustler/how-to-scrape-linkedin-job-listings-in-2026-python-public-api-no-login-required-5bin)
- [LinkedIn Jobs API on GitHub](https://github.com/VishwaGauravIn/linkedin-jobs-api)

### Job Hunting Tools
- [Best AI Job Search Tools 2026](https://careery.pro/blog/ai-job-search/best-ai-job-search-tools-2026)
- [Sonara Review 2026](https://jobright.ai/blog/sonara-review-2026-pros-cons-and-what-users-actually-experience/)
- [Job Scraping in 2026](https://cavuno.com/blog/job-scraping)
- [TheirStack Data Freshness](https://theirstack.com/en/docs/data/job/freshness)

### Firms & Market
- [PDI 200 Top Private Credit Firms](https://www.privatedebtinvestor.com/pdi-200/)
- [Top Private Credit Firms 2025](https://growthcapadvisory.com/the-top-private-credit-firms-of-2025/)
- [eFinancialCareers LevFin Jobs France](https://www.efinancialcareers.co.uk/jobs/leveraged-finance/in-france)
