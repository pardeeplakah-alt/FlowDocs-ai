import { useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  FileSpreadsheet, 
  Sparkles, 
  ArrowRight, 
  Wand2, 
  ListOrdered, 
  PieChart, 
  RefreshCw,
  UploadCloud,
  Settings2,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  // Enforce dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="container mx-auto px-4 sm:px-8 relative z-10 flex flex-col items-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-sm text-muted-foreground mb-8 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Spreadsheet processing, redefined.</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-4xl text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
            >
              The Smarter Way to <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                Process Spreadsheets
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl"
            >
              Upload spreadsheet files, choose an action, and receive a processed result in seconds. Zero configuration, absolute precision.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link href="/tool">
                <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 group">
                  Start Processing
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="py-24 bg-zinc-950/50 border-y border-white/5">
          <div className="container mx-auto px-4 sm:px-8">
            <div className="flex flex-col items-center mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Surgical Precision Tools</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl">Everything you need to sanitize, structure, and synthesize your data.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <Link href="/tool?action=clean">
                <div className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-primary/50 cursor-pointer">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                    <Wand2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Clean Data</h3>
                  <p className="text-muted-foreground">Remove duplicates, eliminate empty rows, trim excess spaces, and normalize headers automatically.</p>
                </div>
              </Link>

              <Link href="/tool?action=organize">
                <div className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-primary/50 cursor-pointer">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                    <ListOrdered className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Organize Data</h3>
                  <p className="text-muted-foreground">Sort intelligently by column, group similar records, and reorder columns logically for better readability.</p>
                </div>
              </Link>

              <Link href="/tool?action=summary">
                <div className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-primary/50 cursor-pointer">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                    <PieChart className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Generate Summary</h3>
                  <p className="text-muted-foreground">Analyze your dataset instantly. Get crucial statistics, missing value percentages, and key insights.</p>
                </div>
              </Link>

              <Link href="/tool?action=convert">
                <div className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-primary/50 cursor-pointer">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <RefreshCw className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Convert Format</h3>
                  <p className="text-muted-foreground">Seamlessly translate between CSV and XLSX formats without losing data integrity.</p>
                </div>
              </Link>
            </div>
            
            <div className="mt-12 text-center">
              <span className="inline-block rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                More tools coming soon
              </span>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-8">
            <div className="flex flex-col items-center mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frictionless Workflow</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl">Three steps to perfectly formatted data.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 mb-6">
                  <Settings2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">1. Choose Action</h3>
                <p className="text-muted-foreground">Select the specific processing tool you need for your dataset.</p>
              </div>
              <div className="flex flex-col items-center text-center relative">
                <div className="hidden md:block absolute top-8 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 mb-6">
                  <UploadCloud className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">2. Upload File</h3>
                <p className="text-muted-foreground">Drag and drop your XLSX or CSV file into our secure processor.</p>
              </div>
              <div className="flex flex-col items-center text-center relative">
                <div className="hidden md:block absolute top-8 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 mb-6">
                  <Download className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">3. Get Results</h3>
                <p className="text-muted-foreground">Download your pristine, processed file in seconds.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-zinc-950/50 border-t border-white/5">
          <div className="container mx-auto px-4 sm:px-8 max-w-3xl">
            <div className="flex flex-col items-center mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg">What file formats are supported?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  FlowDocs AI currently supports Microsoft Excel (.xlsx) and Comma Separated Values (.csv) files. Support for legacy .xls and other formats is coming soon.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg">Is my data secure?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Absolutely. Files are processed securely in memory and are deleted from our servers immediately after you download the result. We do not store, train on, or share your data.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg">Are there file size limits?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Currently, we support files up to 50MB. For larger datasets, we recommend splitting your file or contacting enterprise support.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-lg">How does the "Organize Data" sort work?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Once you upload your file, we instantly analyze the headers. You can then select which column to sort by and choose ascending or descending order before processing.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
