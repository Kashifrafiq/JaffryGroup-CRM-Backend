import type { WorkflowDocumentSection } from './workflow-documents.types';

function sec(title: string, items: string[]): WorkflowDocumentSection {
  return { sectionTitle: title, items };
}

const LOC_DOCUMENTS: WorkflowDocumentSection[] = [
  sec('1. Corporate Documentation', [
    'Articles of Incorporation for the company requesting the LOC',
    'Shareholder Agreement (if applicable)',
    'Digital copy of the Minute Book (if available)',
    'Corporate Profile Report (if applicable)',
    'Business License or Registration (if required for your sector)',
    'Proof of active GST/QST registration',
  ]),
  sec('2. Financial Statements & Tax Filings', [
    'Past 3 years of Financial Statements (Compilation, NTR, or Review Engagement)',
    'Past 3 years of Corporate Tax Returns (T2) including all schedules',
    'Past 12 months of Business Bank Statements (downloaded month-by-month from online banking showing company name and address)',
    'Unaudited Year-to-Date (YTD) Financial Statements',
    'Ventilated/Aged Accounts Receivable (AR) Report – 30/60/90 days (current to YTD)',
    'Accounts Payable (AP) Report (if available)',
    'Asset List (equipment, vehicles, trailers, property)',
    'Amortization Schedule (capital and operating leases)',
    'Corporate Notices of Assessment (NOA) – last 3 years (Federal & Provincial, including Quebec)',
  ]),
  sec('3. Personal Income Verification (for all business owners / guarantors)', [
    'Last 2 years T1 General Tax Returns (complete copies)',
    'Last 2 years Notices of Assessment (Federal & Provincial)',
    'Most recent 30 days of pay stubs (if applicable)',
    'Last 2 years T4 slips',
    'Child Care Benefit statements (CCB / Allocation famille) — if applicable',
    'Rental income proof (lease agreements + last 3 months deposit proof) — if applicable',
    'Pension, dividend, or investment income statements — if applicable',
  ]),
  sec('4. Identification Documents', [
    'Please provide two (2) valid government-issued IDs:',
    'Quebec Driver’s License',
    'Canadian Passport',
    'Permanent Resident (PR) Card or Work Permit (if applicable)',
    'PR Approval Letter (if applicable)',
    'Social Insurance Number (for credit verification purposes)',
  ]),
  sec('5. Banking & Credit Information', [
    'Last 3 months of personal bank statements',
    'Current Credit Report(s) – Equifax preferred',
    'List of current liabilities including: Mortgages & Lines of Credit; Vehicle loans & leases; Credit cards & business loans; Personal obligations (e.g., alimony, support payments)',
  ]),
  sec('6. Proof of Assets', [
    'Recent (last 3 months) statements for: RRSP, TFSA, RESP accounts',
    'Investment portfolios / brokerage accounts',
    'Chequing & savings accounts',
    'Real estate holdings / property deeds',
  ]),
  sec('7. Property Documentation (if property-backed or refinance LOC)', [
    'Current Mortgage Statement',
    'Latest Property Tax Bill (municipal)',
    'School Tax Bill (Quebec only)',
    'Property Appraisal Report (if available)',
    'Proof of Home Insurance (declaration page or recent payment proof)',
    'Title/Deed (if owned outright or refinancing)',
    'Recent Hydro Bills',
    'For condominiums: Declaration of Co-ownership; Latest Condo Fee Statement; Financial Statements of the Syndicate',
  ]),
  sec('8. Additional Supporting Documents', [
    'Void Cheque or Direct Deposit Form',
    'Photo of property or business location (if applicable)',
    'Current lease agreement (if renting premises)',
    'Personal Net Worth Statement (if requested)',
  ]),
];

