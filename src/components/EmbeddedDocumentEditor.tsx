import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  Text,
  Button,
  Spinner,
  Textarea,
  Badge,
  Toast,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import {
  DocumentRegular,
  SaveRegular,
  DismissRegular,
  EditRegular,
  ShareRegular,
  PrintRegular,
  MoreHorizontalRegular,
  WarningRegular,
} from "@fluentui/react-icons";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentData {
  id: string;
  name: string;
  content: string;
  lastModified: Date;
  isReadOnly: boolean;
}

interface EmbeddedDocumentEditorProps {
  documentId: string;
  documentName: string;
  appColor: string;
  onClose: () => void;
  onSave?: (content: string) => void;
}

export const EmbeddedDocumentEditor: React.FC<EmbeddedDocumentEditorProps> = ({
  documentId,
  documentName,
  appColor,
  onClose,
  onSave,
}) => {
  const { dispatchToast } = useToastController();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock document content based on document name
      const mockContent = getMockDocumentContent(documentName);

      setDocument({
        id: documentId,
        name: documentName,
        content: mockContent,
        lastModified: new Date(),
        isReadOnly: false,
      });

      setEditedContent(mockContent);
      setIsLoading(false);
    };

    loadDocument();
  }, [documentId, documentName]);

  const getMockDocumentContent = (name: string): string => {
    if (name.toLowerCase().includes("report")) {
      return `# ${name}

## Executive Summary
This quarterly report provides a comprehensive overview of our business performance, highlighting key achievements and areas for improvement.

## Key Metrics
- Revenue: $2.4M (↑15% from last quarter)
- Customer Satisfaction: 94% (↑3%)
- Team Productivity: 87% (↑8%)

## Achievements
1. Successfully launched new product line
2. Expanded into two new markets
3. Improved customer retention by 12%

## Next Quarter Goals
- Increase market share by 10%
- Launch mobile application
- Expand team by 5 new hires

## Conclusion
We're on track to meet our annual targets and continue our growth trajectory.

---
*Last updated: ${new Date().toLocaleDateString()}*`;
    }

    if (name.toLowerCase().includes("proposal")) {
      return `# ${name}

## Project Overview
This proposal outlines our approach to delivering a comprehensive solution that meets your business objectives.

## Scope of Work
### Phase 1: Discovery & Planning
- Stakeholder interviews
- Requirements gathering
- Technical architecture design

### Phase 2: Development
- Core functionality implementation
- User interface design
- Integration with existing systems

### Phase 3: Testing & Deployment
- Quality assurance testing
- User acceptance testing
- Production deployment

## Timeline
- Phase 1: 2 weeks
- Phase 2: 6 weeks  
- Phase 3: 2 weeks
- **Total Duration: 10 weeks**

## Investment
- Development: $45,000
- Testing: $8,000
- Deployment: $5,000
- **Total: $58,000**

## Next Steps
1. Review and approve proposal
2. Sign contract and begin Phase 1
3. Schedule kickoff meeting

We're excited to partner with you on this project!`;
    }

    if (name.toLowerCase().includes("notes")) {
      return `# ${name}

## Meeting Date: ${new Date().toLocaleDateString()}
**Attendees:** Sarah Johnson, Mike Chen, Lisa Rodriguez, David Kim

## Agenda Items

### 1. Project Status Update
- Current milestone: 75% complete
- On track for delivery next Friday
- No major blockers identified

### 2. Budget Review
- Spent: $32,000 of $45,000 budget
- Remaining: $13,000
- Expected to finish under budget

### 3. Resource Allocation
- Need additional designer for final phase
- Mike to coordinate with HR
- Target start date: Monday

### 4. Client Feedback
- Very positive response to demo
- Minor UI adjustments requested
- Changes can be implemented this week

## Action Items
- [ ] Sarah: Finalize design mockups by Wednesday
- [ ] Mike: Schedule follow-up client call
- [ ] Lisa: Update project timeline
- [ ] David: Prepare deployment checklist

## Next Meeting
**Date:** Next Tuesday, 2:00 PM
**Location:** Conference Room B / Teams`;
    }

    return `# ${name}

Welcome to your document! This is a sample document that demonstrates the embedded editor functionality.

## Features
- Real-time editing
- Auto-save functionality
- Rich text formatting
- Collaborative editing (coming soon)

## Getting Started
You can edit this document directly within the dashboard. Changes are automatically saved to your Microsoft 365 account.

**Start typing to see the magic happen!**

---
*Document created: ${new Date().toLocaleDateString()}*`;
  };

  const handleSave = async () => {
    if (!document) return;

    setIsSaving(true);

    // Simulate save operation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setDocument((prev) =>
      prev
        ? {
            ...prev,
            content: editedContent,
            lastModified: new Date(),
          }
        : null
    );

    setIsSaving(false);
    setIsEditing(false);

    onSave?.(editedContent);

    dispatchToast(
      <Toast>
        <ToastTitle>Document Saved Successfully</ToastTitle>
      </Toast>,
      { intent: "success" }
    );
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedContent(document?.content || "");
    setIsEditing(false);
  };

  // Check if content has been modified
  const hasUnsavedChanges = isEditing && editedContent !== document?.content;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          height: "400px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F8F9FA",
          borderRadius: "8px",
          border: `2px solid ${appColor}20`,
        }}
      >
        <Spinner size="large" style={{ marginBottom: "16px" }} />
        <Text size={400} weight="semibold" style={{ marginBottom: "8px" }}>
          Loading Document
        </Text>
        <Text size={300} style={{ color: "#605E5C" }}>
          Connecting to Microsoft 365...
        </Text>
      </motion.div>
    );
  }

  if (!document) {
    return (
      <div
        style={{
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFF4CE",
          borderRadius: "8px",
          border: "2px solid #F7630C",
        }}
      >
        <Text size={400} style={{ color: "#F7630C" }}>
          Failed to load document
        </Text>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      style={{ height: "100%" }}
    >
      <Card
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          border: `2px solid ${appColor}`,
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* Document Header */}
        <CardHeader
          header={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
              }}
            >
              <DocumentRegular style={{ fontSize: "20px", color: appColor }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  size={400}
                  weight="semibold"
                  style={{
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {document.name}
                </Text>
                <Text size={200} style={{ color: "#605E5C", display: "block" }}>
                  Last modified: {document.lastModified.toLocaleString()}
                </Text>
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Badge appearance="outline" size="small" color="success">
                  Live
                </Badge>

                {/* Enhanced Unsaved Changes Badge */}
                <AnimatePresence>
                  {hasUnsavedChanges && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 10 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          backgroundColor: "#FFF4CE",
                          border: "2px solid #F7630C",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#8B4513",
                          boxShadow: "0 2px 8px rgba(247, 99, 12, 0.25)",
                          animation: "unsavedPulse 2s infinite ease-in-out",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {/* Animated background gradient */}
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: "-100%",
                            width: "100%",
                            height: "100%",
                            background:
                              "linear-gradient(90deg, transparent, rgba(247, 99, 12, 0.1), transparent)",
                            animation: "shimmer 2s infinite",
                          }}
                        />

                        <WarningRegular
                          style={{
                            fontSize: "14px",
                            color: "#F7630C",
                            filter:
                              "drop-shadow(0 0 2px rgba(247, 99, 12, 0.3))",
                          }}
                        />
                        <span style={{ position: "relative", zIndex: 1 }}>
                          Unsaved Changes
                        </span>

                        {/* Pulsing dot indicator */}
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: "#F7630C",
                            animation: "dotPulse 1.5s infinite",
                            boxShadow: "0 0 4px rgba(247, 99, 12, 0.6)",
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isEditing ? (
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<EditRegular />}
                    onClick={handleEdit}
                  >
                    Edit
                  </Button>
                ) : (
                  <div style={{ display: "flex", gap: "4px" }}>
                    <Button
                      appearance="primary"
                      size="small"
                      icon={
                        isSaving ? <Spinner size="tiny" /> : <SaveRegular />
                      }
                      onClick={handleSave}
                      disabled={isSaving}
                      style={{ backgroundColor: appColor, border: "none" }}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      appearance="subtle"
                      size="small"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <Button
                  appearance="subtle"
                  size="small"
                  icon={<DismissRegular />}
                  onClick={onClose}
                />
              </div>
            </div>
          }
        />

        {/* Document Content */}
        <div
          style={{
            flex: 1,
            padding: "16px",
            backgroundColor: "#FAFAFA",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Start typing your document content..."
              style={{
                flex: 1,
                minHeight: "300px",
                fontFamily: "Segoe UI, system-ui, sans-serif",
                fontSize: "14px",
                lineHeight: "1.6",
                border: `2px solid ${appColor}40`,
                borderRadius: "6px",
                padding: "16px",
                backgroundColor: "#FFFFFF",
                resize: "none",
              }}
              disabled={isSaving}
            />
          ) : (
            <div
              style={{
                flex: 1,
                padding: "16px",
                backgroundColor: "#FFFFFF",
                border: `1px solid ${appColor}20`,
                borderRadius: "6px",
                overflow: "auto",
                fontFamily: "Segoe UI, system-ui, sans-serif",
                fontSize: "14px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
              }}
            >
              {document.content.split("\n").map((line, index) => {
                // Simple markdown-like rendering
                if (line.startsWith("# ")) {
                  return (
                    <h1
                      key={index}
                      style={{
                        fontSize: "24px",
                        fontWeight: 600,
                        marginBottom: "16px",
                        color: "#323130",
                        borderBottom: `2px solid ${appColor}20`,
                        paddingBottom: "8px",
                      }}
                    >
                      {line.substring(2)}
                    </h1>
                  );
                }
                if (line.startsWith("## ")) {
                  return (
                    <h2
                      key={index}
                      style={{
                        fontSize: "20px",
                        fontWeight: 600,
                        marginBottom: "12px",
                        marginTop: "20px",
                        color: "#323130",
                      }}
                    >
                      {line.substring(3)}
                    </h2>
                  );
                }
                if (line.startsWith("### ")) {
                  return (
                    <h3
                      key={index}
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        marginBottom: "8px",
                        marginTop: "16px",
                        color: "#323130",
                      }}
                    >
                      {line.substring(4)}
                    </h3>
                  );
                }
                if (line.startsWith("- ") || line.startsWith("* ")) {
                  return (
                    <div
                      key={index}
                      style={{
                        marginLeft: "20px",
                        marginBottom: "4px",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: "-16px",
                          color: appColor,
                        }}
                      >
                        •
                      </span>
                      {line.substring(2)}
                    </div>
                  );
                }
                if (line.startsWith("---")) {
                  return (
                    <hr
                      key={index}
                      style={{
                        margin: "20px 0",
                        border: "none",
                        borderTop: `1px solid ${appColor}30`,
                      }}
                    />
                  );
                }
                if (line.trim() === "") {
                  return <br key={index} />;
                }
                return (
                  <p
                    key={index}
                    style={{
                      marginBottom: "8px",
                      color: "#323130",
                    }}
                  >
                    {line}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        {/* Document Footer */}
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#F8F9FA",
            borderTop: `1px solid ${appColor}20`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Text size={200} style={{ color: "#605E5C" }}>
              {isEditing ? "Editing mode" : "Read-only mode"}
            </Text>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              appearance="subtle"
              size="small"
              icon={<ShareRegular />}
              disabled={isEditing}
            >
              Share
            </Button>
            <Button
              appearance="subtle"
              size="small"
              icon={<PrintRegular />}
              disabled={isEditing}
            >
              Print
            </Button>
            <Button
              appearance="subtle"
              size="small"
              icon={<MoreHorizontalRegular />}
            >
              More
            </Button>
          </div>
        </div>
      </Card>

      <style>{`
        @keyframes unsavedPulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 2px 8px rgba(247, 99, 12, 0.25);
          }
          50% { 
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(247, 99, 12, 0.4);
          }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes dotPulse {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.6;
            transform: scale(1.2);
          }
        }
      `}</style>
    </motion.div>
  );
};
