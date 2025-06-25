import React, { useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  Text,
  Button,
  Spinner,
  Badge,
  MessageBar,
  MessageBarTitle,
  MessageBarBody,
  Input,
  ProgressBar,
  Tooltip,
} from "@fluentui/react-components";
import {
  DocumentTableRegular,
  ArrowSyncRegular,
  DismissRegular,
  SearchRegular,
  FilterRegular,
  DocumentArrowLeftRegular,
  DocumentArrowRightRegular,
  MergeRegular,
  BrainCircuitRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  InfoRegular,
  LinkRegular,
} from "@fluentui/react-icons";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { mistralService } from "../services/mistralService";

interface ExcelData {
  fileName: string;
  sheets: Array<{
    name: string;
    data: any[][];
    headers: string[];
  }>;
}

interface MergeAnalysis {
  mappings: Array<{
    leftColumn: string;
    rightColumn: string;
    confidence: number;
    reasoning: string;
  }>;
  unmatchedLeft: string[];
  unmatchedRight: string[];
  suggestions: string[];
  mergeStrategy: "inner" | "left" | "right" | "outer";
}

interface MergedData {
  headers: string[];
  data: any[][];
}

interface ExcelComparisonProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelComparison: React.FC<ExcelComparisonProps> = ({
  isOpen,
  onClose,
}) => {
  const [leftFile, setLeftFile] = useState<ExcelData | null>(null);
  const [rightFile, setRightFile] = useState<ExcelData | null>(null);
  const [leftSelectedSheet, setLeftSelectedSheet] = useState<number>(0);
  const [rightSelectedSheet, setRightSelectedSheet] = useState<number>(0);
  const [loading, setLoading] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightDifferences, setHighlightDifferences] = useState(false);

  // Smart Merge states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mergeAnalysis, setMergeAnalysis] = useState<MergeAnalysis | null>(
    null
  );
  const [mergedData, setMergedData] = useState<MergedData | null>(null);
  const [showMergePreview, setShowMergePreview] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const processExcelFile = useCallback(
    async (file: File): Promise<ExcelData> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });

            const sheets = workbook.SheetNames.map((sheetName) => {
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: "",
                raw: false,
              }) as any[][];

              // Extract headers (first row) and data
              const headers = jsonData[0] || [];
              const data = jsonData.slice(1);

              return {
                name: sheetName,
                data: data,
                headers: headers.map((h) => String(h || "")),
              };
            });

            resolve({
              fileName: file.name,
              sheets,
            });
          } catch (error) {
            reject(new Error(`Failed to parse Excel file: ${error.message}`));
          }
        };

        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };

        reader.readAsArrayBuffer(file);
      });
    },
    []
  );

  const handleFileUpload = useCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement>,
      side: "left" | "right"
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert("Please select a valid Excel file (.xlsx or .xls)");
        return;
      }

      setLoading((prev) => ({ ...prev, [side]: true }));

      try {
        const excelData = await processExcelFile(file);

        if (side === "left") {
          setLeftFile(excelData);
          setLeftSelectedSheet(0);
        } else {
          setRightFile(excelData);
          setRightSelectedSheet(0);
        }

        // Reset merge analysis when files change
        setMergeAnalysis(null);
        setMergedData(null);
        setShowMergePreview(false);
      } catch (error) {
        console.error("Error processing Excel file:", error);
        alert(`Error processing file: ${error.message}`);
      } finally {
        setLoading((prev) => ({ ...prev, [side]: false }));
      }

      // Clear the input
      event.target.value = "";
    },
    [processExcelFile]
  );

  const handleSmartMerge = async () => {
    if (!leftFile || !rightFile) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const leftSheet = leftFile.sheets[leftSelectedSheet];
      const rightSheet = rightFile.sheets[rightSelectedSheet];

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Analyze column mapping with Mistral AI
      const analysis = await mistralService.analyzeColumnMapping(
        leftSheet.headers,
        rightSheet.headers,
        leftSheet.data.slice(0, 5), // Sample data for analysis
        rightSheet.data.slice(0, 5)
      );

      setAnalysisProgress(95);

      // Generate merged data
      const merged = await mistralService.generateMergedData(
        leftSheet.data,
        rightSheet.data,
        leftSheet.headers,
        rightSheet.headers,
        analysis
      );

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      setMergeAnalysis(analysis);
      setMergedData(merged);
      setShowMergePreview(true);

      setTimeout(() => {
        setAnalysisProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Smart merge failed:", error);
      alert(`Smart merge failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "#107C10"; // Green
    if (confidence >= 0.7) return "#F7630C"; // Orange
    return "#D13438"; // Red
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return "success";
    if (confidence >= 0.7) return "warning";
    return "danger";
  };

  const getCellValue = (row: any[], colIndex: number): string => {
    const value = row[colIndex];
    if (value === null || value === undefined) return "";
    return String(value);
  };

  const isCellDifferent = (
    leftRow: any[],
    rightRow: any[],
    colIndex: number
  ): boolean => {
    if (!highlightDifferences || !leftFile || !rightFile) return false;

    const leftValue = getCellValue(leftRow, colIndex);
    const rightValue = getCellValue(rightRow, colIndex);

    return leftValue !== rightValue;
  };

  const shouldHighlightCell = (value: string): boolean => {
    if (!searchTerm) return false;
    return value.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const renderTable = (
    excelData: ExcelData,
    selectedSheet: number,
    side: "left" | "right"
  ) => {
    const sheet = excelData.sheets[selectedSheet];
    if (!sheet) return null;

    const otherFile = side === "left" ? rightFile : leftFile;
    const otherSheet =
      otherFile?.sheets[
        side === "left" ? rightSelectedSheet : leftSelectedSheet
      ];

    return (
      <div
        style={{
          height: "400px",
          overflow: "auto",
          border: "1px solid #E1DFDD",
          borderRadius: "4px",
          backgroundColor: "#FFFFFF",
          width: "100%",
          minWidth: 0,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            tableLayout: "fixed",
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              backgroundColor: "#F8F9FA",
              zIndex: 1,
            }}
          >
            <tr>
              <th
                style={{
                  padding: "8px 4px",
                  border: "1px solid #E1DFDD",
                  width: "40px",
                  backgroundColor: "#F3F2F1",
                  fontWeight: 600,
                  fontSize: "11px",
                }}
              >
                #
              </th>
              {sheet.headers.map((header, index) => (
                <th
                  key={index}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #E1DFDD",
                    backgroundColor: "#F8F9FA",
                    fontWeight: 600,
                    textAlign: "left",
                    width: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {header || `Column ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheet.data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  backgroundColor: rowIndex % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                }}
              >
                <td
                  style={{
                    padding: "6px 4px",
                    border: "1px solid #E1DFDD",
                    backgroundColor: "#F3F2F1",
                    fontWeight: 500,
                    fontSize: "10px",
                    color: "#605E5C",
                    textAlign: "center",
                    width: "40px",
                  }}
                >
                  {rowIndex + 1}
                </td>
                {sheet.headers.map((_, colIndex) => {
                  const cellValue = getCellValue(row, colIndex);
                  const isDifferent =
                    otherSheet &&
                    isCellDifferent(
                      row,
                      otherSheet.data[rowIndex] || [],
                      colIndex
                    );
                  const isHighlighted = shouldHighlightCell(cellValue);

                  return (
                    <td
                      key={colIndex}
                      style={{
                        padding: "6px 12px",
                        border: "1px solid #E1DFDD",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        backgroundColor: isDifferent
                          ? "#FFF4CE"
                          : isHighlighted
                          ? "#E6F3FF"
                          : "inherit",
                        borderLeft: isDifferent
                          ? "3px solid #F7630C"
                          : "1px solid #E1DFDD",
                      }}
                    >
                      {cellValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMergePreview = () => {
    if (!mergedData || !mergeAnalysis) return null;

    return (
      <div style={{ marginTop: "24px" }}>
        <Card
          style={{
            border: "2px solid #107C10",
            backgroundColor: "#F3F9F1",
          }}
        >
          <CardHeader
            header={
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <MergeRegular style={{ fontSize: "24px", color: "#107C10" }} />
                <Text size={500} weight="semibold">
                  Smart Merge Preview
                </Text>
                <Badge appearance="filled" color="success" size="small">
                  {mergeAnalysis.mappings.length} columns matched
                </Badge>
              </div>
            }
          />

          <div style={{ padding: "0 16px 16px" }}>
            {/* Merge Analysis Summary */}
            <div style={{ marginBottom: "16px" }}>
              <Text
                size={300}
                weight="semibold"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Merge Analysis Results:
              </Text>

              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginBottom: "12px",
                }}
              >
                <Badge appearance="outline" color="success" size="medium">
                  <CheckmarkCircleRegular
                    style={{ fontSize: "12px", marginRight: "4px" }}
                  />
                  {mergeAnalysis.mappings.length} Matched
                </Badge>
                <Badge appearance="outline" color="warning" size="medium">
                  <WarningRegular
                    style={{ fontSize: "12px", marginRight: "4px" }}
                  />
                  {mergeAnalysis.unmatchedLeft.length} Left Only
                </Badge>
                <Badge appearance="outline" color="important" size="medium">
                  <InfoRegular
                    style={{ fontSize: "12px", marginRight: "4px" }}
                  />
                  {mergeAnalysis.unmatchedRight.length} Right Only
                </Badge>
                <Badge appearance="outline" color="brand" size="medium">
                  Strategy: {mergeAnalysis.mergeStrategy.toUpperCase()}
                </Badge>
              </div>

              {/* Column Mappings */}
              {mergeAnalysis.mappings.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <Text
                    size={200}
                    weight="semibold"
                    style={{ display: "block", marginBottom: "6px" }}
                  >
                    Column Mappings:
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    {mergeAnalysis.mappings.map((mapping, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 12px",
                          backgroundColor: "rgba(255, 255, 255, 0.7)",
                          borderRadius: "4px",
                          border: `1px solid ${getConfidenceColor(
                            mapping.confidence
                          )}40`,
                        }}
                      >
                        <Text size={200} style={{ fontWeight: 500 }}>
                          {mapping.leftColumn}
                        </Text>
                        <LinkRegular
                          style={{ fontSize: "12px", color: "#605E5C" }}
                        />
                        <Text size={200} style={{ fontWeight: 500 }}>
                          {mapping.rightColumn}
                        </Text>
                        <Badge
                          appearance="filled"
                          color={getConfidenceBadge(mapping.confidence)}
                          size="small"
                        >
                          {Math.round(mapping.confidence * 100)}%
                        </Badge>
                        <Tooltip
                          content={mapping.reasoning}
                          relationship="description"
                        >
                          <InfoRegular
                            style={{
                              fontSize: "12px",
                              color: "#605E5C",
                              cursor: "help",
                            }}
                          />
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {mergeAnalysis.suggestions.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <Text
                    size={200}
                    weight="semibold"
                    style={{ display: "block", marginBottom: "6px" }}
                  >
                    AI Suggestions:
                  </Text>
                  <ul style={{ margin: 0, paddingLeft: "16px" }}>
                    {mergeAnalysis.suggestions.map((suggestion, index) => (
                      <li key={index}>
                        <Text size={200} style={{ color: "#605E5C" }}>
                          {suggestion}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Merged Data Preview */}
            <div>
              <Text
                size={300}
                weight="semibold"
                style={{ display: "block", marginBottom: "8px" }}
              >
                Merged Data Preview ({mergedData.data.length} rows):
              </Text>

              <div
                style={{
                  height: "300px",
                  overflow: "auto",
                  border: "1px solid #E1DFDD",
                  borderRadius: "4px",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12px",
                    tableLayout: "fixed",
                  }}
                >
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      backgroundColor: "#F8F9FA",
                      zIndex: 1,
                    }}
                  >
                    <tr>
                      <th
                        style={{
                          padding: "8px 4px",
                          border: "1px solid #E1DFDD",
                          width: "40px",
                          backgroundColor: "#F3F2F1",
                          fontWeight: 600,
                          fontSize: "11px",
                        }}
                      >
                        #
                      </th>
                      {mergedData.headers.map((header, index) => {
                        const isMatched = mergeAnalysis.mappings.some(
                          (m) => m.leftColumn === header
                        );
                        const isLeftOnly =
                          mergeAnalysis.unmatchedLeft.includes(header);
                        const isRightOnly = header.includes("(Right)");

                        return (
                          <th
                            key={index}
                            style={{
                              padding: "8px 12px",
                              border: "1px solid #E1DFDD",
                              backgroundColor: isMatched
                                ? "#F3F9F1"
                                : isLeftOnly
                                ? "#EDF3FF"
                                : isRightOnly
                                ? "#FFF4E6"
                                : "#F8F9FA",
                              fontWeight: 600,
                              textAlign: "left",
                              width: "120px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {header}
                            {isMatched && (
                              <span
                                style={{ color: "#107C10", marginLeft: "4px" }}
                              >
                                ✓
                              </span>
                            )}
                            {isLeftOnly && (
                              <span
                                style={{ color: "#0078D4", marginLeft: "4px" }}
                              >
                                L
                              </span>
                            )}
                            {isRightOnly && (
                              <span
                                style={{ color: "#F7630C", marginLeft: "4px" }}
                              >
                                R
                              </span>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {mergedData.data.slice(0, 50).map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        style={{
                          backgroundColor:
                            rowIndex % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                        }}
                      >
                        <td
                          style={{
                            padding: "6px 4px",
                            border: "1px solid #E1DFDD",
                            backgroundColor: "#F3F2F1",
                            fontWeight: 500,
                            fontSize: "10px",
                            color: "#605E5C",
                            textAlign: "center",
                            width: "40px",
                          }}
                        >
                          {rowIndex + 1}
                        </td>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            style={{
                              padding: "6px 12px",
                              border: "1px solid #E1DFDD",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {String(cell || "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {mergedData.data.length > 50 && (
                <Text
                  size={200}
                  style={{
                    color: "#605E5C",
                    marginTop: "8px",
                    display: "block",
                  }}
                >
                  Showing first 50 rows of {mergedData.data.length} total rows
                </Text>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderFilePanel = (
    side: "left" | "right",
    file: ExcelData | null,
    selectedSheet: number,
    onSheetChange: (index: number) => void,
    isLoading: boolean
  ) => {
    const sideColor = side === "left" ? "#0078D4" : "#107C41";
    const sideIcon =
      side === "left" ? (
        <DocumentArrowLeftRegular />
      ) : (
        <DocumentArrowRightRegular />
      );

    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          width: "100%",
        }}
      >
        {/* File Upload Section */}
        <Card
          style={{
            marginBottom: "16px",
            border: `2px solid ${file ? sideColor : "#E1DFDD"}`,
            backgroundColor: file ? `${sideColor}08` : "#FAFAFA",
          }}
        >
          <CardHeader
            header={
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div style={{ color: sideColor }}>{sideIcon}</div>
                <Text size={400} weight="semibold">
                  {side === "left" ? "Left File" : "Right File"}
                </Text>
                {file && (
                  <Badge appearance="outline" size="small" color="brand">
                    {file.sheets.length} sheet
                    {file.sheets.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            }
          />

          <div style={{ padding: "0 16px 16px" }}>
            {!file ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <DocumentTableRegular
                  style={{
                    fontSize: "32px",
                    color: "#C8C6C4",
                    marginBottom: "12px",
                  }}
                />
                <Text
                  size={300}
                  style={{
                    display: "block",
                    marginBottom: "12px",
                    color: "#605E5C",
                  }}
                >
                  Select an Excel file to compare
                </Text>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileUpload(e, side)}
                  style={{ display: "none" }}
                  id={`file-input-${side}`}
                  disabled={isLoading}
                />
                <label htmlFor={`file-input-${side}`}>
                  <Button
                    as="span"
                    appearance="primary"
                    disabled={isLoading}
                    icon={
                      isLoading ? (
                        <Spinner size="tiny" />
                      ) : (
                        <DocumentTableRegular />
                      )
                    }
                    style={{
                      backgroundColor: sideColor,
                      border: "none",
                      cursor: isLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {isLoading ? "Loading..." : "Choose Excel File"}
                  </Button>
                </label>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <Text
                    size={300}
                    weight="semibold"
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      marginRight: "8px",
                    }}
                  >
                    {file.fileName}
                  </Text>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleFileUpload(e, side)}
                    style={{ display: "none" }}
                    id={`file-replace-${side}`}
                    disabled={isLoading}
                  />
                  <label htmlFor={`file-replace-${side}`}>
                    <Button
                      as="span"
                      appearance="subtle"
                      size="small"
                      icon={<ArrowSyncRegular />}
                      disabled={isLoading}
                      style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
                    >
                      Replace
                    </Button>
                  </label>
                </div>

                {/* Sheet Selection */}
                {file.sheets.length > 1 && (
                  <div style={{ marginBottom: "12px" }}>
                    <Text
                      size={200}
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        color: "#605E5C",
                      }}
                    >
                      Select Sheet:
                    </Text>
                    <div
                      style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}
                    >
                      {file.sheets.map((sheet, index) => (
                        <Button
                          key={index}
                          appearance={
                            selectedSheet === index ? "primary" : "subtle"
                          }
                          size="small"
                          onClick={() => onSheetChange(index)}
                          style={{
                            backgroundColor:
                              selectedSheet === index
                                ? sideColor
                                : "transparent",
                            border:
                              selectedSheet === index
                                ? "none"
                                : `1px solid ${sideColor}40`,
                            color:
                              selectedSheet === index ? "white" : sideColor,
                          }}
                        >
                          {sheet.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sheet Info */}
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    fontSize: "12px",
                    color: "#605E5C",
                  }}
                >
                  <span>
                    Rows: {file.sheets[selectedSheet]?.data.length || 0}
                  </span>
                  <span>
                    Columns: {file.sheets[selectedSheet]?.headers.length || 0}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Table Display */}
        {file && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <Text size={300} weight="semibold">
                {file.sheets[selectedSheet]?.name || "Sheet"}
              </Text>
              <Badge appearance="outline" size="small">
                {file.sheets[selectedSheet]?.data.length || 0} rows
              </Badge>
            </div>
            {renderTable(file, selectedSheet, side)}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 1000,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "fixed",
          top: "2%",
          left: "2%",
          right: "2%",
          bottom: "2%",
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E1DFDD",
            backgroundColor: "#F8F9FA",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <DocumentTableRegular
                style={{ fontSize: "24px", color: "#107C41" }}
              />
              <Text size={600} weight="semibold">
                Excel File Comparison & Smart Merge
              </Text>
            </div>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={onClose}
              style={{ minWidth: "auto", padding: "8px" }}
            />
          </div>

          {/* Controls */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <SearchRegular style={{ fontSize: "16px", color: "#605E5C" }} />
              <Input
                placeholder="Search in tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                style={{ width: "200px" }}
              />
            </div>

            <Button
              appearance={highlightDifferences ? "primary" : "subtle"}
              size="small"
              icon={<FilterRegular />}
              onClick={() => setHighlightDifferences(!highlightDifferences)}
              disabled={!leftFile || !rightFile}
            >
              Highlight Differences
            </Button>

            {/* Smart Merge Button */}
            <Button
              appearance="primary"
              size="small"
              icon={
                isAnalyzing ? <Spinner size="tiny" /> : <BrainCircuitRegular />
              }
              onClick={handleSmartMerge}
              disabled={!leftFile || !rightFile || isAnalyzing}
              style={{
                backgroundColor: "#7719AA",
                border: "none",
                boxShadow: "0 2px 8px rgba(119, 25, 170, 0.3)",
              }}
            >
              {isAnalyzing ? "Analyzing..." : "Smart Merge with AI"}
            </Button>

            {leftFile && rightFile && !isAnalyzing && (
              <Badge appearance="filled" color="success" size="small">
                Ready for AI Analysis
              </Badge>
            )}
          </div>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div style={{ marginTop: "12px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                <BrainCircuitRegular
                  style={{ fontSize: "16px", color: "#7719AA" }}
                />
                <Text size={300} weight="semibold">
                  Mistral AI is analyzing your files...
                </Text>
              </div>
              <ProgressBar value={analysisProgress} max={100} />
              <Text size={200} style={{ color: "#605E5C", marginTop: "4px" }}>
                {analysisProgress < 30
                  ? "Reading file structures..."
                  : analysisProgress < 60
                  ? "Analyzing column patterns..."
                  : analysisProgress < 90
                  ? "Generating merge strategy..."
                  : "Finalizing results..."}
              </Text>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: "24px",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {/* Instructions */}
          {!leftFile && !rightFile && (
            <MessageBar
              intent="info"
              style={{ marginBottom: "24px", flexShrink: 0 }}
            >
              <MessageBarBody>
                <MessageBarTitle>Get Started with Smart Merge</MessageBarTitle>
                Upload two Excel files to compare them side by side. Use the
                Smart Merge feature to let Mistral AI automatically analyze and
                match columns between files, then generate a unified table
                preview with intelligent data merging.
              </MessageBarBody>
            </MessageBar>
          )}

          {/* Comparison View */}
          <div
            style={{
              flex: showMergePreview ? 0 : 1,
              display: "flex",
              gap: "20px",
              minHeight: showMergePreview ? "auto" : 0,
              overflow: "hidden",
              marginBottom: showMergePreview ? "0" : "0",
            }}
          >
            {renderFilePanel(
              "left",
              leftFile,
              leftSelectedSheet,
              setLeftSelectedSheet,
              loading.left
            )}

            {/* Divider */}
            <div
              style={{
                width: "2px",
                backgroundColor: "#E1DFDD",
                alignSelf: "stretch",
                flexShrink: 0,
              }}
            />

            {renderFilePanel(
              "right",
              rightFile,
              rightSelectedSheet,
              setRightSelectedSheet,
              loading.right
            )}
          </div>

          {/* Merge Preview */}
          {showMergePreview && renderMergePreview()}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E1DFDD",
            backgroundColor: "#F8F9FA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <Text size={200} style={{ color: "#605E5C" }}>
            Powered by SheetJS & Mistral AI • Supports .xlsx and .xls files
          </Text>

          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              appearance="subtle"
              onClick={() => {
                setLeftFile(null);
                setRightFile(null);
                setSearchTerm("");
                setHighlightDifferences(false);
                setMergeAnalysis(null);
                setMergedData(null);
                setShowMergePreview(false);
              }}
              disabled={!leftFile && !rightFile}
            >
              Clear All
            </Button>

            {mergedData && (
              <Button
                appearance="primary"
                onClick={() => {
                  // In a real implementation, this would export the merged data
                  const ws = XLSX.utils.aoa_to_sheet([
                    mergedData.headers,
                    ...mergedData.data,
                  ]);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Merged Data");
                  XLSX.writeFile(wb, "smart_merged_data.xlsx");
                }}
                style={{
                  backgroundColor: "#107C10",
                  border: "none",
                }}
              >
                Export Merged Data
              </Button>
            )}

            <Button appearance="primary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 1200px) {
          .comparison-panels {
            flex-direction: column !important;
          }
        }
        
        @media (max-width: 768px) {
          .excel-modal {
            top: 1% !important;
            left: 1% !important;
            right: 1% !important;
            bottom: 1% !important;
          }
          
          .excel-header {
            padding: 16px !important;
          }
          
          .excel-content {
            padding: 16px !important;
          }
        }
      `}</style>
    </>
  );
};
