import React from "react";
import { Card, Text, Badge } from "@fluentui/react-components";
import {
  DocumentRegular,
  DocumentTableRegular,
  SlideTextRegular,
  NotebookRegular,
  TabsRegular,
} from "@fluentui/react-icons";
import { motion } from "framer-motion";
import type { OfficeDocument } from "../types";

interface DocumentCardProps {
  document: OfficeDocument;
  scale: number;
  isZoomed: boolean;
  onClick: () => void;
}

const getDocumentIcon = (type: string) => {
  switch (type) {
    case "excel":
      return (
        <DocumentTableRegular style={{ fontSize: "24px", color: "#107C41" }} />
      );
    case "word":
      return <DocumentRegular style={{ fontSize: "24px", color: "#185ABD" }} />;
    case "powerpoint":
      return (
        <SlideTextRegular style={{ fontSize: "24px", color: "#D24726" }} />
      );
    case "onenote":
      return <NotebookRegular style={{ fontSize: "24px", color: "#7719AA" }} />;
    case "teams":
      return <TabsRegular style={{ fontSize: "24px", color: "#6264A7" }} />;
    default:
      return <DocumentRegular style={{ fontSize: "24px", color: "#605E5C" }} />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  scale,
  isZoomed,
  onClick,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: scale > 0.5 ? 1.05 : 1.02 }}
      transition={{ duration: 0.2 }}
      style={{
        cursor: "pointer",
        height: isZoomed ? "400px" : "200px",
        width: isZoomed ? "350px" : "250px",
      }}
      {...{ onClick: onClick }}
    >
      <Card
        style={{
          height: "100%",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          border: "1px solid #E1DFDD",
          borderRadius: "8px",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {getDocumentIcon(document.type)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text
              weight="semibold"
              size={isZoomed ? 500 : 400}
              style={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {document.name}
            </Text>
            <Text size={300} style={{ color: "#605E5C", display: "block" }}>
              {new Date(document.lastModified).toLocaleDateString()}
            </Text>
          </div>
        </div>

        {isZoomed && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <Badge appearance="outline" size="small">
              {formatFileSize(document.size)}
            </Badge>

            {document.summary && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#F3F2F1",
                  borderRadius: "4px",
                  flex: 1,
                }}
              >
                <Text size={300} style={{ color: "#323130" }}>
                  {document.summary}
                </Text>
              </div>
            )}

            <div style={{ marginTop: "auto" }}>
              <Text size={200} style={{ color: "#605E5C" }}>
                Click to open in Microsoft 365
              </Text>
            </div>
          </div>
        )}

        {!isZoomed && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Badge appearance="outline" size="small">
              {document.type.toUpperCase()}
            </Badge>
            <Text size={200} style={{ color: "#605E5C" }}>
              {formatFileSize(document.size)}
            </Text>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
