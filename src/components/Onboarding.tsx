import { motion } from 'framer-motion';
import { Queue, MagnifyingGlass, Checks, Lightning } from '@phosphor-icons/react';

interface OnboardingProps {
  readonly onDismiss: () => void;
}

export default function Onboarding({ onDismiss }: OnboardingProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Exception Engine"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-card rounded-2xl border border-border max-w-md w-full overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Exception Engine</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Resolve invoice exceptions before they slow you down.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <Step icon={Queue} title="Pick an invoice" description="Choose one from the queue with an issue badge." />
          <Step icon={MagnifyingGlass} title="Review the exception" description="Rules detect the issue instantly. No AI hallucination." />
          <Step icon={Checks} title="Choose or write a fix" description="Use a proposal, skip it, or describe your own." />
          <Step icon={Lightning} title="Watch it learn" description="The same exception resolves automatically next time." />
        </div>

        <div className="px-6 py-4 border-t border-border bg-surface">
          <button
            onClick={onDismiss}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-colors text-sm active:scale-[0.98]"
          >
            Open the queue
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  description,
}: {
  readonly icon: React.ElementType;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon size={18} weight="fill" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
