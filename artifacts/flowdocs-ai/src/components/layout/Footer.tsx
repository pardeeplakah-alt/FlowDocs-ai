import { FileSpreadsheet } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-8 flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight text-foreground">FlowDocs AI</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left max-w-xs">
            The smarter way to process spreadsheets. Fast, secure, and precise.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 md:items-end">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FlowDocs AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