const MORTGAGE_DOCUMENTS: WorkflowDocumentSection[] = [
  sec('1. Banking Information', [
    'Last 3 months of bank statements (must clearly show client’s name and address).',
    'Proof of down payment for the past 3 months (source of funds).',
    'Proof of salary deposits visible within bank statements.',
    'Proof of available balance maintained for the last 3 months.',
    'If funds are gifted — Gift letter from the donor.',
    'If funds are gifted — Proof of transfer into client’s account.',
  ]),
  sec('2. Identification Documents', [
    'Provide two valid pieces of Government-issued ID (examples below as applicable).',
    'Quebec Driver’s License',
    'Canadian Passport',
    'Permanent Resident (PR) Card',
    'Work Permit (if applicable)',
    'Permanent Resident approval letter (if applicable)',
    'Social Insurance Number (SIN) confirmation (for credit verification purposes)',
  ]),
  sec('3. Income Verification', [
    '[Salaried employees] Last 2 years of T1 General Tax Returns (complete copies)',
    '[Salaried employees] Last 2 years of Notices of Assessment (Federal and Provincial)',
    '[Salaried employees] Last 30 days of pay stubs (2–3 most recent)',
    '[Salaried employees] T4 slips for the last 2 calendar years',
    '[Self-employed] 2 years of T1 Generals with Statement of Business or Professional Activities (T2125)',
    '[Self-employed] 2 years of Notices of Assessment (Federal and Provincial)',
    '[Self-employed] Business financial statements for the past 2 years (if incorporated)',
    '[Self-employed] Articles of Incorporation and Corporate Tax Returns (T2) (if applicable)',
    '[Additional income] Child Care Benefit statements (Federal – CCB; Provincial – Allocation famille)',
    '[Additional income] Rental income proof (lease agreement + recent 3 months of rent deposits)',
    '[Additional income] Pension or investment income statements',
  ]),
  sec('4. Credit Information', [
    'Equifax Credit Report(s) – 2 copies if available',
    'Current mortgage statement (showing outstanding balance, lender, and payment schedule)',
    'Property tax statements — Municipal property tax bill (most recent)',
    'Property tax statements — School tax statement',
    'Insurance policy or receipt (homeowner’s insurance declaration page or recent payment proof)',
    'List of liabilities — Vehicle loans',
    'List of liabilities — Credit cards',
    'List of liabilities — Lines of credit',
    'List of liabilities — Personal or business loans',
    'List of liabilities — Any other monthly obligations (alimony, support, etc.)',
  ]),
  sec('5. Proof of Assets', [
    'RRSP (Registered Retirement Savings Plan) statements — recent (last 3 months)',
    'TFSA (Tax-Free Savings Account) statements — recent (last 3 months)',
    'RESP (Registered Education Savings Plan) statements — recent (last 3 months)',
    'Investment portfolios, mutual funds, or brokerage accounts — recent (last 3 months)',
    'Savings or chequing accounts showing available balances — recent (last 3 months)',
  ]),
  sec('6. Property Documents (Purchase or Refinance)', [
    'Purchase Agreement / Offer to Purchase (signed, including all schedules)',
    'MLS Listing (if available)',
    'Property Appraisal Report (if already completed)',
    'Current Mortgage Statement (for refinance)',
    'Property Tax Bill – latest municipal statement showing assessed value and taxes',
    'School Tax Bill – most recent statement (Quebec only)',
    'Proof of Home Insurance Coverage – policy declaration page or latest receipt',
    'Title / Deed of Property (for refinance or if owned outright)',
    '[Condominium] Declaration of Co-ownership',
    '[Condominium] Latest Condo Fees statement',
    '[Condominium] Financial statements of the Syndicate',
  ]),
  sec('7. Additional Supporting Documents', [
    'Void Cheque or Direct Deposit Form for mortgage payments',
    'Photo of property (front view)',
    'Statement of current rent or lease (for first-time buyers currently renting)',
    'Gift letter (if applicable)',
    'Divorce or separation agreement (if applicable to financial obligations)',
  ]),
];

const BOOKKEEPING_DOCUMENTS: WorkflowDocumentSection[] = [
  sec('1. Period Covered', [
    'Period covered for bookkeeping and GST/QST (start and end dates as agreed for this engagement)',
  ]),
  sec('2. Banking Records', [
    'Bank statements for the required period',
    'Credit card statements',
    'Loan statements (if any)',
  ]),
  sec('3. Sales Records', ['Sales invoices issued to customers', 'Monthly sales summary (if available)']),
  sec('4. Expense Records', [
    'Business expense receipts and bills',
    'Supplier invoices',
    'Major purchase invoices (equipment, vehicle, etc.)',
    'Lease agreements and payment schedule',
  ]),
  sec('5. Previous Tax Records', ['Previous GST / QST returns']),
  sec('6. Payroll (If Applicable)', ['Employee list', 'Payroll reports or salary details']),
  sec('7. Accounting Records', ['Access to accounting software (if used), e.g. QuickBooks Online']),
];

const FINANCIAL_REPORTING_DOCUMENTS: WorkflowDocumentSection[] = [
  sec('1. Engagement & Reporting Period', [
    'Signed engagement letter or confirmation of scope (compilation, review-related support, or agreed-upon procedures as applicable)',
    'Reporting period and entity details (fiscal year-end, legal name, Quebec business number if applicable)',
  ]),
  sec('2. Trial Balance & General Ledger', [
    'Trial balance for the reporting period',
    'General ledger detail or export (if available)',
    'Opening balances / prior-year closing tie-out (if first year with your firm)',
  ]),
  sec('3. Banking & Cash', [
    'Bank statements for the full reporting period (all business accounts)',
    'Credit card statements (business use)',
    'Loan or line-of-credit statements (if applicable)',
  ]),
  sec('4. Revenue & Expenses', [
    'Sales invoices or revenue detail (as needed for material accounts)',
    'Expense invoices, receipts, and bills for significant or unusual items',
    'Payroll reports or journal (if payroll processed in-house)',
    'Lease agreements and rent payment records (if applicable)',
  ]),
  sec('5. GST/QST & Payroll Tax', [
    'GST/QST returns filed for the period (if registered)',
    'QST registration or file numbers (if applicable)',
    'Source deductions / payroll remittance summaries (Quebec and federal as applicable)',
  ]),
  sec('6. Assets, Liabilities & Equity', [
    'Fixed asset listing or capital asset additions/disposals',
    'Loan agreements and amortization schedules (if applicable)',
    'Accounts receivable and accounts payable aging (if material)',
    'Shareholder loan / due to or from related parties (if applicable)',
  ]),
  sec('7. Prior Reports & Closing', [
    'Prior-year financial statements or tax filings (for comparatives and continuity)',
    'Management representation or questionnaire responses (if your firm uses one)',
    'Other supporting schedules requested by the preparer',
  ]),
];

