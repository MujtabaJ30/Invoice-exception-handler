import { useState, useEffect, useRef, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Queue,
  ChartBar,
  Checks,
  Question,
  FileText,
  MagnifyingGlass,
  Lightbulb,
  CheckCircle,
  Sparkle,
} from '@phosphor-icons/react';
import type { Invoice, Exception, FixProposal, Review } from '../types/index.ts';
import InvoiceList from './InvoiceList';
import InvoiceDetail from './InvoiceDetail';
import ExceptionPanel from './ExceptionPanel';
import FixProposalCard from './FixProposalCard';
import ReviewSummary from './ReviewSummary';
import Onboarding from './Onboarding';
import HowItWorks from './HowItWorks';
import MetricsDashboard from './MetricsDashboard';
import InvoiceUploader from './InvoiceUploader';

interface DashboardProps {
  readonly companyId: string;
  readonly invoices: Invoice[];
  readonly exceptions: Exception[];
  readonly proposals: FixProposal[];
  readonly reviews: Review[];
  readonly currentInvoice: Invoice | null;
  readonly currentException: Exception | null;
  readonly isProcessing: boolean;
  readonly error: string | null;
  readonly showOnboarding: boolean;
  readonly hasLearnedRule: boolean;
  readonly skippedRuleId: string | null;
  readonly lastLearnedRule: { exceptionType: string; pattern: string; resolution: string } | null;
  readonly onSelectInvoice: (invoice: Invoice) => void;
  readonly onGenerateProposals: () => void;
  readonly onReapplyLearnedRule: () => void;
  readonly onApproveFix: (proposal: FixProposal) => void;
  readonly onRejectFix: (proposal: FixProposal) => void;
  readonly onCustomFix: (description: string) => void;
  readonly onDismissOnboarding: () => void;
  readonly onIngestInvoices: (result: { invoices: Invoice[]; exceptions: Exception[] }) => void;
}

type TabKey = 'queue' | 'impact' | 'decisions' | 'how-it-works';

const STAGES = [
  { key: 'document', label: 'Document', icon: FileText },
  { key: 'detect', label: 'Detect', icon: MagnifyingGlass },
  { key: 'understand', label: 'Understand', icon: Lightbulb },
  { key: 'propose', label: 'Propose', icon: Sparkle },
  { key: 'decide', label: 'Decide', icon: Checks },
  { key: 'learn', label: 'Learn', icon: CheckCircle },
] as const;

