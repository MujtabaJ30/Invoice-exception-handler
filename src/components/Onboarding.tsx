interface OnboardingProps {
  readonly onDismiss: () => void;
}

export default function Onboarding({ onDismiss }: OnboardingProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Exception Engine"
    >
      <div className="bg-card rounded-xl border border-border max-w-md w-full overflow-hidden shadow-2xl animate-scale-in">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground font-mono tracking-tight">
            Exception Engine
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Exception handling for Zamp's AI employee
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <Step number={1} title="Pick an invoice" description="Choose one with an exception badge." />
          <Step number={2} title="Review the exception" description="Rules detect the issue instantly. No AI hallucination." />
          <Step number={3} title="Generate fix proposals" description="The model suggests fixes with confidence scores." />
          <Step number={4} title="Approve or reject" description="Your decisions teach the system for next time." />
          <Step number={5} title="Watch it learn" description="Similar exceptions start resolving automatically." />
        </div>

        <div className="px-6 py-4 border-t border-border bg-surface">
          <button
            onClick={onDismiss}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  readonly number: number;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">
        {number}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
