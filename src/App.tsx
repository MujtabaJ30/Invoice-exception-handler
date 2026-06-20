import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  Invoice,
  Exception,
  FixProposal,
  Review,
  ExceptionType,
} from './types';
import { generateDemoInvoices } from './lib/invoices';
import { generateFixProposals } from './lib/api';
import { generateExceptionPattern } from './lib/exceptions';
import {
  addLearnedRule,
  buildLearnedProposal,
  getLearnedRules,
} from './lib/learning';
import { createReview, fetchInvoices, fetchReviews, resetDatabase } from './lib/api';
import type { DbRule } from './lib/db';
import Dashboard from './components/Dashboard';
import { LoadingSpinner } from './components/LoadingSpinner';

interface AppState {
  companyId: string;
  invoices: Invoice[];
  exceptions: Exception[];
  proposals: FixProposal[];
  reviews: Review[];
  learnedRules: DbRule[];
  currentInvoice: Invoice | null;
  currentException: Exception | null;
  isProcessing: boolean;
  error: string | null;
  showOnboarding: boolean;
  skippedLearnedRuleIds: Set<string>;
  lastLearnedRule: DbRule | null;
}

const COMPANY_ID_KEY = 'zamp_exception_engine_company_id';
const LEARN_BANNER_DURATION_MS = 3000;

const INITIAL_STATE: Omit<AppState, 'companyId'> = {
  invoices: [],
  exceptions: [],
  proposals: [],
  reviews: [],
  learnedRules: [],
  currentInvoice: null,
  currentException: null,
  isProcessing: false,
  error: null,
  showOnboarding: true,
  skippedLearnedRuleIds: new Set(),
  lastLearnedRule: null,
};

function getOrCreateCompanyId(): string {
  if (typeof window === 'undefined') return 'default';
  const existing = localStorage.getItem(COMPANY_ID_KEY);
  if (existing) return existing;
  const id = `co_${Math.random().toString(36).substring(2, 11)}`;
  localStorage.setItem(COMPANY_ID_KEY, id);
  return id;
}

function buildFallbackProposals(
  exceptionType: ExceptionType,
  exceptionId: string
): FixProposal[] {
  const templates: Record<ExceptionType, FixProposal[]> = {
    missing_po: [
      { id: 'fb_po_1', exceptionId, description: 'Add PO number from related purchase requisition', confidence: 0.65, reasoning: 'Most missing POs can be resolved by checking the purchase requisition system', action: { type: 'approve', data: {} } },
      { id: 'fb_po_2', exceptionId, description: 'Create retroactive PO and attach to invoice', confidence: 0.4, reasoning: 'For cases where PO was never created, generate one retroactively', action: { type: 'modify', data: {} } },
    ],
    duplicate_invoice: [
      { id: 'fb_dup_1', exceptionId, description: 'Reject as duplicate, mark original as source of truth', confidence: 0.9, reasoning: 'Duplicate invoice numbers typically indicate resubmission or system error', action: { type: 'reject', data: {} } },
    ],
    amount_mismatch: [
      { id: 'fb_amt_1', exceptionId, description: 'Correct total to match subtotal + tax', confidence: 0.75, reasoning: 'Arithmetic errors are common, recalculate and update', action: { type: 'modify', data: {} } },
      { id: 'fb_amt_2', exceptionId, description: 'Flag for manual review by accounts payable', confidence: 0.5, reasoning: 'If discrepancy is large, human review is safer', action: { type: 'escalate', data: {} } },
    ],
    tax_calculation_error: [
      { id: 'fb_tax_1', exceptionId, description: 'Recalculate tax from line items using correct rates', confidence: 0.8, reasoning: 'Tax errors are usually from incorrect rate application', action: { type: 'modify', data: {} } },
    ],
    vendor_not_found: [
      { id: 'fb_vnd_1', exceptionId, description: 'Add vendor to master list and verify credentials', confidence: 0.7, reasoning: 'New vendors should be vetted before payment', action: { type: 'approve', data: {} } },
      { id: 'fb_vnd_2', exceptionId, description: 'Escalate to procurement for vendor verification', confidence: 0.5, reasoning: 'Unknown vendors require procurement team validation', action: { type: 'escalate', data: {} } },
    ],
    date_in_future: [
      { id: 'fb_date_1', exceptionId, description: 'Verify invoice date with vendor, may be a typo', confidence: 0.85, reasoning: 'Future dates are typically data entry errors', action: { type: 'modify', data: {} } },
    ],
    negative_amount: [
      { id: 'fb_neg_1', exceptionId, description: 'Review for credit memo, possibly intentional', confidence: 0.6, reasoning: 'Negative amounts may be legitimate credit memos', action: { type: 'approve', data: {} } },
    ],
  };

  const entries = templates[exceptionType];
  if (entries) return entries;

  return [
    { id: `fb_gen_${Date.now()}`, exceptionId, description: 'Review manually and apply standard resolution', confidence: 0.5, reasoning: 'Generic fallback, no specific template available', action: { type: 'approve', data: {} } },
  ];
}

