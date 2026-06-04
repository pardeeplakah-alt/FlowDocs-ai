import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wand2, ListOrdered, PieChart, RefreshCw, 
  UploadCloud, FileSpreadsheet, X, CheckCircle2, 
  AlertCircle, Download, ArrowLeft, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/Navbar";
import { processFile, getColumns, downloadFile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "react-day-picker";

type ActionType = "clean" | "organize" | "summary" | "convert";

export default function Tool() {
  const { toast } = useToast();
  const [action, setAction] = useState<ActionType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Organize specific state
  const [columns, setColumns] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSetFile = async (selectedFile: File) => {
    setError(null);
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.csv')) {
      setError("Only .xlsx and .csv files are supported.");
      return;
    }
    setFile(selectedFile);

    if (action === "organize") {
      setIsLoadingColumns(true);
      try {
        const cols = await getColumns(selectedFile);
        setColumns(cols);
        if (cols.length > 0) setSortColumn(cols[0]);
      } catch (err: any) {
        setError(err.message || "Failed to parse columns.");
      } finally {
        setIsLoadingColumns(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const resetState = () => {
    setAction(null);
    setFile(null);
    setColumns([]);
    setResult(null);
    setError(null);
  };

  const handleProcess = async () => {
    if (!action || !file) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const extra: Record<string, string> = {};
      if (action === "organize") {
        if (!sortColumn) throw new Error("Please select a column to sort by.");
        extra.sortColumn = sortColumn;
        extra.sortDirection = sortDirection;
      }
      
      const data = await processFile(action, file, extra);
      setResult(data);
      toast({ title: "Processing Complete", description: "Your file was processed successfully." });
    } catch (err: any) {
      setError(err.message || "An error occurred during processing.");
      toast({ title: "Processing Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result && result.fileId) {
      downloadFile(result.fileId, result.fileName || `processed_${file?.name}`);
    }
  };

  const renderActionSelection = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Select an Action</h2>
        <p className="text-muted-foreground mt-2">What would you like to do with your spreadsheet?</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { id: "clean", icon: Wand2, title: "Clean Data", desc: "Remove duplicates, empty rows, and normalize fields." },
          { id: "organize", icon: ListOrdered, title: "Organize Data", desc: "Sort intelligently and group similar records." },
          { id: "summary", icon: PieChart, title: "Generate Summary", desc: "Analyze dataset and show key statistics." },
          { id: "convert", icon: RefreshCw, title: "Convert Format", desc: "Convert seamlessly between CSV and XLSX." }
        ].map((item) => (
          <Card 
            key={item.id}
            className="p-6 cursor-pointer border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all group"
            onClick={() => setAction(item.id as ActionType)}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white/5 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );

  const renderUpload = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={resetState}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="capitalize">{action}</span> Data
          </h2>
          <p className="text-sm text-muted-foreground">Upload your file to continue.</p>
        </div>
      </div>

      {!file ? (
        <div 
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
            isDragging ? 'border-primary bg-primary/5' : 'border-white/20 hover:border-white/40 hover:bg-white/5'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-1">Click or drag file to this area to upload</p>
          <p className="text-sm text-muted-foreground mb-4">Supports .xlsx and .csv files</p>
          <Button variant="secondary" size="sm">Browse Files</Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-4 border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setFile(null)} disabled={isProcessing}>
              <X className="h-4 w-4" />
            </Button>
          </Card>

          {action === "organize" && (
            <Card className="p-6 border-white/10 space-y-6">
              <h3 className="font-semibold mb-4">Sorting Options</h3>
              {isLoadingColumns ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading columns...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sort By Column</Label>
                    <Select value={sortColumn} onValueChange={setSortColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <RadioGroup value={sortDirection} onValueChange={(v: any) => setSortDirection(v)} className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="asc" id="asc" />
                        <Label htmlFor="asc">A → Z</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="desc" id="desc" />
                        <Label htmlFor="desc">Z → A</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}
            </Card>
          )}

          {error && (
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              size="lg" 
              onClick={handleProcess} 
              disabled={isProcessing || (action === "organize" && (!sortColumn || isLoadingColumns))}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process File"
              )}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderResult = () => {
    if (!result) return null;

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center gap-3 text-emerald-500 mb-6">
          <CheckCircle2 className="h-8 w-8" />
          <h2 className="text-2xl font-bold text-foreground">Processing Complete</h2>
        </div>

        <Card className="p-6 border-white/10 bg-white/5 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <p className="text-sm text-muted-foreground">Original File</p>
              <p className="font-medium">{file?.name}</p>
            </div>
            {result.fileId && (
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" /> Download Result
              </Button>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="font-semibold text-lg">Results Summary</h3>
            <p className="text-sm text-muted-foreground">{result.summary || result.overview}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="p-4 rounded-lg bg-background border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">Total Rows</p>
                <p className="text-xl font-bold">{result.totalRows}</p>
              </div>
              <div className="p-4 rounded-lg bg-background border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">Total Columns</p>
                <p className="text-xl font-bold">{result.totalColumns}</p>
              </div>
              
              {action === "clean" && (
                <>
                  <div className="p-4 rounded-lg bg-background border border-white/10">
                    <p className="text-xs text-muted-foreground mb-1">Duplicates Removed</p>
                    <p className="text-xl font-bold text-blue-400">{result.duplicatesRemoved}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-white/10">
                    <p className="text-xs text-muted-foreground mb-1">Empty Rows Removed</p>
                    <p className="text-xl font-bold text-amber-400">{result.emptyRowsRemoved}</p>
                  </div>
                </>
              )}
              
              {action === "organize" && (
                <>
                  <div className="p-4 rounded-lg bg-background border border-white/10">
                    <p className="text-xs text-muted-foreground mb-1">Sorted By</p>
                    <p className="text-sm font-bold truncate" title={result.sortedBy}>{result.sortedBy}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-white/10">
                    <p className="text-xs text-muted-foreground mb-1">Direction</p>
                    <p className="text-sm font-bold uppercase">{result.sortDirection}</p>
                  </div>
                </>
              )}

              {action === "convert" && (
                <>
                  <div className="p-4 rounded-lg bg-background border border-white/10">
                    <p className="text-xs text-muted-foreground mb-1">Original Format</p>
                    <p className="text-xl font-bold uppercase">{result.originalFormat}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-white/10">
                    <p className="text-xs text-muted-foreground mb-1">Converted To</p>
                    <p className="text-xl font-bold uppercase text-emerald-400">{result.convertedFormat}</p>
                  </div>
                </>
              )}

              {action === "summary" && (
                <>
                  <div className="p-4 rounded-lg bg-background border border-white/10">
                    <p className="text-xs text-muted-foreground mb-1">Missing Values</p>
                    <p className="text-xl font-bold text-rose-400">{result.totalMissingValues}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-white/10">
                    <p className="text-xs text-muted-foreground mb-1">Missing %</p>
                    <p className="text-xl font-bold text-rose-400">{result.missingValuePct}%</p>
                  </div>
                </>
              )}
            </div>

            {action === "summary" && result.keyInsights && result.keyInsights.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Key Insights</h4>
                <ul className="space-y-2">
                  {result.keyInsights.map((insight: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {action === "summary" && result.columnStats && result.columnStats.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <h4 className="font-medium mb-3">Column Analysis</h4>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Name</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Unique</th>
                      <th className="px-4 py-3 rounded-tr-lg">Missing %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.columnStats.map((stat: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3 font-medium">{stat.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{stat.type}</td>
                        <td className="px-4 py-3">{stat.uniqueValues}</td>
                        <td className="px-4 py-3">
                          <span className={stat.missingPct > 0 ? "text-amber-400" : "text-emerald-400"}>
                            {stat.missingPct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={resetState}>Process Another File</Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-8 max-w-4xl">
          <AnimatePresence mode="wait">
            {!action && !result && (
              <motion.div key="selection" exit={{ opacity: 0, y: -10 }}>
                {renderActionSelection()}
              </motion.div>
            )}
            
            {action && !result && (
              <motion.div key="upload" exit={{ opacity: 0, y: -10 }}>
                {renderUpload()}
              </motion.div>
            )}

            {result && (
              <motion.div key="result" exit={{ opacity: 0, y: -10 }}>
                {renderResult()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
