import { useState, useEffect, useRef, type FormEvent } from 'react';
import type { Invoice, Exception, FixProposal, Review } from '../types/index.ts';
import InvoiceList from './InvoiceList';
import InvoiceDetail from './InvoiceDetail';
import ExceptionPanel from './ExceptionPanel';
import FixProposalCard from './FixProposalCard';
import LearningBadge from './LearningBadge';
import ReviewSummary from './ReviewSummary';
import Onboarding from './Onboarding';
import HowItWorks from './HowItWorks';
import MetricsDashboard from './MetricsDashboard';
import InvoiceUploader from './InvoiceUploader';
import { LoadingSpinner } from './LoadingSpinner';

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
  readonly onSelectInvoice: (invoice: Invoice) => void;
  readonly onGenerateProposals: () => void;
  readonly onReapplyLearnedRule: () => void;
  readonly onApproveFix: (proposal: FixProposal) => void;
  readonly onRejectFix: (proposal: FixProposal) => void;
  readonly onCustomFix: (description: string) => void;
  readonly onDismissOnboarding: () => void;
  readonly onIngestInvoices: (result: { invoices: Invoice[]; exceptions: Exception[] }) => void;
}

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
  onSelectInvoice,
  onGenerateProposals,
  onReapplyLearnedRule,
  onApproveFix,
  onRejectFix,
  onCustomFix,
  onDismissOnboarding,
  onIngestInvoices,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'reviews' | 'metrics' | 'how-it-works'>('invoices');

  const invoiceExceptions = currentInvoice
    ? exceptions.filter((e) => e.invoiceId === currentInvoice.id)
    : [];

  const reviewedExceptionIds = new Set(reviews.map((r) => r.exceptionId));
  const pendingExceptions = exceptions.filter(
    (e) => !reviewedExceptionIds.has(e.id)
  );
  const resolvedCount = reviewedExceptionIds.size;

  return (
    <div className="min-h-screen bg-surface text-foreground">
      {showOnboarding && (
        <Onboarding onDismiss={onDismissOnboarding} />
      )}

      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground font-mono tracking-tight">
              Exception Engine
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Exception handling for Zamp's AI employee
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">
              <span className="text-warning font-medium">{pendingExceptions.length}</span> pending
            </span>
            <span className="text-muted-foreground">
              <span className="text-success font-medium">{resolvedCount}</span> resolved
            </span>
            <span className="text-muted-foreground">
              <span className="text-muted-foreground font-medium">{reviews.length}</span> reviewed
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-1 mb-6 bg-card rounded-lg p-1 w-fit">
          <TabButton active={activeTab === 'invoices'} onClick={() => setActiveTab('invoices')}>
            Invoices
          </TabButton>
          <TabButton active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')}>
            Metrics
          </TabButton>
          <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>
            Reviews ({reviews.length})
          </TabButton>
          <TabButton active={activeTab === 'how-it-works'} onClick={() => setActiveTab('how-it-works')}>
            How it works
          </TabButton>
        </div>

        {activeTab === 'invoices' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-4 space-y-4">
              <InvoiceUploader companyId={companyId} onUpload={onIngestInvoices} />
              <InvoiceList
                invoices={invoices}
                exceptions={exceptions}
                currentInvoice={currentInvoice}
                onSelectInvoice={onSelectInvoice}
              />
            </div>

            <div className="col-span-8 space-y-4">
              {currentInvoice ? (
                <>
                  <InvoiceDetail
                    invoice={currentInvoice}
                    exceptions={invoiceExceptions}
                    reviewedExceptionIds={reviewedExceptionIds}
                  />

                  {currentException && (
                    <ExceptionPanel
                      exception={currentException}
                      hasLearnedRule={hasLearnedRule}
                      skippedRuleId={skippedRuleId}
                      onGenerateProposals={onGenerateProposals}
                      onReapplyLearnedRule={onReapplyLearnedRule}
                      isProcessing={isProcessing}
                    />
                  )}

                  {!currentException && !isProcessing && proposals.length === 0 && (
                    <div className="bg-success/10 border border-success/20 rounded-xl p-8 text-center animate-fade-in">
                      <p className="text-success text-sm font-medium">All exceptions resolved</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Select another invoice or check the Reviews tab
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 animate-fade-in">
                      <p className="text-danger text-sm font-medium">{error}</p>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="bg-card rounded-lg p-10 flex flex-col items-center gap-4 animate-fade-in">
                      <LoadingSpinner size="md" />
                      <div className="text-center">
                        <p className="text-sm text-foreground font-medium">
                          Analyzing exception
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Generating fix proposals from the exception details.
                        </p>
                      </div>
                      <ElapsedTimer running={isProcessing} />
                    </div>
                  )}

                  {!isProcessing && proposals.length > 0 && (
                    <div className="space-y-3 animate-slide-up">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Proposed Fixes
                      </h3>
                      {proposals.map((proposal) => (
                        <FixProposalCard
                          key={proposal.id}
                          proposal={proposal}
                          onApprove={() => onApproveFix(proposal)}
                          onReject={() => onRejectFix(proposal)}
                        />
                      ))}
                      <div className="mt-2">
                        <CustomFixInput onSubmit={onCustomFix} />
                      </div>
                    </div>
                  )}

                  {hasLearnedRule && !isProcessing && proposals.length === 0 && (
                    <LearningBadge
                      exceptionType={currentException?.type || 'missing_po'}
                    />
                  )}
                </>
              ) : (
                <div className="bg-card rounded-xl p-16 text-center animate-fade-in">
                  <p className="text-muted-foreground">
                    Select an invoice from the list to begin
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'reviews' && (
          <ReviewSummary reviews={reviews} exceptions={exceptions} />
        )}
        {activeTab === 'metrics' && (
          <MetricsDashboard companyId={companyId} />
        )}
        {activeTab === 'how-it-works' && (
          <HowItWorks />
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Or describe your own fix..."
        className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Apply
      </button>
    </form>
  );
}

function ElapsedTimer({ running }: { readonly running: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running]);

  if (!running) return null;

  return (
    <p className="text-xs text-muted-foreground font-mono tabular-nums">
      {elapsed}s elapsed
    </p>
  );
}
