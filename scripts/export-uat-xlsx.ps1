$ErrorActionPreference = 'Stop'

function Escape-XmlText {
    param([string]$Value)

    if ($null -eq $Value) {
        return ''
    }

    return [System.Security.SecurityElement]::Escape($Value)
}

function New-InlineCellXml {
    param(
        [string]$CellRef,
        [string]$Value,
        [int]$StyleId = 0
    )

    $escapedValue = Escape-XmlText $Value
    return "<c r=`"$CellRef`" s=`"$StyleId`" t=`"inlineStr`"><is><t xml:space=`"preserve`">$escapedValue</t></is></c>"
}

function Get-RowHeight {
    param(
        [string[]]$Values,
        [int]$Minimum = 20
    )

    $maxLines = 1
    foreach ($value in $Values) {
        if ([string]::IsNullOrWhiteSpace($value)) {
            continue
        }

        $lineCount = ($value -split "`n").Count
        if ($lineCount -gt $maxLines) {
            $maxLines = $lineCount
        }
    }

    $height = [Math]::Max($Minimum, 18 * $maxLines)
    return [int]$height
}

function Convert-MarkdownCell {
    param([string]$Value)

    $cleaned = $Value.Trim()
    $cleaned = $cleaned -replace '<br\s*/?>', "`n"
    $cleaned = $cleaned -replace '`', ''
    return $cleaned.Trim()
}

function Get-UatRows {
    param([string]$MarkdownPath)

    $rows = @()

    foreach ($line in [System.IO.File]::ReadAllLines($MarkdownPath)) {
        if ($line -notmatch '^\|\s*UAT-\d+\s*\|') {
            continue
        }

        if ($line -match '^\|\s*(UAT-\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|$') {
            $rows += [PSCustomObject]@{
                TestCaseId = Convert-MarkdownCell $matches[1]
                Steps = Convert-MarkdownCell $matches[2]
                ExpectedResult = Convert-MarkdownCell $matches[3]
                Status = Convert-MarkdownCell $matches[4]
            }
        }
    }

    return $rows
}

function New-UatSheetXml {
    param([object[]]$Rows)

    $sheetRows = @()
    $sheetRows += "<row r=`"1`" ht=`"24`" customHeight=`"1`">" +
        (New-InlineCellXml -CellRef 'A1' -Value 'Test Case ID' -StyleId 1) +
        (New-InlineCellXml -CellRef 'B1' -Value 'Steps' -StyleId 1) +
        (New-InlineCellXml -CellRef 'C1' -Value 'Expected Result' -StyleId 1) +
        (New-InlineCellXml -CellRef 'D1' -Value 'Status' -StyleId 1) +
        "</row>"

    $rowNumber = 2
    foreach ($row in $Rows) {
        $height = Get-RowHeight -Values @($row.Steps, $row.ExpectedResult) -Minimum 42
        $sheetRows += "<row r=`"$rowNumber`" ht=`"$height`" customHeight=`"1`">" +
            (New-InlineCellXml -CellRef "A$rowNumber" -Value $row.TestCaseId -StyleId 2) +
            (New-InlineCellXml -CellRef "B$rowNumber" -Value $row.Steps -StyleId 2) +
            (New-InlineCellXml -CellRef "C$rowNumber" -Value $row.ExpectedResult -StyleId 2) +
            (New-InlineCellXml -CellRef "D$rowNumber" -Value $row.Status -StyleId 3) +
            "</row>"
        $rowNumber += 1
    }

    $lastRow = [Math]::Max(2, $rowNumber - 1)

    return @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen" />
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18" />
  <cols>
    <col min="1" max="1" width="16" customWidth="1" />
    <col min="2" max="2" width="70" customWidth="1" />
    <col min="3" max="3" width="70" customWidth="1" />
    <col min="4" max="4" width="14" customWidth="1" />
  </cols>
  <sheetData>
    $($sheetRows -join "`n    ")
  </sheetData>
  <autoFilter ref="A1:D$lastRow" />
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3" />
</worksheet>
"@
}