export default function Dashboard({
  companyId,
  invoices,
  exceptions,
  proposals,
  reviews,
  currentInvoice,
  currentException,
  isProcessing,
  error,
  showOnboarding,
  hasLearnedRule,
  skippedRuleId,
  lastLearnedRule,
  onSelectInvoice,
  onGenerateProposals,
  onReapplyLearnedRule,
  onApproveFix,
  onRejectFix,
  onCustomFix,
  onDismissOnboarding,
  onIngestInvoices,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('queue');

  const invoiceExceptions = currentInvoice
    ? exceptions.filter((e) => e.invoiceId === currentInvoice.id)
    : [];

  const reviewedExceptionIds = new Set(reviews.map((r) => r.exceptionId));
  const pendingExceptions = exceptions.filter((e) => !reviewedExceptionIds.has(e.id));
  const handledCount = reviews.filter((r) => r.status !== 'rejected').length;
  const rulesLearnedCount = reviews.filter((r) => r.status === 'approved' || r.status === 'corrected').length;

  const activeStage = getActiveStage(currentInvoice, currentException, proposals, isProcessing);
  const recommendedProposal = proposals.length > 0
    ? proposals.reduce((best, p) => (p.confidence > best.confidence ? p : best), proposals[0])
    : null;

  const proposalsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isProcessing || proposals.length > 0) {
      requestAnimationFrame(() => {
        proposalsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }, [isProcessing, proposals.length]);

  return (
    <div className="min-h-screen bg-surface text-foreground">
      {showOnboarding && <Onboarding onDismiss={onDismissOnboarding} />}

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm"
      >
        Skip to main content
      </a>

      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Exception Engine</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Resolve invoice exceptions before they slow you down.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <StatBadge value={pendingExceptions.length} label="to review" color="warning" />
            <StatBadge value={handledCount} label="handled" color="success" />
            <StatBadge value={rulesLearnedCount} label="rules learned" color="foreground" />
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-6 py-6">
        <div
          className="flex gap-1 mb-6 bg-card rounded-lg p-1 w-fit"
          role="tablist"
          aria-label="Main navigation"
        >
          <TabButton active={activeTab === 'queue'} onClick={() => setActiveTab('queue')} icon={Queue}>
            Queue
          </TabButton>
          <TabButton
            active={activeTab === 'impact'}
            onClick={() => setActiveTab('impact')}
            icon={ChartBar}
          >
            Impact
          </TabButton>
          <TabButton
            active={activeTab === 'decisions'}
            onClick={() => setActiveTab('decisions')}
            icon={Checks}
          >
            Decisions ({reviews.length})
          </TabButton>
          <TabButton
            active={activeTab === 'how-it-works'}
            onClick={() => setActiveTab('how-it-works')}
            icon={Question}
          >
            How it works
          </TabButton>
        </div>

        <div aria-live="polite" className="sr-only">
          {isProcessing ? 'Generating fix proposals' : ''}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {activeTab === 'queue' && (
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-4 space-y-4">
                  <InvoiceUploader companyId={companyId} onUpload={onIngestInvoices} />
                  <InvoiceList
                    invoices={invoices}
                    exceptions={exceptions}
                    reviewedExceptionIds={reviewedExceptionIds}
                    currentInvoice={currentInvoice}
                    onSelectInvoice={onSelectInvoice}
                  />
                </div>

                <div className="col-span-8 space-y-5">
                  {currentInvoice ? (
                    <>
                      <StageIndicator stages={STAGES} activeStage={activeStage} />

                      {lastLearnedRule && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-start gap-3"
                        >
                          <CheckCircle size={20} className="text-success shrink-0 mt-0.5" weight="fill" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Rule learned</p>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                              This fix was saved. Next time a similar exception appears, it will
                              resolve automatically.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      <InvoiceDetail
                        invoice={currentInvoice}
                        exceptions={invoiceExceptions}
                        reviewedExceptionIds={reviewedExceptionIds}
                      />

                      {currentException && (
                        <>
                          <ExceptionPanel
                            exception={currentException}
                            hasLearnedRule={hasLearnedRule}
                            skippedRuleId={skippedRuleId}
                            onGenerateProposals={onGenerateProposals}
                            onReapplyLearnedRule={onReapplyLearnedRule}
                            isProcessing={isProcessing}
                          />
                          <div ref={proposalsEndRef} />
                        </>
                      )}

                      {!currentException && !isProcessing && proposals.length === 0 && (
                        <EmptyState
                          icon={CheckCircle}
                          title="No open exceptions on this invoice."
                          subtitle="Select another invoice from the queue or review your decisions."
                        />
                      )}

                      {error && (
                        <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 animate-fade-in">
                          <p className="text-danger text-sm font-medium">{error}</p>
                        </div>
                      )}

                      {!isProcessing && proposals.length > 0 && (
                        <div ref={proposalsEndRef} className="space-y-3 animate-slide-up">
                          <div className="flex items-center gap-2">
                            <Sparkle size={16} className="text-primary" />
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Proposed fixes
                            </h3>
                          </div>
                          {proposals.map((proposal) => (
                            <FixProposalCard
                              key={proposal.id}
                              proposal={proposal}
                              isRecommended={recommendedProposal?.id === proposal.id}
                              onUse={() => onApproveFix(proposal)}
                              onSkip={() => onRejectFix(proposal)}
                            />
                          ))}
                          <CustomFixInput onSubmit={onCustomFix} />
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyState
                      icon={Queue}
                      title="Select an invoice to start"
                      subtitle="The queue on the left shows invoices with pending exceptions. Pick one to review."
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'decisions' && <ReviewSummary reviews={reviews} exceptions={exceptions} />}
            {activeTab === 'impact' && <MetricsDashboard companyId={companyId} />}
            {activeTab === 'how-it-works' && <HowItWorks />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function getActiveStage(
  currentInvoice: Invoice | null,
  currentException: Exception | null,
  proposals: FixProposal[],
  isProcessing: boolean
): string {
  if (!currentInvoice) return 'document';
  if (!currentException) return 'document';
  if (isProcessing) return 'propose';
  if (proposals.length > 0) return 'propose';
  return 'understand';
}

function StageIndicator({
  stages,
  activeStage,
}: {
  readonly stages: readonly { key: string; label: string; icon: React.ElementType }[];
  readonly activeStage: string;
}) {
  const activeIndex = stages.findIndex((s) => s.key === activeStage);

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.key === activeStage;
          const isCompleted = index < activeIndex;

          return (
            <div key={stage.key} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isCompleted
                    ? 'bg-success/15 text-success'
                    : 'bg-surface text-muted-foreground border border-border'
                }`}
              >
                <Icon size={16} weight={isActive || isCompleted ? 'fill' : 'regular'} />
              </div>
              <span
                className={`text-[11px] font-medium uppercase tracking-wide ${
                  isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative h-1 bg-surface rounded-full mt-3 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-primary rounded-full"
          initial={false}
          animate={{ width: `${((activeIndex + 1) / stages.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly icon: React.ElementType;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon size={16} weight={active ? 'fill' : 'regular'} />
      {children}
    </button>
  );
}

function StatBadge({
  value,
  label,
  color,
}: {
  readonly value: number;
  readonly label: string;
  readonly color: 'warning' | 'success' | 'foreground';
}) {
  const colorClasses = {
    warning: 'text-warning',
    success: 'text-success',
    foreground: 'text-foreground',
  };

  return (
    <span className="text-muted-foreground">
      <span className={`font-semibold ${colorClasses[color]}`}>{value}</span>{' '}
      <span className="text-xs">{label}</span>
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  readonly icon: React.ElementType;
  readonly title: string;
  readonly subtitle: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-12 text-center shadow-sm animate-fade-in">
      <Icon size={32} className="text-muted-foreground mx-auto mb-3" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{subtitle}</p>
    </div>
  );
}

function CustomFixInput({ onSubmit }: { readonly onSubmit: (description: string) => void }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <label htmlFor="custom-fix" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
        Or describe a different fix
      </label>
      <div className="flex gap-2">
        <input
          id="custom-fix"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Describe a different fix…"
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          Apply custom fix
        </button>
      </div>
    </form>
  );
}