const TAXATION_DOCUMENTS: WorkflowDocumentSection[] = [
  sec('1. Engagement & Identification', [
    'Signed engagement or authorization to file',
    'Government-issued ID (as required)',
    'Social Insurance Number (SIN) confirmation (individuals)',
    'Prior-year Notice(s) of Assessment (federal and provincial, if available)',
  ]),
  sec('2. Employment & Slips (Individuals)', [
    'T4, T4A, and RL slips (all employers and payers)',
    'Last pay stub of the year (if needed to reconcile)',
    'Union dues, professional dues, or other slip-supported deductions',
  ]),
  sec('3. Self-Employment & Business', [
    'Business income and expense records (invoices, bank summaries, mileage log if claimed)',
    'T2125 / Statement of Business or Professional Activities support (if self-employed)',
    'Corporate financial statements and GIFI / T2 prior package (if incorporated)',
    'Business-use vehicle records (if applicable)',
  ]),
  sec('4. Deductions & Credits', [
    'RRSP contribution receipts',
    'Medical expenses (receipts summary)',
    'Charitable donation receipts',
    'Childcare receipts (RL-24 / receipts)',
    'Tuition (T2202) and student loan interest',
    'Other credits (disability, home accessibility, etc.) — supporting docs',
  ]),
  sec('5. Investment & Property', [
    'T5, T3, T5008, and investment statements (capital gains / losses)',
    'Rental income and expense records (lease, expenses, mortgage interest)',
    'Sale of principal residence designation support (if applicable)',
  ]),
  sec('6. GST/QST & Payroll', [
    'GST/QST returns and filing history (if registered)',
    'QST and GST account numbers / correspondence',
    'PD7A / payroll remittance summaries (if employer)',
  ]),
  sec('7. Corporate & Trust (If Applicable)', [
    'Minute book excerpt or director authorization for signing (if requested)',
    'Dividend resolutions or T5 preparation support',
    'Trust or partnership allocations (T3/T5013) — slips and statements',
  ]),
];

const CORPORATE_COMPLIANCE_DOCUMENTS: WorkflowDocumentSection[] = [
  sec('1. Corporate Constitution', [
    'Articles of Incorporation (Quebec or federal, as applicable)',
    'Bylaws or unanimous shareholder agreement (if any)',
    'Amendments to articles or name change documents',
  ]),
  sec('2. Corporate Profile & Registers', [
    'Quebec enterprise register extract (Registraire des entreprises) or NEQ confirmation',
    'Federal Business Number (BN) correspondence (if applicable)',
    'Share register / ledger and issued share certificates (if any)',
    'List of directors and officers (current)',
  ]),
  sec('3. Governance & Minutes', [
    'Minute book or signed minutes of annual and special meetings',
    'Director and shareholder resolutions (as applicable)',
    'Registered office address confirmation',
  ]),
  sec('4. Annual & Regulatory Filings', [
    'Annual information return or provincial annual declaration filings (as applicable)',
    'Corporate tax account correspondence (CRA / Revenu Québec)',
    'GST/QST registration and recent returns (if the corporation is registered)',
  ]),
  sec('5. Financial & Tax Records', [
    'Most recent financial statements or trial balance (if required for a filing)',
    'T2 corporate tax return and notices of assessment (if applicable to compliance work)',
    'Payroll account numbers and remittance summaries (if employer)',
  ]),
  sec('6. Licenses & Industry', [
    'Sector-specific licences or permits (if applicable)',
    'Professional or trade membership certificates (if relevant to compliance)',
  ]),
  sec('7. Authority & Correspondence', [
    'Authorization for representative (CRA / RQ) if your firm will correspond on behalf of the corporation',
    'Outstanding notices or compliance letters from regulators (CRA, RQ, REQ, etc.)',
  ]),
];

/** Checklists keyed by `application_type.code`. */
export const DOCUMENT_SECTIONS_BY_CODE: Record<string, WorkflowDocumentSection[]> = {
  loc: LOC_DOCUMENTS,
  mortgage_refinance: MORTGAGE_DOCUMENTS,
  mortgage_purchase: MORTGAGE_DOCUMENTS,
  bookkeeping: BOOKKEEPING_DOCUMENTS,
  financial_reporting: FINANCIAL_REPORTING_DOCUMENTS,
  business_credit: FINANCIAL_REPORTING_DOCUMENTS,
  taxation: TAXATION_DOCUMENTS,
  corporate_compliance: CORPORATE_COMPLIANCE_DOCUMENTS,
  other: [],
};
