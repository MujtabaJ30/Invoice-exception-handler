import { Info, Warning, WarningOctagon, Siren } from '@phosphor-icons/react';
import type { ExceptionSeverity } from '../types/index.ts';

interface SeverityIconProps {
  readonly severity: ExceptionSeverity;
  readonly size?: number;
  readonly className?: string;
}

const ICONS = {
  low: Info,
  medium: Warning,
  high: WarningOctagon,
  critical: Siren,
} as const;

const LABELS: Record<ExceptionSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export default function SeverityIcon({ severity, size = 20, className = '' }: SeverityIconProps) {
  const Icon = ICONS[severity];
  return (
    <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
      <Icon size={size} weight="fill" />
      <span className="sr-only">{LABELS[severity]} severity</span>
    </span>
  );
}

export function SeverityLabel({ severity }: { readonly severity: ExceptionSeverity }) {
  return <span className="sr-only">{LABELS[severity]} severity</span>;
}