function New-ReferenceSheetXml {
    $referenceRows = @(
        @('Section', 'Details'),
        @('Flow', 'Menu Tasting Booking -> Menu Tasting Detail -> Create Contract -> Contract Detail -> Submit / Approve'),
        @('Status Guide', 'Not Run' + "`n" + 'Pass' + "`n" + 'Fail' + "`n" + 'Blocked'),
        @('Suggested Client Name', 'QA Test Client'),
        @('Suggested Client Email', 'Use a unique test email each run'),
        @('Suggested Client Phone', 'Use a valid mobile number'),
        @('Suggested Event Type', 'wedding'),
        @('Suggested Expected Guests', '120'),
        @('Suggested Tasting Date', 'Use a future date'),
        @('Suggested Event Date', 'Use a future date at least 2 months ahead'),
        @('Sign-Off Tester Name', ''),
        @('Sign-Off Date Tested', ''),
        @('Sign-Off Build/Version', ''),
        @('Sign-Off Overall Result', ''),
        @('Sign-Off Blocking Issues', ''),
        @('Sign-Off Approved For Demo/UAT', '')
    )

    $sheetRows = @()
    for ($i = 0; $i -lt $referenceRows.Count; $i += 1) {
        $rowNumber = $i + 1
        $styleId = if ($rowNumber -eq 1) { 1 } else { 2 }
        $height = Get-RowHeight -Values $referenceRows[$i] -Minimum 20
        $sheetRows += "<row r=`"$rowNumber`" ht=`"$height`" customHeight=`"1`">" +
            (New-InlineCellXml -CellRef "A$rowNumber" -Value $referenceRows[$i][0] -StyleId $styleId) +
            (New-InlineCellXml -CellRef "B$rowNumber" -Value $referenceRows[$i][1] -StyleId $styleId) +
            "</row>"
    }

    return @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen" />
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18" />
  <cols>
    <col min="1" max="1" width="24" customWidth="1" />
    <col min="2" max="2" width="80" customWidth="1" />
  </cols>
  <sheetData>
    $($sheetRows -join "`n    ")
  </sheetData>
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3" />
</worksheet>
"@
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$markdownPath = Join-Path $projectRoot 'UAT_TEST_CASES.md'
$outputPath = Join-Path $projectRoot 'UAT_Test_Cases.xlsx'
$tempRoot = Join-Path $projectRoot '.tmp_uat_xlsx'

if (Test-Path $tempRoot) {
    Remove-Item -Path $tempRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $tempRoot | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot '_rels') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot 'xl') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot 'xl\_rels') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot 'xl\worksheets') | Out-Null

$uatRows = Get-UatRows -MarkdownPath $markdownPath
if ($uatRows.Count -eq 0) {
    throw "No UAT rows were parsed from $markdownPath"
}

$contentTypesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="xml" ContentType="application/xml" />
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" />
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" />
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" />
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml" />
</Types>
"@

$rootRelsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml" />
</Relationships>
"@

$workbookXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="UAT Test Cases" sheetId="1" r:id="rId1" />
    <sheet name="Reference" sheetId="2" r:id="rId2" />
  </sheets>
</workbook>
"@

$workbookRelsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml" />
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml" />
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml" />
</Relationships>
"@

$stylesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font>
      <sz val="11" />
      <color theme="1" />
      <name val="Calibri" />
      <family val="2" />
    </font>
    <font>
      <b />
      <sz val="11" />
      <color rgb="FFFFFFFF" />
      <name val="Calibri" />
      <family val="2" />
    </font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none" /></fill>
    <fill><patternFill patternType="gray125" /></fill>
    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FF1F4E78" />
        <bgColor indexed="64" />
      </patternFill>
    </fill>
  </fills>
  <borders count="1">
    <border>
      <left />
      <right />
      <top />
      <bottom />
      <diagonal />
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" />
  </cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" />
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1" />
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1">
      <alignment vertical="top" wrapText="1" />
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1" />
    </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0" />
  </cellStyles>
</styleSheet>
"@

[System.IO.File]::WriteAllText((Join-Path $tempRoot '[Content_Types].xml'), $contentTypesXml, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText((Join-Path $tempRoot '_rels\.rels'), $rootRelsXml, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText((Join-Path $tempRoot 'xl\workbook.xml'), $workbookXml, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText((Join-Path $tempRoot 'xl\_rels\workbook.xml.rels'), $workbookRelsXml, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText((Join-Path $tempRoot 'xl\styles.xml'), $stylesXml, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText((Join-Path $tempRoot 'xl\worksheets\sheet1.xml'), (New-UatSheetXml -Rows $uatRows), [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText((Join-Path $tempRoot 'xl\worksheets\sheet2.xml'), (New-ReferenceSheetXml), [System.Text.Encoding]::UTF8)

if (Test-Path $outputPath) {
    Remove-Item -Path $outputPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempRoot, $outputPath)
Remove-Item -Path $tempRoot -Recurse -Force

Write-Output $outputPath