async function loadInitialData(companyId: string) {
  try {
    const [{ invoices: demoInvoices, exceptions: demoExceptions }, { invoices: storedInvoices, exceptions: storedExceptions }, storedReviews, storedRules] = await Promise.all([
      Promise.resolve(generateDemoInvoices()),
      fetchInvoices(companyId),
      fetchReviews(companyId),
      getLearnedRules(companyId),
    ]);

    const allInvoices = [...storedInvoices, ...demoInvoices];
    const allExceptions = [...storedExceptions, ...demoExceptions];

    return {
      invoices: allInvoices,
      exceptions: allExceptions,
      reviews: storedReviews.map((r) => ({
        id: r.id,
        exceptionId: r.exceptionId,
        proposalId: r.proposalId,
        status: r.status,
        decision: r.decision,
        correctedBy: r.correctedBy,
        reviewedAt: r.reviewedAt,
        notes: r.notes,
      })),
      learnedRules: storedRules,
    };
  } catch (error) {
    console.error('Failed to load initial data:', error);
    const { invoices, exceptions } = generateDemoInvoices();
    return { invoices, exceptions, reviews: [], learnedRules: [] };
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(() => ({
    ...INITIAL_STATE,
    companyId: getOrCreateCompanyId(),
  }));
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let cancelled = false;
    loadInitialData(state.companyId).then((data) => {
      if (cancelled) return;
      setState((prev) => ({
        ...prev,
        invoices: data.invoices,
        exceptions: data.exceptions,
        reviews: data.reviews,
        learnedRules: data.learnedRules,
        currentInvoice: data.invoices[0] || null,
        currentException: data.exceptions.find((e) => e.invoiceId === data.invoices[0]?.id) || null,
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [state.companyId]);

  useEffect(() => {
    if (!state.lastLearnedRule) return;
    const timeoutId = setTimeout(() => {
      setState((prev) => ({ ...prev, lastLearnedRule: null }));
    }, LEARN_BANNER_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [state.lastLearnedRule]);

  const learnedRuleForCurrent = state.currentException
    ? state.learnedRules.find(
        (rule) =>
          rule.exceptionType === state.currentException!.type &&
          rule.pattern === generateExceptionPattern(state.currentException!.type, state.currentException!.details)
      ) || null
    : null;

  const isRuleSkipped = learnedRuleForCurrent !== null && state.skippedLearnedRuleIds.has(learnedRuleForCurrent.id);
  const matchingRuleForCurrent = isRuleSkipped ? null : learnedRuleForCurrent;
  const hasLearnedRule = learnedRuleForCurrent !== null;
  const skippedRuleId = isRuleSkipped ? learnedRuleForCurrent.id : null;

  const handleDismissOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, showOnboarding: false }));
  }, []);

  const handleSelectInvoice = useCallback((invoice: Invoice) => {
    setState((prev) => {
      const reviewedIds = new Set(prev.reviews.map((r) => r.exceptionId));
      const invoiceExceptions = prev.exceptions.filter(
        (e) => e.invoiceId === invoice.id
      );
      const firstUnresolved = invoiceExceptions.find((e) => !reviewedIds.has(e.id)) || null;
      return {
        ...prev,
        currentInvoice: invoice,
        currentException: firstUnresolved,
        proposals: [],
        error: null,
        skippedLearnedRuleIds: new Set(),
      };
    });
  }, []);

  const handleSelectException = useCallback((exception: Exception) => {
    setState((prev) => ({
      ...prev,
      currentException: exception,
      proposals: [],
      error: null,
      skippedLearnedRuleIds: new Set(),
    }));
  }, []);

  const handleGenerateProposals = useCallback(async () => {
    const { currentInvoice, currentException, learnedRules, companyId } = stateRef.current;
    if (!currentInvoice || !currentException) return;

    setState((prev) => ({ ...prev, isProcessing: true, error: null, proposals: [] }));

    try {
      if (matchingRuleForCurrent) {
        const learnedProposal = buildLearnedProposal(matchingRuleForCurrent, currentException.id);
        setState((prev) => ({
          ...prev,
          proposals: [learnedProposal],
          isProcessing: false,
        }));
        return;
      }

      const response = await generateFixProposals({
        companyId,
        exceptionType: currentException.type,
        invoice: currentInvoice,
        exception: currentException,
        learnedRules,
      });

      setState((prev) => ({
        ...prev,
        proposals: response.proposals,
        isProcessing: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate proposals';
      const fallbackProposals = buildFallbackProposals(currentException.type, currentException.id);

      setState((prev) => ({
        ...prev,
        proposals: fallbackProposals,
        isProcessing: false,
        error: errorMessage,
      }));
    }
  }, [matchingRuleForCurrent]);

  const moveToNextException = useCallback((currentInvoice: Invoice, updatedReviews: Review[]) => {
    const reviewedIds = new Set(updatedReviews.map((r) => r.exceptionId));
    return (
      stateRef.current.exceptions.find(
        (e) => e.invoiceId === currentInvoice.id && !reviewedIds.has(e.id)
      ) || null
    );
  }, []);

  const handleApproveFix = useCallback((proposal: FixProposal) => {
    const { currentException, currentInvoice, companyId } = stateRef.current;
    if (!currentException || !currentInvoice) return;

    const now = new Date().toISOString();
    const review: Review = {
      id: `review_${Date.now()}`,
      exceptionId: currentException.id,
      proposalId: proposal.id,
      status: 'approved',
      decision: proposal,
      correctedBy: null,
      reviewedAt: now,
      notes: null,
    };

    const pattern = generateExceptionPattern(currentException.type, currentException.details);
    const localRule: DbRule = {
      id: `rule_${Date.now()}`,
      companyId,
      exceptionType: currentException.type,
      pattern,
      resolution: proposal.description,
      confidence: proposal.confidence,
      appliedCount: 1,
      createdAt: now,
      lastAppliedAt: now,
    };

    setState((prev) => {
      const updatedReviews = [...prev.reviews, review];
      const nextException = moveToNextException(currentInvoice, updatedReviews);
      return {
        ...prev,
        reviews: updatedReviews,
        currentException: nextException,
        proposals: [],
        learnedRules: [
          ...prev.learnedRules.filter((r) => r.id !== localRule.id),
          localRule,
        ],
        lastLearnedRule: localRule,
      };
    });

    createReview(companyId, {
      exceptionId: currentException.id,
      invoiceId: currentInvoice.id,
      proposalId: proposal.id,
      status: 'approved',
      decision: proposal,
      correctedBy: null,
      notes: null,
    }).catch(() => {});

    addLearnedRule(companyId, currentException.type, pattern, proposal.description, proposal.confidence).catch(() => {});
  }, [moveToNextException]);

  const handleRejectFix = useCallback((proposal: FixProposal) => {
    const { currentException, currentInvoice, companyId } = stateRef.current;
    if (!currentException || !currentInvoice) return;

    const now = new Date().toISOString();
    const review: Review = {
      id: `review_${Date.now()}`,
      exceptionId: currentException.id,
      proposalId: proposal.id,
      status: 'rejected',
      decision: null,
      correctedBy: null,
      reviewedAt: now,
      notes: 'Rejected by user',
    };

    setState((prev) => {
      const isLearnedProposal = proposal.id.startsWith('learned_');
      const remainingProposals = prev.proposals.filter((p) => p.id !== proposal.id);

      const updatedSkipped = new Set(prev.skippedLearnedRuleIds);
      if (isLearnedProposal) {
        const ruleId = proposal.action.data?.learnedRuleId;
        if (typeof ruleId === 'string') updatedSkipped.add(ruleId);
      }

      return {
        ...prev,
        reviews: [...prev.reviews, review],
        proposals: remainingProposals,
        skippedLearnedRuleIds: updatedSkipped,
      };
    });

    createReview(companyId, {
      exceptionId: currentException.id,
      invoiceId: currentInvoice.id,
      proposalId: proposal.id,
      status: 'rejected',
      decision: null,
      correctedBy: null,
      notes: 'Rejected by user',
    }).catch(() => {});
  }, []);

  const handleReapplyLearnedRule = useCallback(() => {
    const { currentException } = stateRef.current;
    if (!currentException || !learnedRuleForCurrent) return;

    const learnedProposal = buildLearnedProposal(learnedRuleForCurrent, currentException.id);
    setState((prev) => ({
      ...prev,
      skippedLearnedRuleIds: new Set(),
      proposals: [learnedProposal],
    }));
  }, [learnedRuleForCurrent]);

  const handleCustomFix = useCallback((description: string) => {
    const { currentException, currentInvoice, companyId } = stateRef.current;
    if (!currentException || !currentInvoice) return;

    const now = new Date().toISOString();
    const customProposal: FixProposal = {
      id: `custom_${Date.now()}`,
      exceptionId: currentException.id,
      description,
      confidence: 1.0,
      reasoning: 'Custom fix provided by user',
      action: { type: 'approve', data: { custom: true } },
    };

    const review: Review = {
      id: `review_${Date.now()}`,
      exceptionId: currentException.id,
      proposalId: customProposal.id,
      status: 'corrected',
      decision: customProposal,
      correctedBy: 'user',
      reviewedAt: now,
      notes: 'Custom fix',
    };

    const pattern = generateExceptionPattern(currentException.type, currentException.details);
    const localRule: DbRule = {
      id: `rule_${Date.now()}`,
      companyId,
      exceptionType: currentException.type,
      pattern,
      resolution: description,
      confidence: 0.9,
      appliedCount: 1,
      createdAt: now,
      lastAppliedAt: now,
    };

    setState((prev) => {
      const updatedReviews = [...prev.reviews, review];
      const nextException = moveToNextException(currentInvoice, updatedReviews);
      return {
        ...prev,
        reviews: updatedReviews,
        currentException: nextException,
        proposals: [],
        learnedRules: [
          ...prev.learnedRules.filter((r) => r.id !== localRule.id),
          localRule,
        ],
        lastLearnedRule: localRule,
      };
    });

    createReview(companyId, {
      exceptionId: currentException.id,
      invoiceId: currentInvoice.id,
      proposalId: customProposal.id,
      status: 'corrected',
      decision: customProposal,
      correctedBy: 'user',
      notes: 'Custom fix',
    }).catch(() => {});

    addLearnedRule(companyId, currentException.type, pattern, description, 0.9).catch(() => {});
  }, [moveToNextException]);

  const handleIngestInvoices = useCallback((result: { invoices: Invoice[]; exceptions: Exception[] }) => {
    setState((prev) => {
      const existingIds = new Set(prev.invoices.map((i) => i.id));
      const newInvoices = result.invoices.filter((i) => !existingIds.has(i.id));
      const newExceptions = result.exceptions.filter((e) => newInvoices.some((i) => i.id === e.invoiceId));
      return {
        ...prev,
        invoices: [...newInvoices, ...prev.invoices],
        exceptions: [...newExceptions, ...prev.exceptions],
      };
    });
  }, []);

  const handleResetDemo = useCallback(async () => {
    const { companyId } = stateRef.current;
    setState((prev) => ({ ...prev, isProcessing: true, error: null }));
    try {
      await resetDatabase(companyId);
      const { invoices: demoInvoices, exceptions: demoExceptions } = generateDemoInvoices();
      setState({
        ...INITIAL_STATE,
        companyId,
        invoices: demoInvoices,
        exceptions: demoExceptions,
        reviews: [],
        learnedRules: [],
        currentInvoice: demoInvoices[0] || null,
        currentException: demoExceptions[0] || null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset failed';
      setState((prev) => ({ ...prev, error: message, isProcessing: false }));
    }
  }, []);

  if (state.invoices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Dashboard
      companyId={state.companyId}
      invoices={state.invoices}
      exceptions={state.exceptions}
      proposals={state.proposals}
      reviews={state.reviews}
      currentInvoice={state.currentInvoice}
      currentException={state.currentException}
      isProcessing={state.isProcessing}
      error={state.error}
      showOnboarding={state.showOnboarding}
      hasLearnedRule={hasLearnedRule}
      skippedRuleId={skippedRuleId}
      lastLearnedRule={state.lastLearnedRule}
      onSelectInvoice={handleSelectInvoice}
      onSelectException={handleSelectException}
      onGenerateProposals={handleGenerateProposals}
      onReapplyLearnedRule={handleReapplyLearnedRule}
      onApproveFix={handleApproveFix}
      onRejectFix={handleRejectFix}
      onCustomFix={handleCustomFix}
      onDismissOnboarding={handleDismissOnboarding}
      onIngestInvoices={handleIngestInvoices}
      onResetDemo={handleResetDemo}
    />
  );
}
