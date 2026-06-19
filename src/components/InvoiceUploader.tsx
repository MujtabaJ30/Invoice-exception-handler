import { useState, useCallback } from 'react';
import { ingestInvoices } from '../lib/api';
import type { Invoice, Exception } from '../types/index.ts';

interface InvoiceUploaderProps {
  readonly companyId: string;
  readonly onUpload: (result: { invoices: Invoice[]; exceptions: Exception[] }) => void;
}

export default function InvoiceUploader({ companyId, onUpload }: InvoiceUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setIsLoading(true);
      setError(null);

      try {
        const invoices: Invoice[] = [];
        for (const file of Array.from(files)) {
          const text = await file.text();
          const parsed = JSON.parse(text);
          const batch = Array.isArray(parsed) ? parsed : [parsed];
          invoices.push(...batch);
        }

        const result = await ingestInvoices(companyId, invoices);
        onUpload({ invoices: result.invoices, exceptions: result.exceptions });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to ingest invoices';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Ingest invoices</h3>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
        }`}
      >
        <input
          type="file"
          accept=".json"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="invoice-upload"
        />
        <label
          htmlFor="invoice-upload"
          className="cursor-pointer text-sm text-muted-foreground"
        >
          {isLoading ? (
            <span>Processing files...</span>
          ) : (
            <span>
              Drop JSON invoices here or <span className="text-primary">click to browse</span>
            </span>
          )}
        </label>
      </div>
      {error && (
        <p className="text-xs text-danger mt-2">{error}</p>
      )}
    </div>
  );
}
