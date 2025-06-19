import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Text } from "@fluentui/react-components";
import {
  ZoomInRegular,
  ZoomOutRegular,
  GridRegular,
} from "@fluentui/react-icons";
import { DocumentCard } from "./DocumentCard";
import type { OfficeDocument, ZoomState } from "../types";

interface DocumentGridProps {
  documents: OfficeDocument[];
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({ documents }) => {
  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: 1,
    focusedItem: null,
  });

  const handleZoomIn = () => {
    setZoomState((prev) => ({
      ...prev,
      scale: Math.min(prev.scale + 0.2, 2),
    }));
  };

  const handleZoomOut = () => {
    setZoomState((prev) => ({
      ...prev,
      scale: Math.max(prev.scale - 0.2, 0.4),
      focusedItem: prev.scale <= 0.6 ? null : prev.focusedItem,
    }));
  };

  const handleCardClick = (documentId: string, webUrl: string) => {
    if (zoomState.scale > 0.8) {
      // Open the document in Microsoft 365
      window.open(webUrl, "_blank");
    } else {
      // Focus on the item for bird's eye view
      setZoomState((prev) => ({
        ...prev,
        focusedItem: prev.focusedItem === documentId ? null : documentId,
      }));
    }
  };

  const resetView = () => {
    setZoomState({ scale: 1, focusedItem: null });
  };

  const getGridColumns = () => {
    if (zoomState.scale >= 1.5) return 2;
    if (zoomState.scale >= 1) return 3;
    if (zoomState.scale >= 0.7) return 4;
    return 6;
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          padding: "16px",
          backgroundColor: "#F3F2F1",
          borderRadius: "8px",
        }}
      >
        <div>
          <Text size={500} weight="semibold">
            Your Microsoft 365 Documents
          </Text>
          <Text
            size={300}
            style={{ display: "block", color: "#605E5C", marginTop: "4px" }}
          >
            {documents.length} documents found
          </Text>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Text size={300} style={{ color: "#605E5C" }}>
            Zoom: {Math.round(zoomState.scale * 100)}%
          </Text>
          <Button
            appearance="subtle"
            icon={<ZoomOutRegular />}
            onClick={handleZoomOut}
            disabled={zoomState.scale <= 0.4}
          />
          <Button
            appearance="subtle"
            icon={<ZoomInRegular />}
            onClick={handleZoomIn}
            disabled={zoomState.scale >= 2}
          />
          <Button
            appearance="subtle"
            icon={<GridRegular />}
            onClick={resetView}
          >
            Reset View
          </Button>
        </div>
      </div>

      {/* Document Grid */}
      <motion.div
        layout
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`,
          gap: zoomState.scale > 1 ? "24px" : "16px",
          justifyItems: "center",
        }}
      >
        <AnimatePresence>
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              scale={zoomState.scale}
              isZoomed={
                zoomState.focusedItem === document.id || zoomState.scale > 1.2
              }
              onClick={() => handleCardClick(document.id, document.webUrl)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Instructions */}
      <div
        style={{
          marginTop: "32px",
          padding: "16px",
          backgroundColor: "#EDF3FF",
          borderRadius: "8px",
          border: "1px solid #C7E0F4",
        }}
      >
        <Text size={300} style={{ color: "#323130" }}>
          <strong>How to use:</strong> Use zoom controls to get a bird's eye
          view of your documents. When zoomed out, click cards to focus on them.
          When zoomed in, click cards to open them in Microsoft 365.
        </Text>
      </div>
    </div>
  );
};
