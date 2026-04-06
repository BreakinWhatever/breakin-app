import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { AtsType } from "../src/generated/prisma/enums";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma = new PrismaClient({ adapter });

type CompanySeed = {
  name: string;
  sector: string;
  city: string;
  country: string;
  atsType: AtsType;
  careerUrl: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  atsConfig: any;
};

const companies: CompanySeed[] = [
  // ── PARIS — Private Credit ──────────────────────────────────────────────
  { name: "Ardian", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.workday, careerUrl: "https://ardian.wd103.myworkdayjobs.com/ArdianCareers", atsConfig: { tenant: "ardian", site: "ArdianCareers", wdServer: "wd103" } },
  { name: "Tikehau Capital", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://tikehaucapital.com/en/careers", atsConfig: { query: "site:tikehaucapital.com/en/careers private credit OR leveraged finance" } },
  { name: "Eurazeo", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://eurazeo.com/en/talents/career-opportunities", atsConfig: { query: "site:eurazeo.com/en/talents/career-opportunities" } },
  { name: "AXA IM Alts", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://alts.axa-im.com/about-us/people-and-careers", atsConfig: { query: "site:alts.axa-im.com/about-us/people-and-careers private credit OR dette privée" } },
  { name: "Sagard", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://sagard.com/careers", atsConfig: { query: "site:sagard.com careers private credit" } },
  { name: "Pemberton Asset Management", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://pembertonam.com/careers", atsConfig: { query: "site:pembertonam.com/careers" } },
  { name: "ICG", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.workday, careerUrl: "https://icg.wd3.myworkdayjobs.com/external_careers", atsConfig: { tenant: "icg", site: "external_careers", wdServer: "wd3" } },
  { name: "Ares Management", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.workday, careerUrl: "https://aresmgmt.wd1.myworkdayjobs.com/External", atsConfig: { tenant: "aresmgmt", site: "External", wdServer: "wd1" } },
  { name: "Muzinich & Co", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://muzinich.com/about/careers", atsConfig: { query: "site:muzinich.com/about/careers" } },
  { name: "Kartesia", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://kartesia.com/careers", atsConfig: { query: "site:kartesia.com/careers private credit analyst" } },
  { name: "Andera Partners", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://anderapartners.com/en/careers", atsConfig: { query: "site:anderapartners.com/en/careers" } },
  { name: "Siparex", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://siparex.com/recrutement", atsConfig: { query: "site:siparex.com recrutement" } },
  { name: "Naxicap Partners", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://naxicap.fr/recrutement", atsConfig: { query: "site:naxicap.fr recrutement" } },
  { name: "Palatine Private Equity", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://palatine-pe.fr/recrutement", atsConfig: { query: "site:palatine-pe.fr recrutement" } },
  { name: "Turenne Capital", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://turennecapital.com/recrutement", atsConfig: { query: "site:turennecapital.com recrutement" } },
  { name: "MML Capital", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://mmlcapital.com/careers", atsConfig: { query: "site:mmlcapital.com/careers" } },
  { name: "BpiFrance", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://bpifrance.fr/recrutement", atsConfig: { query: "site:bpifrance.fr/recrutement analyste dette" } },
  { name: "Bridgepoint", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.smartrecruiters, careerUrl: "https://careers.smartrecruiters.com/Bridgepoint", atsConfig: { companyIdentifier: "Bridgepoint" } },
  { name: "Carlyle", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://carlyle.com/careers", atsConfig: { query: "site:carlyle.com/careers Paris private credit" } },
  { name: "KKR", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://kkr.com/careers/career-opportunities", atsConfig: { query: "site:kkr.com/careers Paris private credit OR leveraged finance" } },
  { name: "Blackstone", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://blackstone.com/careers", atsConfig: { query: "site:blackstone.com/careers Paris" } },
  { name: "Apollo Global Management", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://apollo.com/careers", atsConfig: { query: "site:apollo.com/careers Paris" } },
  { name: "Blue Owl Capital", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://blueowl.com/careers", atsConfig: { query: "site:blueowl.com/careers Paris" } },
  { name: "Oaktree Capital", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://oaktreecapital.com/careers", atsConfig: { query: "site:oaktreecapital.com/careers Paris" } },
  { name: "CIC Private Debt", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://cm-cic-privatedebt.com", atsConfig: { query: "CIC Private Debt recrutement analyste dette privée" } },
  { name: "Infranity", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://infranity.eu/careers", atsConfig: { query: "site:infranity.eu/careers infrastructure debt" } },
  { name: "Omnes Capital", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://omnescapital.com/en/careers", atsConfig: { query: "site:omnescapital.com/en/careers" } },
  { name: "SWEN Capital Partners", sector: "Private Credit", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://swencap.com/en/careers", atsConfig: { query: "site:swencap.com/en/careers" } },
  // ── PARIS — M&A / Debt Advisory / LevFin ────────────────────────────────
  { name: "Rothschild & Co", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.workday, careerUrl: "https://rothschildandco.wd3.myworkdayjobs.com/RothschildAndCo_Lateral", atsConfig: { tenant: "rothschildandco", site: "RothschildAndCo_Lateral", wdServer: "wd3" } },
  { name: "Lazard", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://lazard.com/careers", atsConfig: { query: "site:lazard.com/careers Paris M&A OR leveraged finance" } },
  { name: "Houlihan Lokey", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.workday, careerUrl: "https://hl.wd1.myworkdayjobs.com/Campus", atsConfig: { tenant: "hl", site: "Campus", wdServer: "wd1" } },
  { name: "Moelis & Company", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://moelis.com/careers", atsConfig: { query: "site:moelis.com/careers Paris" } },
  { name: "Perella Weinberg Partners", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://pwpartners.com/careers", atsConfig: { query: "site:pwpartners.com/careers Paris" } },
  { name: "Evercore", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://evercore.com/careers", atsConfig: { query: "site:evercore.com/careers Paris" } },
  { name: "PJT Partners", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://pjtpartners.com/careers", atsConfig: { query: "site:pjtpartners.com/careers Paris" } },
  { name: "Alantra", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://alantra.com/careers", atsConfig: { query: "site:alantra.com/careers Paris" } },
  { name: "Lincoln International", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://lincolninternational.com/careers", atsConfig: { query: "site:lincolninternational.com/careers Paris" } },
  { name: "Mediobanca", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://mediobanca.com/en/careers", atsConfig: { query: "site:mediobanca.com/en/careers Paris" } },
  { name: "Degroof Petercam", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://degroofpetercam.com/careers", atsConfig: { query: "site:degroofpetercam.com/careers Paris" } },
  { name: "Natixis Partners", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://natixispartners.com/recrutement", atsConfig: { query: "site:natixispartners.com recrutement" } },
  { name: "Clipperton", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://clipperton.fr/jobs", atsConfig: { query: "site:clipperton.fr/jobs" } },
  { name: "William Blair", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://williamblair.com/careers", atsConfig: { query: "site:williamblair.com/careers Paris" } },
  { name: "Jefferies", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://jefferies.com/careers", atsConfig: { query: "site:jefferies.com/careers Paris M&A OR leveraged finance" } },
  { name: "Messier Maris & Associés", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://messier-maris.com/recrutement", atsConfig: { query: "site:messier-maris.com recrutement" } },
  { name: "Bryan Garnier & Co", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://bryangarnier.com/careers", atsConfig: { query: "site:bryangarnier.com/careers Paris" } },
  { name: "Cambon Partners", sector: "M&A Advisory", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://cambon-partners.com/jobs", atsConfig: { query: "site:cambon-partners.com/jobs" } },
  // ── PARIS — Banques CIB ─────────────────────────────────────────────────
  { name: "BNP Paribas CIB", sector: "Leveraged Finance", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://careers.cib.bnpparibas", atsConfig: { query: "site:careers.cib.bnpparibas leveraged finance OR M&A OR private credit" } },
  { name: "Société Générale CIB", sector: "Leveraged Finance", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://careers.societegenerale.com", atsConfig: { query: "site:careers.societegenerale.com leveraged finance OR M&A OR private credit" } },
  { name: "Crédit Agricole CIB", sector: "Leveraged Finance", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://jobs.ca-cib.com", atsConfig: { query: "site:jobs.ca-cib.com" } },
  { name: "Natixis CIB", sector: "Leveraged Finance", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://chu.tbe.taleo.net", atsConfig: { query: "Natixis CIB recrutement leveraged finance OR M&A Paris" } },
  { name: "Goldman Sachs", sector: "Leveraged Finance", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://goldmansachs.com/careers", atsConfig: { query: "site:goldmansachs.com/careers Paris leveraged finance OR M&A" } },
  { name: "JPMorgan", sector: "Leveraged Finance", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://careers.jpmorgan.com", atsConfig: { query: "site:careers.jpmorgan.com Paris leveraged finance OR M&A" } },
  { name: "Morgan Stanley", sector: "Leveraged Finance", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://morganstanley.com/people-opportunities", atsConfig: { query: "site:morganstanley.com/people-opportunities Paris" } },
  { name: "HSBC", sector: "Leveraged Finance", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://hsbc.com/careers", atsConfig: { query: "site:hsbc.com/careers Paris leveraged finance OR M&A" } },
  { name: "Deutsche Bank", sector: "Leveraged Finance", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://careers.db.com", atsConfig: { query: "site:careers.db.com Paris leveraged finance OR M&A" } },
  { name: "Barclays", sector: "Leveraged Finance", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://search.jobs.barclays", atsConfig: { query: "site:search.jobs.barclays Paris" } },
  { name: "Citi", sector: "Leveraged Finance", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://jobs.citi.com", atsConfig: { query: "site:jobs.citi.com Paris leveraged finance OR M&A" } },
  { name: "Bank of America", sector: "Leveraged Finance", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://careers.bankofamerica.com", atsConfig: { query: "site:careers.bankofamerica.com Paris leveraged finance OR M&A" } },
  // ── PARIS — Transaction Services ────────────────────────────────────────
  { name: "Deloitte France", sector: "Transaction Services", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://deloitte.com/fr/fr/careers", atsConfig: { query: "site:deloitte.com/fr/fr/careers transaction services OR corporate finance" } },
  { name: "PwC France", sector: "Transaction Services", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://pwc.fr/fr/carrieres", atsConfig: { query: "site:pwc.fr/fr/carrieres deals OR transaction services OR corporate finance" } },
  { name: "EY France", sector: "Transaction Services", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://careers.ey.com", atsConfig: { query: "site:careers.ey.com France transaction advisory OR strategy" } },
  { name: "KPMG France", sector: "Transaction Services", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://kpmg.com/fr/fr/careers", atsConfig: { query: "site:kpmg.com/fr/fr/careers deal advisory OR transaction services" } },
  { name: "Mazars", sector: "Transaction Services", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://mazars.fr/Home/Carrieres", atsConfig: { query: "site:mazars.fr/Home/Carrieres transactions OR corporate finance" } },
  { name: "Grant Thornton France", sector: "Transaction Services", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://grantthornton.fr/carrieres", atsConfig: { query: "site:grantthornton.fr/carrieres transactions OR restructuring" } },
  { name: "Eight Advisory", sector: "Transaction Services", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://8advisory.com/carrieres", atsConfig: { query: "site:8advisory.com/carrieres" } },
  { name: "Alvarez & Marsal", sector: "Transaction Services", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://alvarezandmarsal.com/careers", atsConfig: { query: "site:alvarezandmarsal.com/careers Paris transactions" } },
  { name: "FTI Consulting", sector: "Transaction Services", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://fticonsulting.com/careers", atsConfig: { query: "site:fticonsulting.com/careers Paris" } },
  { name: "Accuracy", sector: "Transaction Services", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://accuracy.com/careers", atsConfig: { query: "site:accuracy.com/careers" } },
  { name: "Kroll", sector: "Transaction Services", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://kroll.com/en/careers", atsConfig: { query: "site:kroll.com/en/careers Paris valuation OR transaction" } },
  // ── LONDON — Private Credit ──────────────────────────────────────────────
  { name: "BlackRock HPS", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.workday, careerUrl: "https://blackrock.wd1.myworkdayjobs.com/BlackRock_Professional", atsConfig: { tenant: "blackrock", site: "BlackRock_Professional", wdServer: "wd1" } },
  { name: "Arcmont Asset Management", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://arcmont.com/careers", atsConfig: { query: "site:arcmont.com/careers" } },
  { name: "Hayfin Capital Management", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.workable, careerUrl: "https://apply.workable.com/hayfin-capital-management/", atsConfig: { clientname: "hayfin-capital-management" } },
  { name: "Sixth Street", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.greenhouse, careerUrl: "https://job-boards.greenhouse.io/sixthstreet", atsConfig: { boardToken: "sixthstreet" } },
  { name: "HPS Investment Partners", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.greenhouse, careerUrl: "https://job-boards.greenhouse.io/hpsinvestmentpartners", atsConfig: { boardToken: "hpsinvestmentpartners" } },
  { name: "Golub Capital", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://golubcapital.com/careers", atsConfig: { query: "site:golubcapital.com/careers London" } },
  { name: "BlueBay Asset Management", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://bluebay.com/careers", atsConfig: { query: "site:bluebay.com/careers" } },
  { name: "M&G Investments", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://mandg.com/careers", atsConfig: { query: "site:mandg.com/careers private credit OR direct lending" } },
  { name: "Aviva Investors", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://avivainvestors.com/en-gb/about-us/careers", atsConfig: { query: "site:avivainvestors.com/en-gb/about-us/careers private credit" } },
  { name: "Cheyne Capital", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://cheynecapital.com/careers", atsConfig: { query: "site:cheynecapital.com/careers" } },
  { name: "Bain Capital Credit", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://baincapital.com/careers", atsConfig: { query: "site:baincapital.com/careers London credit" } },
  { name: "Man GLG", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://man.com/careers", atsConfig: { query: "site:man.com/careers credit" } },
  { name: "PGIM Private Capital", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://pgim.com/careers", atsConfig: { query: "site:pgim.com/careers London private capital OR credit" } },
  { name: "17Capital", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://17capital.com/careers", atsConfig: { query: "site:17capital.com/careers" } },
  { name: "Alcentra", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://franklintempleton.com/careers", atsConfig: { query: "site:franklintempleton.com/careers London credit OR Alcentra" } },
  { name: "MV Credit", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://mvcredit.com/about/careers", atsConfig: { query: "site:mvcredit.com/about/careers" } },
  { name: "Barings", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://barings.com/guest/about/careers/professional", atsConfig: { query: "site:barings.com/guest/about/careers private credit OR direct lending" } },
  { name: "Macquarie Asset Management", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.workday, careerUrl: "https://mq.wd3.myworkdayjobs.com/CareersatMQ", atsConfig: { tenant: "mq", site: "CareersatMQ", wdServer: "wd3" } },
  { name: "TDR Capital", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://tdrcapital.com/careers", atsConfig: { query: "site:tdrcapital.com/careers" } },
  { name: "Permira Credit", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://permira.com/careers", atsConfig: { query: "site:permira.com/careers credit" } },
  { name: "CVC Credit", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://cvc.com/careers", atsConfig: { query: "site:cvc.com/careers credit" } },
  { name: "BC Partners", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://bcpartners.com/careers", atsConfig: { query: "site:bcpartners.com/careers credit" } },
  { name: "EQT Credit", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://eqt.com/careers", atsConfig: { query: "site:eqt.com/careers credit" } },
  { name: "Investec Private Debt", sector: "Private Credit", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://investec.com/careers", atsConfig: { query: "site:investec.com/careers London private debt OR direct lending" } },
  // ── LONDON — M&A / LevFin ───────────────────────────────────────────────
  { name: "Centerview Partners", sector: "M&A Advisory", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://centerviewpartners.com/careers", atsConfig: { query: "site:centerviewpartners.com/careers" } },
  { name: "RBC Capital Markets", sector: "Leveraged Finance", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://jobs.rbc.com", atsConfig: { query: "site:jobs.rbc.com London leveraged finance OR M&A" } },
  { name: "ING Capital", sector: "Leveraged Finance", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://ing.jobs", atsConfig: { query: "site:ing.jobs London leveraged finance OR leveraged loans" } },
  { name: "Santander CIB", sector: "Leveraged Finance", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://santandercib.com/careers", atsConfig: { query: "site:santandercib.com/careers London leveraged finance" } },
  { name: "Greenhill", sector: "M&A Advisory", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://greenhill.com/careers", atsConfig: { query: "site:greenhill.com/careers London" } },
  { name: "Stifel", sector: "M&A Advisory", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://stifel.com/careers", atsConfig: { query: "site:stifel.com/careers London M&A" } },
  { name: "Canaccord Genuity", sector: "M&A Advisory", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://canaccordgenuity.com/careers", atsConfig: { query: "site:canaccordgenuity.com/careers London" } },
  { name: "Peel Hunt", sector: "M&A Advisory", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://peelhunt.com/about/careers", atsConfig: { query: "site:peelhunt.com/about/careers" } },
  // ── LONDON — TS / Restructuring ─────────────────────────────────────────
  { name: "PwC UK", sector: "Transaction Services", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://pwc.co.uk/careers", atsConfig: { query: "site:pwc.co.uk/careers deals OR transaction services" } },
  { name: "Deloitte UK", sector: "Transaction Services", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://deloitte.com/uk/en/careers", atsConfig: { query: "site:deloitte.com/uk/en/careers financial advisory OR transaction" } },
  { name: "EY UK", sector: "Transaction Services", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://careers.ey.com", atsConfig: { query: "site:careers.ey.com United-Kingdom strategy transactions" } },
  { name: "KPMG UK", sector: "Transaction Services", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://kpmg.com/uk/en/careers", atsConfig: { query: "site:kpmg.com/uk/en/careers deal advisory" } },
  { name: "Grant Thornton UK", sector: "Transaction Services", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://grantthornton.co.uk/careers", atsConfig: { query: "site:grantthornton.co.uk/careers restructuring OR transactions" } },
  { name: "Alvarez & Marsal UK", sector: "Transaction Services", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://alvarezandmarsal.com/careers", atsConfig: { query: "site:alvarezandmarsal.com/careers London transactions OR restructuring" } },
  { name: "FTI Consulting UK", sector: "Transaction Services", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://fticonsulting.com/careers", atsConfig: { query: "site:fticonsulting.com/careers London" } },
  { name: "Bain & Company", sector: "Transaction Services", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://bain.com/careers", atsConfig: { query: "site:bain.com/careers London transaction services OR due diligence" } },
  { name: "L.E.K. Consulting", sector: "Transaction Services", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://lek.com/careers", atsConfig: { query: "site:lek.com/careers London due diligence OR corporate finance" } },
  { name: "AlixPartners", sector: "Transaction Services", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://alixpartners.com/careers", atsConfig: { query: "site:alixpartners.com/careers London restructuring OR private equity" } },
  // ── LONDON — PE ──────────────────────────────────────────────────────────
  { name: "CVC Capital Partners", sector: "Private Equity", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://cvc.com/careers", atsConfig: { query: "site:cvc.com/careers London private equity" } },
  { name: "Apax Partners", sector: "Private Equity", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://apax.com/careers", atsConfig: { query: "site:apax.com/careers" } },
  { name: "Permira", sector: "Private Equity", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://permira.com/careers", atsConfig: { query: "site:permira.com/careers" } },
  { name: "Hg", sector: "Private Equity", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://hgcapital.com/careers", atsConfig: { query: "site:hgcapital.com/careers" } },
  { name: "Cinven", sector: "Private Equity", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://cinven.com/careers", atsConfig: { query: "site:cinven.com/careers" } },
  { name: "3i Group", sector: "Private Equity", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://3i.com/careers", atsConfig: { query: "site:3i.com/careers" } },
  { name: "TowerBrook Capital Partners", sector: "Private Equity", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://towerbrook.com/careers", atsConfig: { query: "site:towerbrook.com/careers" } },
  { name: "Vitruvian Partners", sector: "Private Equity", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://vitruvianpartners.com/careers", atsConfig: { query: "site:vitruvianpartners.com/careers" } },
  { name: "IK Partners", sector: "Private Equity", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://ikpartners.com/careers", atsConfig: { query: "site:ikpartners.com/careers" } },
  { name: "Actis", sector: "Private Equity", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://actis.com/careers", atsConfig: { query: "site:actis.com/careers" } },
  { name: "General Atlantic", sector: "Private Equity", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://generalatlantic.com/careers", atsConfig: { query: "site:generalatlantic.com/careers London" } },
  // ── DUBAI ────────────────────────────────────────────────────────────────
  { name: "Mubadala Capital", sector: "Private Equity", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://mubadala.com/en/careers", atsConfig: { query: "site:mubadala.com/en/careers private credit OR M&A OR investment" } },
  { name: "ADIA", sector: "Private Equity", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://adia.ae/en/Careers", atsConfig: { query: "site:adia.ae/en/Careers" } },
  { name: "ADQ", sector: "Private Equity", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://adq.ae/en/careers", atsConfig: { query: "site:adq.ae/en/careers investment OR private equity" } },
  { name: "Gulf Capital", sector: "Private Equity", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://gulfcapital.com/careers", atsConfig: { query: "site:gulfcapital.com/careers" } },
  { name: "Investcorp", sector: "Private Equity", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://investcorp.com/careers", atsConfig: { query: "site:investcorp.com/careers" } },
  { name: "Waha Capital", sector: "Private Equity", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://wahacapital.ae/careers", atsConfig: { query: "site:wahacapital.ae/careers" } },
  { name: "NBK Capital", sector: "Private Equity", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://nbkcapital.com/careers", atsConfig: { query: "site:nbkcapital.com/careers" } },
  { name: "SHUAA Capital", sector: "M&A Advisory", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://shuaa.com/careers", atsConfig: { query: "site:shuaa.com/careers investment banking OR M&A" } },
  { name: "Emirates NBD Investment Banking", sector: "M&A Advisory", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://emiratesnbd.com/en/careers", atsConfig: { query: "site:emiratesnbd.com/en/careers investment banking OR M&A OR leveraged finance" } },
  { name: "FAB (First Abu Dhabi Bank)", sector: "M&A Advisory", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://bankfab.com/en-ae/careers", atsConfig: { query: "site:bankfab.com/en-ae/careers investment banking OR M&A OR capital markets" } },
  { name: "Moelis DIFC", sector: "M&A Advisory", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://moelis.com/careers", atsConfig: { query: "site:moelis.com/careers Dubai OR DIFC OR Middle East" } },
  { name: "Houlihan Lokey Dubai", sector: "M&A Advisory", city: "Dubai", country: "UAE", atsType: AtsType.workday, careerUrl: "https://hl.wd1.myworkdayjobs.com/Campus", atsConfig: { tenant: "hl", site: "Campus", wdServer: "wd1" } },
  { name: "Fajr Capital", sector: "Private Equity", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://fajrcapital.com/careers", atsConfig: { query: "site:fajrcapital.com/careers" } },
  { name: "CICC DIFC", sector: "M&A Advisory", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://cicc.com/en/careers", atsConfig: { query: "CICC DIFC Dubai careers M&A investment banking 2026" } },
  { name: "Ruya Partners", sector: "Private Credit", city: "Dubai", country: "UAE", atsType: AtsType.custom, careerUrl: "https://ruyapartners.com/careers", atsConfig: { query: "Ruya Partners ADGM careers direct lending UAE" } },
  // ── ZURICH / GENEVA ──────────────────────────────────────────────────────
  { name: "Partners Group", sector: "Private Equity", city: "Zurich", country: "Switzerland", atsType: AtsType.custom, careerUrl: "https://partnersgroup.com/en/news-and-views/careers", atsConfig: { query: "site:partnersgroup.com/en/news-and-views/careers private credit OR direct lending OR M&A" } },
  { name: "LGT Capital Partners", sector: "Private Credit", city: "Zurich", country: "Switzerland", atsType: AtsType.custom, careerUrl: "https://lgt.com/careers", atsConfig: { query: "site:lgt.com/careers private credit OR private equity OR direct lending" } },
  { name: "Unigestion", sector: "Private Equity", city: "Geneva", country: "Switzerland", atsType: AtsType.custom, careerUrl: "https://unigestion.com/careers", atsConfig: { query: "site:unigestion.com/careers" } },
  { name: "Capvis", sector: "Private Equity", city: "Zurich", country: "Switzerland", atsType: AtsType.custom, careerUrl: "https://capvis.com/careers", atsConfig: { query: "site:capvis.com/careers" } },
  { name: "Schroders Capital", sector: "Private Equity", city: "Zurich", country: "Switzerland", atsType: AtsType.custom, careerUrl: "https://schroders.com/en/careers", atsConfig: { query: "site:schroders.com/en/careers Zurich private equity OR private credit" } },
  { name: "Edmond de Rothschild AM", sector: "Private Equity", city: "Geneva", country: "Switzerland", atsType: AtsType.custom, careerUrl: "https://edmond-de-rothschild.com/careers", atsConfig: { query: "site:edmond-de-rothschild.com/careers Geneva private equity OR M&A" } },
  { name: "Mirabaud Group", sector: "M&A Advisory", city: "Geneva", country: "Switzerland", atsType: AtsType.custom, careerUrl: "https://mirabaud.com/en/careers", atsConfig: { query: "site:mirabaud.com/en/careers" } },
  { name: "ArchiMed", sector: "Private Equity", city: "Zurich", country: "Switzerland", atsType: AtsType.custom, careerUrl: "https://archimed.eu/careers", atsConfig: { query: "site:archimed.eu/careers Zurich" } },
  { name: "Montana Capital Partners", sector: "Private Equity", city: "Zurich", country: "Switzerland", atsType: AtsType.custom, careerUrl: "https://montanacapital.com/careers", atsConfig: { query: "site:montanacapital.com/careers" } },
  { name: "Ascensio Partners", sector: "M&A Advisory", city: "Zurich", country: "Switzerland", atsType: AtsType.custom, careerUrl: "https://ascensio-partners.com/careers", atsConfig: { query: "Ascensio Partners Zurich careers M&A corporate finance" } },
  // ── RECRUTEURS ───────────────────────────────────────────────────────────
  { name: "Selby Jennings", sector: "Recruitment", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://phaidon.com/selby-jennings/jobs", atsConfig: { query: "site:phaidon.com/selby-jennings/jobs private credit OR leveraged finance OR M&A Paris OR London" } },
  { name: "Dartmouth Partners", sector: "Recruitment", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://dartmouthpartners.com/jobs", atsConfig: { query: "site:dartmouthpartners.com/jobs private credit OR leveraged finance OR M&A" } },
  { name: "Walker Hamill", sector: "Recruitment", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://walkerhamill.com/jobs", atsConfig: { query: "site:walkerhamill.com/jobs private credit OR leveraged finance OR M&A Paris OR London" } },
  { name: "Goodman Masson", sector: "Recruitment", city: "London", country: "United Kingdom", atsType: AtsType.custom, careerUrl: "https://goodmanmasson.com/jobs", atsConfig: { query: "site:goodmanmasson.com/jobs finance private credit OR M&A London" } },
  { name: "Cadmus Partners", sector: "Recruitment", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://cadmuspartners.fr/offres", atsConfig: { query: "site:cadmuspartners.fr/offres private credit OR M&A OR leveraged finance" } },
  { name: "Michael Page Finance", sector: "Recruitment", city: "Paris", country: "France", atsType: AtsType.custom, careerUrl: "https://michaelpage.fr/emploi", atsConfig: { query: "site:michaelpage.fr/emploi private credit OR leveraged finance OR M&A OR transaction services Paris" } },
];

async function main() {
  console.log(`Seeding ${companies.length} companies...`);
  let created = 0;
  let updated = 0;

  for (const co of companies) {
    const existing = await prisma.company.findFirst({
      where: { name: co.name, city: co.city },
    });

    if (existing) {
      await prisma.company.update({
        where: { id: existing.id },
        data: {
          atsType: co.atsType,
          careerUrl: co.careerUrl,
          atsConfig: co.atsConfig,
          active: true,
          sector: co.sector,
        },
      });
      updated++;
    } else {
      await prisma.company.create({
        data: {
          name: co.name,
          sector: co.sector,
          city: co.city,
          country: co.country,
          size: "",
          atsType: co.atsType,
          careerUrl: co.careerUrl,
          atsConfig: co.atsConfig,
          active: true,
        },
      });
      created++;
    }
  }

  console.log(`Done: ${created} created, ${updated} updated.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
