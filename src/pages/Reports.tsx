import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart3, CalendarDays, Download, FileText, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ReportCard {
  label: string;
  value: string;
  helper?: string;
  tone?: 'default' | 'success' | 'warning';
}

interface ReportChartItem {
  label: string;
  value: number;
}

interface ReportChart {
  id: string;
  title: string;
  description?: string;
  // 'breakdown' (default): composition donut + bars. 'trend': month timeline.
  kind?: 'breakdown' | 'trend';
  items: ReportChartItem[];
}

interface ReportInsight {
  tone: 'warning' | 'info' | 'positive';
  title: string;
  detail: string;
}

interface ReportColumn {
  key: string;
  label: string;
}

interface ReportSection {
  id: string;
  title: string;
  description?: string;
  columns: ReportColumn[];
  rows: Record<string, string | number | null | undefined>[];
  emptyMessage?: string;
}

interface DepartmentReport {
  title: string;
  subtitle: string;
  role: string;
  departmentLabel: string;
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summaryCards: ReportCard[];
  insights?: ReportInsight[];
  charts: ReportChart[];
  sections: ReportSection[];
}

const INSIGHT_TONE_META: Record<ReportInsight['tone'], { className: string; label: string }> = {
  warning: { className: 'border-amber-300 bg-amber-50 text-amber-950', label: 'Needs attention' },
  info: { className: 'border-blue-200 bg-blue-50 text-blue-950', label: 'Worth knowing' },
  positive: { className: 'border-emerald-200 bg-emerald-50 text-emerald-950', label: 'On track' },
};

const chartColors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#475569'];

const getDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const getDefaultStartDate = () => {
  const today = new Date();
  return getDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1));
};

const getDefaultEndDate = () => getDateInputValue(new Date());

const getCardToneClass = (tone?: ReportCard['tone']) => {
  if (tone === 'success') {
    return 'border-l-emerald-500 bg-emerald-50/60';
  }

  if (tone === 'warning') {
    return 'border-l-amber-500 bg-amber-50/60';
  }

  return 'border-l-primary bg-card';
};

