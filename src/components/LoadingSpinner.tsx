interface LoadingSpinnerProps {
  readonly size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-[3px]',
};

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center" role="status" aria-label="Loading">
      <div
        className={`${SIZE_CLASSES[size]} border-primary/20 border-t-primary rounded-full animate-spin`}
      />
    </div>
  );
}
