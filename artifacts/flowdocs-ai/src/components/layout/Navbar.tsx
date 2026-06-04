import { Link } from "wouter";
import { FileSpreadsheet, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-none tracking-tight">FlowDocs AI</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Precision Processing</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/tool">
            <Button size="sm" className="group">
              Try Now
              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
