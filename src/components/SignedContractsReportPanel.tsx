import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buildSignedContractDocumentHtml } from '@/lib/signedContractDocument';
import { toast } from 'sonner';
import { Eye, Printer, Upload } from 'lucide-react';

interface SignatureParty { signedName?: string; title?: string; imageUrl?: string; uploadedAt?: string; }
interface SignedDocument { fileUrl?: string; fileName?: string; uploadedAt?: string; uploadedBy?: { name?: string } | null; }
interface SignedContract {
  _id: string;
  contractNumber: string;
  clientName: string;
  clientContact?: string;
  clientEmail?: string;
  clientType?: string;
  eventDate: string;
  status: string;
  totalContractValue?: number;
  downPaymentPercent?: number;
  finalPaymentPercent?: number;
  clientSigned?: boolean;
  clientSignedAt?: string;
  venue?: { name?: string; address?: string };
  packageSelected?: string;
  totalPacks?: number;
  menuDetails?: Array<{ category?: string; item?: string; quantity?: number }>;
  preferredColor?: string;
  napkinType?: string;
  tableSetup?: string;
  backdropRequirements?: string;
  specialRequests?: string;
  signatureAssets?: { client?: SignatureParty; staff?: SignatureParty };
  signedDocument?: SignedDocument;
}

const COMPANY_NAME = 'Juan Carlos Catering Services';
const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '-');
const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString() : '-');
const formatCurrency = (value?: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);
const escapeHtml = (value?: string) => String(value || '-').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const hasEsign = (contract: SignedContract) => Boolean(contract.signatureAssets?.client?.imageUrl && contract.signatureAssets?.staff?.imageUrl);
const hasManualCopy = (contract: SignedContract) => Boolean(contract.signedDocument?.fileUrl);
const getSourceLabel = (contract: SignedContract) => hasEsign(contract) && hasManualCopy(contract) ? 'E-Signed + PDF' : hasEsign(contract) ? 'E-Signed' : hasManualCopy(contract) ? 'Hand-Signed PDF' : 'Signature Recorded';

