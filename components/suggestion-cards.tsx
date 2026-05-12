'use client'

import { ArrowRight, GitBranch, KeyRound, Ruler, UsersRound } from 'lucide-react'

const suggestions = [
  {
    icon: GitBranch,
    title: 'Difference-in-Differences Example',
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
    title: 'Regression Discontinuity Example',
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
    title: 'Instrumental Variables Example',
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
    title: 'Matching Example',
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
    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.title}
          type="button"
          onClick={() => onSelect(suggestion.query)}
          className="group flex min-h-24 cursor-pointer items-start gap-3 rounded-lg border border-emerald-200 bg-transparent p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-emerald-900/70 dark:bg-emerald-950/55 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/45"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-transparent text-emerald-700 transition-colors group-hover:text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300 dark:group-hover:bg-emerald-700 dark:group-hover:text-emerald-50">
            <suggestion.icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-50">{suggestion.title}</p>
            <p className="mt-1 text-xs leading-5 text-emerald-800/80 dark:text-emerald-200/75">{suggestion.subtitle}</p>
          </div>
          <ArrowRight className="mt-0.5 size-4 shrink-0 text-emerald-700/70 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-800 dark:text-emerald-300/75 dark:group-hover:text-emerald-200" />
        </button>
      ))}
    </div>
  )
}
