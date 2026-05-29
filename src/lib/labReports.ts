export interface LabReportConfig {
  /** Public URL to the PDF (served from /public) */
  pdfUrl: string
  /** Report / Certificate ID shown on the card */
  reportId?: string
  /** Name of the accredited lab that performed the test */
  lab?: string
  /** Date the report was issued (any locale string) */
  testDate?: string
  /** Optional batch / lot number */
  batchNumber?: string
  /** Short list of what was tested (shown as pills) */
  testedFor?: string[]
}

const MY_WHEY_REPORT: LabReportConfig = {
  pdfUrl: '/Poduct_Reports/AR-260-2026-00004176-01.pdf',
  reportId: 'AR-260-2026-00004176-01',
  lab: 'NABL Accredited Laboratory',
  testDate: '2026',
  testedFor: [
    'Protein Content',
    'Heavy Metals',
    'Microbial Safety',
    'Banned Substances',
    'Label Claim Accuracy',
  ],
}

const MUSCLE_WHEY_REPORT: LabReportConfig = {
  pdfUrl: '/Poduct_Reports/AR-260-2026-00004177-01.pdf',
  reportId: 'AR-260-2026-00004177-01',
  lab: 'NABL Accredited Laboratory',
  testDate: '2026',
  testedFor: [
    'Protein Content',
    'Heavy Metals',
    'Microbial Safety',
    'Banned Substances',
    'Label Claim Accuracy',
  ],
}

const MASS_GAINER_REPORT: LabReportConfig = {
  pdfUrl: '/Poduct_Reports/AR-260-2026-00004178-01.pdf',
  reportId: 'AR-260-2026-00004178-01',
  lab: 'NABL Accredited Laboratory',
  testDate: '2026',
  testedFor: [
    'Protein Content',
    'Heavy Metals',
    'Microbial Safety',
    'Banned Substances',
    'Label Claim Accuracy',
  ],
}

const RIPPED_ISOLATE_REPORT: LabReportConfig = {
  pdfUrl: '/Poduct_Reports/AR-260-2026-00004179-01.pdf',
  reportId: 'AR-260-2026-00004179-01',
  lab: 'NABL Accredited Laboratory',
  testDate: '2026',
  testedFor: [
    'Protein Content',
    'Heavy Metals',
    'Microbial Safety',
    'Banned Substances',
    'Label Claim Accuracy',
  ],
}

const LAB_REPORTS: Record<string, LabReportConfig> = {
  'my-whey-1kg': MY_WHEY_REPORT,
  'my-whey-2-kg': MY_WHEY_REPORT,
  'muscle-whey-1-kg': MUSCLE_WHEY_REPORT,
  'muscle-whey-2-kg': MUSCLE_WHEY_REPORT,
  'mass-gainer-1-kg': MASS_GAINER_REPORT,
  'mass-gainer-3-kg': MASS_GAINER_REPORT,
  'ripped-isolate-2-kg': RIPPED_ISOLATE_REPORT,
}

export function getLabReport(handle: string): LabReportConfig | null {
  return LAB_REPORTS[handle] ?? null
}