export default function SignedContractsReportPanel() {
  const [contracts, setContracts] = useState<SignedContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [previewContract, setPreviewContract] = useState<SignedContract | null>(null);
  const [uploadContract, setUploadContract] = useState<SignedContract | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [signedPdfDataUrl, setSignedPdfDataUrl] = useState('');
  const [signedPdfName, setSignedPdfName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const previewLoadTokenRef = useRef(0);

  const fetchSignedContracts = async () => {
    try {
      setIsLoading(true);
      const data = await api.getContracts();
      const signedContracts = (data as SignedContract[])
        .filter((contract) => contract.clientSigned)
        .sort((left, right) => new Date(right.clientSignedAt || right.eventDate).getTime() - new Date(left.clientSignedAt || left.eventDate).getTime());
      setContracts(signedContracts);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load signed contracts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSignedContracts();
  }, []);

  const filteredContracts = useMemo(() => contracts.filter((contract) => {
    const matchesSearch = [contract.contractNumber, contract.clientName, contract.clientEmail, contract.venue?.name]
      .some((value) => String(value || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSource = sourceFilter === 'all'
      || (sourceFilter === 'esign' && hasEsign(contract))
      || (sourceFilter === 'manual' && hasManualCopy(contract))
      || (sourceFilter === 'both' && hasEsign(contract) && hasManualCopy(contract))
      || (sourceFilter === 'missing_pdf' && !hasManualCopy(contract));
    return matchesSearch && matchesSource;
  }), [contracts, searchTerm, sourceFilter]);

  const stats = useMemo(() => ({
    total: contracts.length,
    esigned: contracts.filter(hasEsign).length,
    pdfCopies: contracts.filter(hasManualCopy).length,
    missingPdf: contracts.filter((contract) => !hasManualCopy(contract)).length,
  }), [contracts]);

  const previewDocumentHtml = useMemo(() => (
    previewContract
      ? buildSignedContractDocumentHtml(previewContract, {
          documentTitle: 'Signed Contract Copy',
          documentSubtitle: 'Archived contract view with the recorded electronic signatures.',
          signatureStatus: getSourceLabel(previewContract),
        })
      : ''
  ), [previewContract]);

  const handleOpenPreview = async (contract: SignedContract) => {
    const loadToken = previewLoadTokenRef.current + 1;
    previewLoadTokenRef.current = loadToken;
    setPreviewContract(contract);
    setIsPreviewLoading(true);

    try {
      const detailedContract = await api.getContract(contract._id);
      if (previewLoadTokenRef.current === loadToken) {
        setPreviewContract(detailedContract as SignedContract);
      }
    } catch (error: any) {
      if (previewLoadTokenRef.current === loadToken) {
        toast.error(error.message || 'Failed to load the signed contract view');
      }
    } finally {
      if (previewLoadTokenRef.current === loadToken) {
        setIsPreviewLoading(false);
      }
    }
  };

  const handlePdfChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSignedPdfDataUrl('');
      setSignedPdfName('');
      return;
    }
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF copy only.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please upload a PDF smaller than 5 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSignedPdfDataUrl(typeof reader.result === 'string' ? reader.result : '');
      setSignedPdfName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const closeUploadDialog = () => {
    setUploadContract(null);
    setSignedPdfDataUrl('');
    setSignedPdfName('');
  };

  const handleOpenUpload = (contract: SignedContract) => {
    if (hasEsign(contract)) {
      toast.error('This contract is already e-signed. PDF upload is only for hand-signed contracts.');
      return;
    }
    setUploadContract(contract);
  };

  const handleUploadPdf = async () => {
    if (!uploadContract || !signedPdfDataUrl) {
      toast.error('Attach a signed PDF first.');
      return;
    }
    try {
      setIsUploading(true);
      await api.uploadContractSignedDocument(uploadContract._id, {
        fileUrl: signedPdfDataUrl,
        fileName: signedPdfName || `${uploadContract.contractNumber}-signed-copy.pdf`,
      });
      toast.success('Signed PDF uploaded.');
      closeUploadDialog();
      fetchSignedContracts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload the signed PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the signed contracts report.');
      return;
    }
    const rows = filteredContracts.map((contract, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(contract.contractNumber)}</td>
        <td>${escapeHtml(contract.clientName)}</td>
        <td>${escapeHtml(contract.venue?.name || '-')}</td>
        <td>${escapeHtml(formatDate(contract.eventDate))}</td>
        <td>${escapeHtml(formatDate(contract.clientSignedAt))}</td>
        <td>${escapeHtml(getSourceLabel(contract))}</td>
        <td>${escapeHtml(contract.status.replace(/_/g, ' '))}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Signed Contracts Report</title>
      <style>
        body{font-family:Arial,sans-serif;margin:24px;color:#111827}h1{margin:0 0 4px;color:#491321}p{margin:0 0 12px;color:#6b7280}
        .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:20px 0}.card{border:1px solid #e5e7eb;border-radius:12px;padding:12px}
        .label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em}.value{font-size:22px;font-weight:700;color:#491321;margin-top:4px}
        table{width:100%;border-collapse:collapse}th,td{border:1px solid #d1d5db;padding:10px 8px;font-size:12px;text-align:left}th{background:#f8fafc;text-transform:uppercase;font-size:11px;color:#4b5563}
      </style></head><body>
      <h1>${escapeHtml(COMPANY_NAME)}</h1><p>Signed Contracts Report</p><p>Printed on ${escapeHtml(new Date().toLocaleString())}</p>
      <div class="stats">
        <div class="card"><div class="label">Total Signed</div><div class="value">${stats.total}</div></div>
        <div class="card"><div class="label">E-Signed</div><div class="value">${stats.esigned}</div></div>
        <div class="card"><div class="label">PDF Copies</div><div class="value">${stats.pdfCopies}</div></div>
        <div class="card"><div class="label">Missing PDF</div><div class="value">${stats.missingPdf}</div></div>
      </div>
      <table><thead><tr><th>#</th><th>Contract</th><th>Client</th><th>Venue</th><th>Event Date</th><th>Signed On</th><th>Source</th><th>Status</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="8">No signed contracts found.</td></tr>'}</tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Signed Contracts Report</h2>
          <p className="text-muted-foreground">Review signed contracts, preview the full signed document, upload hand-signed PDF copies when needed, and print a report for filing.</p>
        </div>
        <Button variant="outline" onClick={handlePrintReport}>
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Signed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">E-Signed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-sky-700">{stats.esigned}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Hand-Signed PDF Copies</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-700">{stats.pdfCopies}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Missing PDF Copy</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-slate-700">{stats.missingPdf}</div></CardContent></Card>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <Input
          placeholder="Search by contract number, client, email, or venue..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="flex-1"
        />
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue placeholder="All signed contracts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All signed contracts</SelectItem>
            <SelectItem value="esign">E-signed only</SelectItem>
            <SelectItem value="manual">With hand-signed PDF</SelectItem>
            <SelectItem value="both">E-signed + uploaded PDF</SelectItem>
            <SelectItem value="missing_pdf">Missing PDF copy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Contract</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Client / Event</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Signed On</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Source</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading signed contracts...</td></tr>
                ) : filteredContracts.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No signed contracts match the current filters.</td></tr>
                ) : filteredContracts.map((contract) => (
                  <tr key={contract._id} className="hover:bg-muted/30">
                    <td className="px-4 py-4 align-top">
                      <p className="font-medium">{contract.contractNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(contract.totalContractValue)}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="font-medium">{contract.clientName}</p>
                      <p className="text-sm text-muted-foreground">{contract.venue?.name || 'Venue not set'}</p>
                      <p className="text-xs text-muted-foreground">Event date: {formatDate(contract.eventDate)}</p>
                    </td>
                    <td className="px-4 py-4 align-top text-sm">{formatDateTime(contract.clientSignedAt)}</td>
                    <td className="px-4 py-4 align-top">
                      <Badge variant="outline">{getSourceLabel(contract)}</Badge>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <Badge variant="outline" className="bg-slate-50 text-slate-700">{contract.status.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => void handleOpenPreview(contract)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                        {!hasEsign(contract) ? (
                          <Button variant="outline" size="sm" onClick={() => handleOpenUpload(contract)}>
                            <Upload className="mr-2 h-4 w-4" />
                            {hasManualCopy(contract) ? 'Replace PDF' : 'Upload PDF'}
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/contracts/${contract._id}`}>Open Contract</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(previewContract)} onOpenChange={(open) => {
        if (!open) {
          previewLoadTokenRef.current += 1;
          setPreviewContract(null);
          setIsPreviewLoading(false);
        }
      }}>
        <DialogContent className="w-[min(98vw,92rem)] max-w-[98vw] overflow-hidden p-0">
          <div className="flex h-[92vh] flex-col">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>{previewContract ? `${previewContract.contractNumber} Signed Record` : 'Signed Record'}</DialogTitle>
              <DialogDescription>View the full archived signed contract and the uploaded PDF copy from one place.</DialogDescription>
            </DialogHeader>
            {previewContract ? (
              <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border bg-muted/20 px-4 py-3"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Client</p><p className="mt-1 font-semibold">{previewContract.clientName}</p></div>
                  <div className="rounded-lg border bg-muted/20 px-4 py-3"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Venue</p><p className="mt-1 font-semibold">{previewContract.venue?.name || 'Not set'}</p></div>
                  <div className="rounded-lg border bg-muted/20 px-4 py-3"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Signed On</p><p className="mt-1 font-semibold">{formatDateTime(previewContract.clientSignedAt)}</p></div>
                  <div className="rounded-lg border bg-muted/20 px-4 py-3"><p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Source</p><p className="mt-1 font-semibold">{getSourceLabel(previewContract)}</p></div>
                </div>

                <Tabs
                  defaultValue={hasEsign(previewContract) ? 'document' : hasManualCopy(previewContract) ? 'pdf' : 'document'}
                  className="flex min-h-0 flex-1 flex-col gap-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <TabsList className="w-full sm:w-auto">
                      <TabsTrigger value="document">Signed Contract View</TabsTrigger>
                      {hasManualCopy(previewContract) ? <TabsTrigger value="pdf">Uploaded PDF</TabsTrigger> : null}
                    </TabsList>
                    <div className="flex flex-wrap items-center gap-2">
                      {hasManualCopy(previewContract) ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={previewContract.signedDocument?.fileUrl} target="_blank" rel="noreferrer">Open PDF</a>
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/contracts/${previewContract._id}`}>Open Contract</Link>
                      </Button>
                    </div>
                  </div>

                  <TabsContent value="document" className="mt-0 min-h-0 flex-1">
                    <div className="h-full overflow-hidden rounded-xl border bg-muted/10">
                      {isPreviewLoading ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Loading the full signed contract document...
                        </div>
                      ) : null}
                      <iframe
                        srcDoc={previewDocumentHtml}
                        title={`${previewContract.contractNumber} signed contract view`}
                        className={`h-full min-h-[68vh] w-full ${isPreviewLoading ? 'hidden' : 'block'}`}
                      />
                    </div>
                  </TabsContent>

                  {hasManualCopy(previewContract) ? (
                    <TabsContent value="pdf" className="mt-0 min-h-0 flex-1">
                      <div className="flex h-full min-h-[68vh] flex-col gap-4 rounded-xl border bg-muted/10 p-4">
                        <p className="text-sm text-muted-foreground">
                          {previewContract.signedDocument?.fileName || 'Signed contract copy.pdf'} uploaded {formatDateTime(previewContract.signedDocument?.uploadedAt)} by {previewContract.signedDocument?.uploadedBy?.name || 'Staff'}.
                        </p>
                        <iframe src={previewContract.signedDocument?.fileUrl} title={`${previewContract.contractNumber} signed PDF`} className="min-h-0 flex-1 rounded-lg border bg-white" />
                      </div>
                    </TabsContent>
                  ) : null}
                </Tabs>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(uploadContract)} onOpenChange={(open) => !open && closeUploadDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{uploadContract ? `Upload Signed PDF - ${uploadContract.contractNumber}` : 'Upload Signed PDF'}</DialogTitle>
            <DialogDescription>Attach the scanned PDF copy of the hand-signed contract for admin filing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="signed-contract-pdf">Signed Contract PDF</Label>
              <Input id="signed-contract-pdf" type="file" accept="application/pdf" onChange={handlePdfChange} />
              <p className="text-xs text-muted-foreground">PDF only, up to 5 MB.</p>
            </div>
            {signedPdfName ? <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">Ready to upload: <span className="font-medium">{signedPdfName}</span></div> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeUploadDialog}>Cancel</Button>
            <Button onClick={handleUploadPdf} disabled={!signedPdfDataUrl || isUploading}>{isUploading ? 'Uploading...' : 'Upload Signed PDF'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