const formatGeneratedAt = (value?: string) => {
  if (!value) {
    return 'Not generated yet';
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
};

const stripInvalidXmlChars = (value: unknown) => String(value ?? '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

const escapeXml = (value: unknown) => stripInvalidXmlChars(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const sanitizeFileName = (value: string) => value
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

const sanitizeWorksheetName = (value: string) => {
  const cleaned = stripInvalidXmlChars(value || 'Sheet')
    .replace(/[:\\/?*\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (cleaned || 'Sheet').slice(0, 31);
};

const getUniqueWorksheetName = (baseName: string, usedNames: Set<string>) => {
  const cleanedBase = sanitizeWorksheetName(baseName);
  let candidate = cleanedBase;
  let counter = 2;

  while (usedNames.has(candidate.toLowerCase())) {
    const suffix = ` ${counter}`;
    candidate = `${cleanedBase.slice(0, 31 - suffix.length)}${suffix}`;
    counter += 1;
  }

  usedNames.add(candidate.toLowerCase());
  return candidate;
};

const getTabLabel = (title: string) => title
  .replace(' Snapshot', '')
  .replace(' Register', '')
  .replace(' Summary', '')
  .replace('Contract ', 'Contracts ')
  .replace('Accounting / Finance', 'Finance')
  .replace('Inventory Department ', 'Inventory ');

const buildExcelCell = (value: unknown, styleId = 'Cell', mergeAcross = 0) => {
  const numericValue = typeof value === 'number' && Number.isFinite(value);
  const mergeAttribute = mergeAcross > 0 ? ` ss:MergeAcross="${mergeAcross}"` : '';
  const type = numericValue ? 'Number' : 'String';
  const cellValue = numericValue ? String(value) : escapeXml(value ?? '');

  return `<Cell ss:StyleID="${styleId}"${mergeAttribute}><Data ss:Type="${type}">${cellValue}</Data></Cell>`;
};

const buildExcelRow = (cells: string[]) => `<Row>${cells.join('')}</Row>`;

const buildExcelWorksheet = ({
  name,
  title,
  subtitle,
  report,
  columns,
  rows,
  emptyMessage
}: {
  name: string;
  title: string;
  subtitle?: string;
  report: DepartmentReport;
  columns: ReportColumn[];
  rows: Record<string, string | number | null | undefined>[];
  emptyMessage?: string;
}) => {
  const columnCount = Math.max(columns.length, 3);
  const mergeAcross = Math.max(columnCount - 1, 0);
  const columnWidths = Array.from({ length: columnCount }, () => '<Column ss:AutoFitWidth="1" ss:Width="145"/>').join('');
  const tableRows = rows.length
    ? rows.map((row) => buildExcelRow(columns.map((column) => buildExcelCell(row[column.key] ?? '-', 'Cell')))).join('')
    : buildExcelRow([buildExcelCell(emptyMessage || 'No records found for the selected date range.', 'Note', mergeAcross)]);

  return `
    <Worksheet ss:Name="${escapeXml(name)}">
      <Table>
        ${columnWidths}
        ${buildExcelRow([buildExcelCell('JUAN CARLOS', 'Brand', mergeAcross)])}
        ${buildExcelRow([buildExcelCell('Catering Management System', 'Subtle', mergeAcross)])}
        ${buildExcelRow([buildExcelCell(title.toUpperCase(), 'Title', mergeAcross)])}
        ${subtitle ? buildExcelRow([buildExcelCell(subtitle, 'Note', mergeAcross)]) : ''}
        ${buildExcelRow([buildExcelCell(`Department: ${report.departmentLabel}`, 'Meta'), buildExcelCell(`Period: ${report.dateRange.startDate} to ${report.dateRange.endDate}`, 'Meta'), buildExcelCell(`Generated: ${formatGeneratedAt(report.generatedAt)}`, 'Meta')])}
        ${buildExcelRow(columns.map((column) => buildExcelCell(column.label, 'Header')))}
        ${tableRows}
      </Table>
    </Worksheet>
  `;
};

export default function Reports() {
  const [report, setReport] = useState<DepartmentReport | null>(null);
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [isLoading, setIsLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState('');
  const [printSectionId, setPrintSectionId] = useState('');

  const reportPeriodLabel = useMemo(() => {
    if (!report) {
      return `${startDate} to ${endDate}`;
    }

    return `${report.dateRange.startDate} to ${report.dateRange.endDate}`;
  }, [endDate, report, startDate]);

  const selectedPrintSection = useMemo(() => (
    report?.sections.find((section) => section.id === printSectionId) || null
  ), [printSectionId, report]);

  const printScopeLabel = selectedPrintSection
    ? selectedPrintSection.title
    : report?.role === 'admin'
      ? 'Full Admin Report'
      : 'Full Department Report';
  const printTitle = !selectedPrintSection && report?.role === 'admin'
    ? 'FULL REPORT DATA SUMMARY'
    : selectedPrintSection
      ? selectedPrintSection.title.toUpperCase()
      : (report?.title || 'Department Report').toUpperCase();

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDepartmentReport({ startDate, endDate });
      setReport(data as DepartmentReport);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load department report';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  useEffect(() => {
    if (report?.sections.length) {
      setActiveSectionId(report.sections[0].id);
    }
  }, [report]);

  useEffect(() => {
    const resetPrintScope = () => setPrintSectionId('');
    window.addEventListener('afterprint', resetPrintScope);
    return () => window.removeEventListener('afterprint', resetPrintScope);
  }, []);

  const printReport = (sectionId = '') => {
    setPrintSectionId(sectionId);
    window.setTimeout(() => window.print(), 80);
  };

  const exportReportToExcel = () => {
    if (!report) {
      toast.error('Load a report first before exporting');
      return;
    }

    const usedWorksheetNames = new Set<string>();
    const summaryRows = [
      ...(report.insights || []).map((insight) => ({
        metric: `INSIGHT (${insight.tone === 'warning' ? 'Needs attention' : insight.tone === 'positive' ? 'On track' : 'Worth knowing'})`,
        value: insight.title,
        notes: insight.detail
      })),
      ...report.summaryCards.map((card) => ({
        metric: card.label,
        value: card.value,
        notes: card.helper || ''
      })),
    ];
    const analyticsRows = report.charts.flatMap((chart) => (
      chart.items.map((item) => ({
        chart: chart.title,
        label: item.label,
        value: item.value
      }))
    ));

    const worksheets = [
      buildExcelWorksheet({
        name: getUniqueWorksheetName('Summary', usedWorksheetNames),
        title: `${report.title} Summary`,
        subtitle: report.subtitle,
        report,
        columns: [
          { key: 'metric', label: 'Metric' },
          { key: 'value', label: 'Value' },
          { key: 'notes', label: 'Notes' }
        ],
        rows: summaryRows,
        emptyMessage: 'No summary data available.'
      }),
      buildExcelWorksheet({
        name: getUniqueWorksheetName('Analytics', usedWorksheetNames),
        title: `${report.title} Analytics`,
        subtitle: 'Chart values exported as tabular data.',
        report,
        columns: [
          { key: 'chart', label: 'Chart' },
          { key: 'label', label: 'Label' },
          { key: 'value', label: 'Value' }
        ],
        rows: analyticsRows,
        emptyMessage: 'No analytics data available.'
      }),
      ...report.sections.map((section) => buildExcelWorksheet({
        name: getUniqueWorksheetName(report.role === 'admin' ? getTabLabel(section.title) : section.title, usedWorksheetNames),
        title: section.title,
        subtitle: section.description,
        report,
        columns: section.columns,
        rows: section.rows,
        emptyMessage: section.emptyMessage
      }))
    ].join('');

    const workbookXml = `<?xml version="1.0" encoding="UTF-8"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook
        xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:html="http://www.w3.org/TR/REC-html40">
        <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
          <Author>Juan Carlos Catering Management System</Author>
          <Title>${escapeXml(report.title)}</Title>
          <Created>${escapeXml(new Date().toISOString())}</Created>
        </DocumentProperties>
        <Styles>
          <Style ss:ID="Brand">
            <Alignment ss:Horizontal="Center"/>
            <Font ss:Bold="1" ss:Size="18" ss:Color="#1f2937"/>
          </Style>
          <Style ss:ID="Title">
            <Alignment ss:Horizontal="Center"/>
            <Font ss:Bold="1" ss:Size="13" ss:Color="#1f2937"/>
          </Style>
          <Style ss:ID="Subtle">
            <Alignment ss:Horizontal="Center"/>
            <Font ss:Size="10" ss:Color="#64748b"/>
          </Style>
          <Style ss:ID="Meta">
            <Font ss:Size="10" ss:Color="#334155"/>
          </Style>
          <Style ss:ID="Note">
            <Alignment ss:WrapText="1"/>
            <Font ss:Size="10" ss:Color="#475569"/>
          </Style>
          <Style ss:ID="Header">
            <Interior ss:Color="#e5e7eb" ss:Pattern="Solid"/>
            <Font ss:Bold="1" ss:Color="#111827"/>
            <Borders>
              <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#9ca3af"/>
            </Borders>
          </Style>
          <Style ss:ID="Cell">
            <Alignment ss:Vertical="Top" ss:WrapText="1"/>
            <Borders>
              <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e5e7eb"/>
            </Borders>
          </Style>
        </Styles>
        ${worksheets}
      </Workbook>`;

    const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFileName(report.title)}-${report.dateRange.startDate}-to-${report.dateRange.endDate}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Excel report exported with separate worksheet tabs');
  };

  const renderChart = (chart: ReportChart) => {
    const maxValue = Math.max(...chart.items.map((item) => Number(item.value) || 0), 1);
    const totalValue = chart.items.reduce((total, item) => total + (Number(item.value) || 0), 0);

    // Trend charts are timelines: a donut of months is meaningless, so render
    // vertical bars left-to-right instead (zero months stay visible as gaps).
    if (chart.kind === 'trend') {
      return (
        <Card key={chart.id} className="overflow-hidden border-slate-200 lg:col-span-2 xl:col-span-3">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-primary" />
              {chart.title}
            </CardTitle>
            {chart.description ? <CardDescription>{chart.description}</CardDescription> : null}
          </CardHeader>
          <CardContent className="pt-6">
            {chart.items.length === 0 || totalValue === 0 ? (
              <p className="text-sm text-muted-foreground">No activity recorded in this window yet.</p>
            ) : (
              <div className="flex items-end gap-3" style={{ height: 170 }}>
                {chart.items.map((item) => {
                  const value = Number(item.value) || 0;
                  const barHeight = Math.max(value > 0 ? 6 : 2, Math.round((value / maxValue) * 120));
                  return (
                    <div key={`${chart.id}-${item.label}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                      <span className="text-xs font-semibold text-foreground">{value.toLocaleString()}</span>
                      <div
                        className="w-full max-w-14 rounded-t-md"
                        style={{ height: barHeight, backgroundColor: value > 0 ? '#2563eb' : '#e5e7eb' }}
                      />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    let accumulatedPercent = 0;
    const donutSegments = chart.items.map((item, index) => {
      const value = Number(item.value) || 0;
      const percent = totalValue > 0 ? (value / totalValue) * 100 : 0;
      const segment = {
        ...item,
        percent,
        offset: accumulatedPercent,
        color: chartColors[index % chartColors.length]
      };
      accumulatedPercent += percent;
      return segment;
    });

    return (
      <Card key={chart.id} className="overflow-hidden border-slate-200">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-primary" />
            {chart.title}
          </CardTitle>
          {chart.description ? <CardDescription>{chart.description}</CardDescription> : null}
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-[130px_1fr]">
          {chart.items.length === 0 ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">No chart data for this period.</p>
          ) : (
            <>
              <div className="relative mx-auto h-28 w-28">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                  {donutSegments.map((segment) => (
                    <circle
                      key={`${chart.id}-donut-${segment.label}`}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="4"
                      strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
                      strokeDashoffset={-segment.offset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold">{totalValue}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">Total</span>
                </div>
              </div>
              <div className="space-y-3">
                {chart.items.map((item, index) => {
                  const percent = Math.max(3, (Number(item.value) / maxValue) * 100);
                  return (
                    <div key={`${chart.id}-${item.label}`} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 font-medium">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-sm"
                            style={{ backgroundColor: chartColors[index % chartColors.length] }}
                          />
                          <span className="truncate">{item.label}</span>
                        </span>
                        <span className="font-semibold text-foreground">{item.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: chartColors[index % chartColors.length]
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSection = (section: ReportSection) => (
    <Card key={section.id} className="break-inside-avoid">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {section.title}
        </CardTitle>
        {section.description ? <CardDescription>{section.description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {section.rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {section.emptyMessage || 'No records found.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {section.columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {section.rows.map((row, rowIndex) => (
                <TableRow key={`${section.id}-${rowIndex}`}>
                  {section.columns.map((column) => (
                    <TableCell key={`${section.id}-${rowIndex}-${column.key}`}>
                      {String(row[column.key] ?? '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderSections = () => {
    if (!report) {
      return null;
    }

    if (report.role === 'admin' && report.sections.length > 1) {
      const selectedSectionId = activeSectionId || report.sections[0].id;
      const printableSections = printSectionId
        ? report.sections.filter((section) => section.id === printSectionId)
        : report.sections;

      return (
        <>
          <Tabs value={selectedSectionId} onValueChange={setActiveSectionId} className="space-y-4 print:hidden">
            <div className="overflow-x-auto pb-1">
              <TabsList className="h-auto min-w-max flex-wrap justify-start">
                {report.sections.map((section) => (
                  <TabsTrigger key={section.id} value={section.id}>
                    {getTabLabel(section.title)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {report.sections.map((section) => (
              <TabsContent key={section.id} value={section.id}>
                <div className="mb-3 flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => printReport(section.id)}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print This Tab
                  </Button>
                </div>
                {renderSection(section)}
              </TabsContent>
            ))}
          </Tabs>
          <div className="hidden space-y-4 print:block">
            {printableSections.map(renderSection)}
          </div>
        </>
      );
    }

    return (
      <div className="space-y-4">
        {report.sections.map(renderSection)}
      </div>
    );
  };

  const renderReportHeader = () => (
    <div className="space-y-4 print:hidden">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{report?.departmentLabel || 'Department'}</Badge>
            <Badge variant="secondary">Reports and Analytics</Badge>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight">{report?.title || 'Department Reports'}</CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-base">
              {report?.subtitle || 'Role-based reports and analytics for the selected date range.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5 md:items-end">
            <div className="space-y-2">
              <Label htmlFor="startDate">From</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">To</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
            <Button onClick={fetchReport} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Load
            </Button>
          <Button type="button" variant="outline" onClick={exportReportToExcel} disabled={!report}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button type="button" variant="outline" onClick={() => printReport()} disabled={!report}>
            <Printer className="mr-2 h-4 w-4" />
            Print PDF
          </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span>Report period: {reportPeriodLabel}</span>
        </div>
        <span>Generated: {formatGeneratedAt(report?.generatedAt)}</span>
      </div>
    </div>
  );

  const renderPrintHeader = () => (
    <div className="hidden print:block">
      <div className="text-center">
        <p className="text-2xl font-bold tracking-[0.22em] text-slate-950">JUAN CARLOS</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Catering Management System</p>
        <div className="mx-auto mt-3 h-px w-32 bg-slate-950" />
        <h1 className="mt-4 text-lg font-bold uppercase tracking-wide text-slate-950">{printTitle}</h1>
        <p className="mx-auto mt-2 max-w-4xl text-xs leading-relaxed text-slate-600">
          {selectedPrintSection?.description || report?.subtitle}
        </p>
      </div>
      <div className="mt-5 border-y border-slate-300 py-2 text-xs">
        <div className="grid grid-cols-2 gap-x-10 gap-y-1">
          <p><span className="font-semibold">Department:</span> {report?.departmentLabel || 'Department'}</p>
          <p><span className="font-semibold">Report Scope:</span> {printScopeLabel}</p>
          <p><span className="font-semibold">Coverage Period:</span> {reportPeriodLabel}</p>
          <p><span className="font-semibold">Date Generated:</span> {formatGeneratedAt(report?.generatedAt)}</p>
        </div>
        <p className="mt-2 text-[10px] uppercase tracking-wide text-slate-500">
          This report is generated from recorded Catering Management System data for internal review and management decision-making.
        </p>
      </div>
    </div>
  );

  const renderPrintStyles = () => (
    <style>
      {`
        @media print {
          @page {
            size: A4 landscape;
            margin: 12mm;
          }

          body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          aside,
          main > header,
          [data-slot="sheet-content"],
          .print\\:hidden {
            display: none !important;
          }

          main,
          main > div {
            display: block !important;
            overflow: visible !important;
            min-height: auto !important;
          }

          main > div {
            padding: 0 !important;
          }

          .max-w-7xl {
            max-width: none !important;
          }

          .report-summary-print-hidden {
            display: none !important;
          }

          [data-slot="card"] {
            break-inside: avoid;
            box-shadow: none !important;
            border: 0 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            padding: 0 !important;
            gap: 0 !important;
          }

          [data-slot="card-header"] {
            padding: 14px 0 6px !important;
            border-bottom: 1px solid #0f172a !important;
          }

          [data-slot="card-content"] {
            padding: 8px 0 16px !important;
          }

          [data-slot="card-title"] {
            font-size: 11px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.08em !important;
          }

          [data-slot="card-description"],
          .text-muted-foreground {
            color: #475569 !important;
          }

          .border-l-4 {
            border-left: 0 !important;
          }

          .rounded-xl,
          .rounded-lg,
          .rounded-md,
          .rounded {
            border-radius: 0 !important;
          }

          .grid.print\\:grid-cols-3 {
            display: none !important;
          }

          table {
            font-size: 10px !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }

          th {
            background: #ffffff !important;
            color: #0f172a !important;
            font-weight: 700 !important;
            border-top: 1px solid #0f172a !important;
            border-bottom: 1px solid #0f172a !important;
          }

          td,
          th {
            border-left: 0 !important;
            border-right: 0 !important;
            border-top: 0 !important;
            border-bottom: 1px solid #cbd5e1 !important;
            padding: 5px 6px !important;
          }
        }
      `}
    </style>
  );

  return (
    <Layout>
      {renderPrintStyles()}
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {renderReportHeader()}
        {renderPrintHeader()}

        {isLoading && !report ? (
          <div className="rounded-xl border p-10 text-center text-muted-foreground">
            Loading report analytics...
          </div>
        ) : report ? (
          <>
            <div className={`report-summary-print-hidden grid gap-4 md:grid-cols-2 xl:grid-cols-4 ${printSectionId ? 'print:hidden' : ''}`}>
              {report.summaryCards.map((card) => (
                <Card key={card.label} className={`${getCardToneClass(card.tone)} border-l-4`}>
                  <CardHeader className="pb-2">
                    <CardDescription>{card.label}</CardDescription>
                    <CardTitle className="text-2xl print:text-lg">{card.value}</CardTitle>
                  </CardHeader>
                  {card.helper ? (
                    <CardContent>
                      <p className="text-sm text-muted-foreground print:text-xs">{card.helper}</p>
                    </CardContent>
                  ) : null}
                </Card>
              ))}
            </div>

            {report.insights && report.insights.length > 0 ? (
              <div className={`space-y-2 ${printSectionId ? 'print:hidden' : ''}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Key Insights & Recommended Actions</p>
                <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                  {report.insights.map((insight) => {
                    const meta = INSIGHT_TONE_META[insight.tone] || INSIGHT_TONE_META.info;
                    return (
                      <div key={insight.title} className={`rounded-xl border p-4 ${meta.className}`}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">{meta.label}</p>
                        <p className="mt-1 text-sm font-semibold">{insight.title}</p>
                        <p className="mt-1 text-sm leading-relaxed opacity-90">{insight.detail}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className={`grid gap-4 lg:grid-cols-2 xl:grid-cols-3 print:grid-cols-3 ${printSectionId ? 'print:hidden' : ''}`}>
              {report.charts.map(renderChart)}
            </div>

            {renderSections()}
          </>
        ) : (
          <div className="rounded-xl border p-10 text-center text-muted-foreground">
            No report available.
          </div>
        )}
      </div>
    </Layout>
  );
}
