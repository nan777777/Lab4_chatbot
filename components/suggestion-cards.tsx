'use client'

import { ArrowRight, GitBranch, KeyRound, Ruler, UsersRound } from 'lucide-react'

const suggestions = [
  {
    icon: GitBranch,
    title: 'Staggered Policy Adoption',
    subtitle: 'Minimum wage and youth employment',
    query: `Causal question: Does raising a state minimum wage reduce youth employment?
Treatment variable: An indicator that equals 1 after a state minimum wage increase takes effect in a state-quarter.
Outcome variable: Youth employment rate for ages 16-24.
Unit of analysis: State-quarter.
Data structure: Balanced panel data covering 50 U.S. states for 40 quarters.
Treatment timing: Staggered adoption; some states increase the minimum wage earlier, some later, and some never increase it during the sample.
Comparison group: Never-treated states and not-yet-treated states in the same quarters.
Other design features: There is no cutoff rule and no proposed instrument.
Question: Which MVP causal design family fits best, and what assumptions and diagnostics should I check?`,
  },
  {
    icon: Ruler,
    title: 'Cutoff-Based Assignment',
    subtitle: 'Class size and student achievement',
    query: `Causal question: What is the effect of smaller class size on student achievement?
Treatment variable: Being assigned to a smaller class because a grade cohort exceeds the enrollment cutoff.
Outcome variable: Student test score at the end of the school year.
Unit of analysis: Student.
Data structure: Cross-sectional student-level data with school, grade, cohort enrollment, class size, and test scores.
Cutoff rule: Schools add another class when grade-level enrollment exceeds 40 students.
Running variable: Grade-level cohort enrollment.
Comparison group: Students in cohorts just below and just above the enrollment cutoff.
Other design features: There is no proposed instrument and no staggered policy timing.
Question: Which MVP causal design family fits best, and what assumptions and diagnostics should I check?`,
  },
  {
    icon: KeyRound,
    title: 'Instrument Candidate',
    subtitle: 'Quarter of birth and schooling',
    query: `Causal question: What is the effect of years of schooling on adult earnings?
Treatment variable: Years of completed schooling.
Outcome variable: Adult annual earnings.
Unit of analysis: Individual.
Data structure: Cross-sectional individual-level survey data with birth quarter, education, earnings, age, state, and cohort.
Instrument: Quarter of birth, which changes compulsory-schooling exposure and therefore shifts years of schooling.
Comparison group: Individuals from nearby birth cohorts who differ in quarter of birth and induced schooling exposure.
Other design features: There is no cutoff assignment rule for treatment and no panel treatment timing.
Question: Which MVP causal design family fits best, and what assumptions and diagnostics should I check?`,
  },
  {
    icon: UsersRound,
    title: 'Observational Comparison',
    subtitle: 'Job training and later earnings',
    query: `Causal question: What is the effect of participating in a job training program on later earnings?
Treatment variable: Participation in the job training program.
Outcome variable: Earnings in the year after the program.
Unit of analysis: Worker.
Data structure: Cross-sectional worker-level observational data with one treated group and one untreated group.
Comparison group: Workers who did not participate in the training program.
Observed covariates: Pre-program earnings, age, education, prior employment, occupation, industry, and region.
Other design features: There is no cutoff rule, no proposed instrument, and no clear treatment timing variation that would support DID.
Question: Which MVP causal design family fits best, and what assumptions and diagnostics should I check?`,
  },
]

interface SuggestionCardsProps {
  onSelect: (query: string) => void
}

export function SuggestionCards({ onSelect }: SuggestionCardsProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.title}
          type="button"
          onClick={() => onSelect(suggestion.query)}
          className="group flex min-h-40 cursor-pointer flex-col items-start justify-between rounded-lg border-2 border-emerald-700/45 bg-emerald-950/8 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-700 hover:bg-emerald-950/15 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/35 dark:border-emerald-400/35 dark:bg-emerald-950/30 dark:hover:border-emerald-300 dark:hover:bg-emerald-950/50"
        >
          <div className="flex w-full items-start justify-between gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-emerald-800 text-white shadow-sm transition-colors group-hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:group-hover:bg-emerald-300">
              <suggestion.icon className="size-5" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-800 px-2 py-1 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-emerald-700 dark:bg-emerald-300 dark:text-emerald-950 dark:group-hover:bg-emerald-200">
              Run demo
              <ArrowRight className="size-3" />
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-50">{suggestion.title}</p>
            <p className="mt-1 text-sm leading-5 text-emerald-950/70 dark:text-emerald-100/70">{suggestion.subtitle}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
