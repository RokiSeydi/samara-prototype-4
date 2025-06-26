import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  Text,
  Button,
  Spinner,
  Input,
  Textarea,
  Badge,
  Toast,
  ToastTitle,
  useToastController,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  Field,
  Label,
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
  OpenRegular,
  CloudSyncRegular,
  SendRegular,
  PersonRegular,
} from "@fluentui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/msalConfig";
import { useGraphData } from "../hooks/useGraphData";

interface DocumentData {
  id: string;
  name: string;
  content: string;
  lastModified: Date;
  isReadOnly: boolean;
  webUrl?: string;
  isRealDocument?: boolean;
}

interface EmbeddedDocumentEditorProps {
  documentId: string;
  documentName: string;
  appColor: string;
  onClose: () => void;
  onSave?: (content: string) => void;
}

interface ShareDialogData {
  recipients: string[];
  subject: string;
  message: string;
  permission: "view" | "edit";
  includeLink: boolean;
}

export const EmbeddedDocumentEditor: React.FC<EmbeddedDocumentEditorProps> = ({
  documentId,
  documentName,
  appColor,
  onClose,
  onSave,
}) => {
  const { dispatchToast } = useToastController();
  const { instance, accounts } = useMsal();
  const { documents } = useGraphData();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [realDocumentUrl, setRealDocumentUrl] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareData, setShareData] = useState<ShareDialogData>({
    recipients: [],
    subject: "",
    message: "",
    permission: "view",
    includeLink: true,
  });

  // Check if this is a real Microsoft 365 document
  const isRealDocument = documents.some((doc) => doc.id === documentId);
  const realDoc = documents.find((doc) => doc.id === documentId);

  useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true);

      try {
        if (isRealDocument && realDoc) {
          console.log("📄 Loading real Microsoft 365 document:", realDoc.name);

          // For real documents, try to get content via Microsoft Graph API
          if (accounts.length > 0) {
            try {
              const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
              });

              // Try to get document content
              const contentResponse = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${documentId}/content`,
                {
                  headers: {
                    Authorization: `Bearer ${response.accessToken}`,
                  },
                }
              );

              let content = "";
              if (contentResponse.ok) {
                content = await contentResponse.text();
                console.log("✅ Real document content loaded");
              } else {
                console.log(
                  "⚠️ Could not load document content, using placeholder"
                );
                content = `This is a real Microsoft 365 document: "${realDoc.name}"\n\nTo edit this document with full functionality, please open it in Word Online or the desktop app.\n\nClick "Open in Word Online" below for the complete editing experience.`;
              }

              // Create browser-compatible edit URL
              const editUrl = `https://m365.cloud.microsoft/launch/Word?docid=${documentId}`;
              setRealDocumentUrl(editUrl);

              setDocument({
                id: documentId,
                name: realDoc.name,
                content: content,
                lastModified: new Date(realDoc.lastModified),
                isReadOnly: false,
                webUrl: realDoc.webUrl,
                isRealDocument: true,
              });

              setEditedContent(content);

              // Initialize share dialog with document name
              setShareData((prev) => ({
                ...prev,
                subject: `Shared document: ${realDoc.name}`,
                message: `Hi,\n\nI'm sharing the document "${realDoc.name}" with you.\n\nBest regards`,
              }));
            } catch (error) {
              console.error("❌ Failed to load real document:", error);
              throw error;
            }
          }
        } else {
          // For demo documents, simulate loading
          await new Promise((resolve) => setTimeout(resolve, 1500));

          const mockContent = getMockDocumentContent(documentName);

          setDocument({
            id: documentId,
            name: documentName,
            content: mockContent,
            lastModified: new Date(),
            isReadOnly: false,
            isRealDocument: false,
          });

          setEditedContent(mockContent);

          // Initialize share dialog for demo
          setShareData((prev) => ({
            ...prev,
            subject: `Shared document: ${documentName}`,
            message: `Hi,\n\nI'm sharing the document "${documentName}" with you.\n\nBest regards`,
          }));
        }
      } catch (error) {
        console.error("❌ Failed to load document:", error);

        // Fallback to demo content
        const mockContent = getMockDocumentContent(documentName);
        setDocument({
          id: documentId,
          name: documentName,
          content: mockContent,
          lastModified: new Date(),
          isReadOnly: false,
          isRealDocument: false,
        });
        setEditedContent(mockContent);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [documentId, documentName, isRealDocument, realDoc, accounts, instance]);

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

    try {
      if (document.isRealDocument && accounts.length > 0) {
        console.log("💾 Saving to real Microsoft 365 document...");

        // For real documents, try to save via Microsoft Graph API
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });

        // Try to update the document content
        const saveResponse = await fetch(
          `https://graph.microsoft.com/v1.0/me/drive/items/${document.id}/content`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${response.accessToken}`,
              "Content-Type": "text/plain; charset=utf-8",
            },
            body: editedContent,
          }
        );

        if (saveResponse.ok) {
          console.log("✅ Real document saved successfully");

          setDocument((prev) =>
            prev
              ? {
                  ...prev,
                  content: editedContent,
                  lastModified: new Date(),
                }
              : null
          );

          dispatchToast(
            <Toast>
              <ToastTitle>✅ Document Saved to Microsoft 365</ToastTitle>
            </Toast>,
            { intent: "success" }
          );
        } else {
          throw new Error("Failed to save to Microsoft 365");
        }
      } else {
        // For demo documents, simulate save
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

        dispatchToast(
          <Toast>
            <ToastTitle>✅ Demo Document Saved Locally</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      }

      setIsEditing(false);
      onSave?.(editedContent);
    } catch (error) {
      console.error("❌ Save failed:", error);

      dispatchToast(
        <Toast>
          <ToastTitle>
            ❌ Save Failed - Try Word Online for Full Editing
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedContent(document?.content || "");
    setIsEditing(false);
  };

  // ENHANCED: Better browser opening with multiple fallback URLs
  const handleOpenInWordOnline = async () => {
    if (document?.isRealDocument && accounts.length > 0) {
      console.log(
        "🌐 Opening in Word Online with enhanced browser compatibility..."
      );

      try {
        // Get fresh access token
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });

        // Try multiple URL strategies for better browser compatibility
        // const urlStrategies = [
        //   // Strategy 1: Direct Word Online with authentication
        //   `https://office.live.com/start/Word.aspx?auth_upn=${encodeURIComponent(
        //     accounts[0].username
        //   )}&omkt=en-US&ui=en-US&rs=en-US&WOPISrc=${encodeURIComponent(
        //     `https://graph.microsoft.com/v1.0/me/drive/items/${document.id}`
        //   )}&access_token=${response.accessToken}`,

        //   // Strategy 2: Office.com launcher
        //   `https://www.office.com/launch/word?auth=2&from=Samara&file=${document.id}&access_token=${response.accessToken}`,

        //   // Strategy 3: Direct SharePoint URL (if available)
        //   document.webUrl
        //     ? `${document.webUrl}?web=1&access_token=${response.accessToken}`
        //     : null,

        //   // Strategy 4: OneDrive direct edit
        //   `https://onedrive.live.com/edit.aspx?resid=${
        //     document.id
        //   }&authkey=${response.accessToken.substring(0, 20)}&em=2`,

        //   // Strategy 5: Fallback to original webUrl
        //   document.webUrl,
        // ].filter(Boolean);

        // console.log("🔗 Trying browser-compatible URLs...");

        // // Try the first strategy
        // const primaryUrl = urlStrategies[0];
        // console.log("🚀 Opening with primary URL:", primaryUrl);

        // window.open(primaryUrl, "_blank", "noopener,noreferrer");

        dispatchToast(
          <Toast>
            <ToastTitle>
              🌐 Opening in Word Online - Browser Compatible
            </ToastTitle>
          </Toast>,
          { intent: "info" }
        );

        // Also provide fallback options in console for debugging
        console.log("🔄 Fallback URLs available:", urlStrategies.slice(1));
      } catch (error) {
        console.error("❌ Failed to open in Word Online:", error);

        // Final fallback
        if (document.webUrl) {
          console.log("🔄 Using final fallback URL");
          window.open(document.webUrl, "_blank");
        }

        dispatchToast(
          <Toast>
            <ToastTitle>
              ⚠️ Opened with fallback URL - may require login
            </ToastTitle>
          </Toast>,
          { intent: "warning" }
        );
      }
    }
  };

  // NEW: Handle document sharing via email
  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleShareSubmit = async () => {
    if (!document || shareData.recipients.length === 0) {
      dispatchToast(
        <Toast>
          <ToastTitle>⚠️ Please add at least one recipient</ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
      return;
    }

    setIsSharing(true);

    try {
      if (document.isRealDocument && accounts.length > 0) {
        console.log("📧 Sharing real document via Outlook...");

        // Get access token
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });

        // Create sharing link if needed
        let sharingLink = document.webUrl;
        if (shareData.includeLink) {
          try {
            // Create a sharing link with appropriate permissions
            const linkResponse = await fetch(
              `https://graph.microsoft.com/v1.0/me/drive/items/${document.id}/createLink`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${response.accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  type: shareData.permission,
                  scope: "organization",
                }),
              }
            );

            if (linkResponse.ok) {
              const linkData = await linkResponse.json();
              sharingLink = linkData.link.webUrl;
              console.log("✅ Sharing link created:", sharingLink);
            }
          } catch (error) {
            console.warn(
              "⚠️ Could not create sharing link, using document URL"
            );
          }
        }

        // Compose email body
        const emailBody = `${shareData.message}

${shareData.includeLink ? `\n📄 Document Link: ${sharingLink}\n` : ""}

Document: ${document.name}
Permission: ${shareData.permission === "view" ? "View only" : "Can edit"}
Shared via: Samara AI Assistant

---
This document was shared from Samara - Microsoft 365 Integration Hub`;

        // Send email via Microsoft Graph
        const emailData = {
          message: {
            subject: shareData.subject,
            body: {
              contentType: "Text",
              content: emailBody,
            },
            toRecipients: shareData.recipients.map((email) => ({
              emailAddress: {
                address: email.trim(),
              },
            })),
            attachments: shareData.includeLink
              ? []
              : [
                  {
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    name: document.name,
                    contentType:
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    contentBytes: btoa(document.content), // Base64 encode content
                  },
                ],
          },
        };

        const emailResponse = await fetch(
          "https://graph.microsoft.com/v1.0/me/sendMail",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${response.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailData),
          }
        );

        if (emailResponse.ok) {
          console.log("✅ Email sent successfully");

          dispatchToast(
            <Toast>
              <ToastTitle>
                ✅ Document shared successfully via email!
              </ToastTitle>
            </Toast>,
            { intent: "success" }
          );

          setShowShareDialog(false);

          // Reset share data
          setShareData({
            recipients: [],
            subject: `Shared document: ${document.name}`,
            message: `Hi,\n\nI'm sharing the document "${document.name}" with you.\n\nBest regards`,
            permission: "view",
            includeLink: true,
          });
        } else {
          throw new Error("Failed to send email");
        }
      } else {
        // Demo mode - simulate sharing
        console.log("🎭 Demo: Simulating document sharing...");

        await new Promise((resolve) => setTimeout(resolve, 2000));

        dispatchToast(
          <Toast>
            <ToastTitle>
              ✅ Demo: Document sharing simulated successfully!
            </ToastTitle>
          </Toast>,
          { intent: "success" }
        );

        setShowShareDialog(false);
      }
    } catch (error) {
      console.error("❌ Failed to share document:", error);

      dispatchToast(
        <Toast>
          <ToastTitle>❌ Failed to share document: {error.message}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleAddRecipient = (email: string) => {
    if (email && !shareData.recipients.includes(email)) {
      setShareData((prev) => ({
        ...prev,
        recipients: [...prev.recipients, email],
      }));
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setShareData((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r !== email),
    }));
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
          {isRealDocument
            ? "Connecting to Microsoft 365..."
            : "Preparing demo document..."}
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
    <>
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
                <DocumentRegular
                  style={{ fontSize: "20px", color: appColor }}
                />
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
                  <Text
                    size={200}
                    style={{ color: "#605E5C", display: "block" }}
                  >
                    Last modified: {document.lastModified.toLocaleString()}
                  </Text>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Badge
                    appearance="outline"
                    size="small"
                    color={document.isRealDocument ? "success" : "brand"}
                  >
                    {document.isRealDocument ? (
                      <>
                        <CloudSyncRegular
                          style={{ fontSize: "12px", marginRight: "4px" }}
                        />
                        Microsoft 365
                      </>
                    ) : (
                      "Demo"
                    )}
                  </Badge>

                  {/* FIXED: Compact Unsaved Changes Badge */}
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
                            gap: "4px",
                            padding: "4px 8px",
                            backgroundColor: "#FFF4CE",
                            border: "1px solid #F7630C",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#8B4513",
                            boxShadow: "0 1px 4px rgba(247, 99, 12, 0.2)",
                            animation: "unsavedPulse 2s infinite ease-in-out",
                            whiteSpace: "nowrap",
                            maxWidth: "120px", // Prevent it from getting too wide
                          }}
                        >
                          <WarningRegular
                            style={{
                              fontSize: "12px",
                              color: "#F7630C",
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "10px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            Unsaved
                          </span>
                          <div
                            style={{
                              width: "4px",
                              height: "4px",
                              borderRadius: "50%",
                              backgroundColor: "#F7630C",
                              animation: "dotPulse 1.5s infinite",
                              flexShrink: 0,
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons - Better spacing */}
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    {document.isRealDocument && realDocumentUrl && (
                      <Button
                        appearance="primary"
                        size="small"
                        icon={<OpenRegular />}
                        onClick={handleOpenInWordOnline}
                        style={{
                          backgroundColor: "#107C10",
                          border: "none",
                          fontSize: "12px",
                          padding: "6px 12px",
                        }}
                      >
                        Word Online
                      </Button>
                    )}

                    {/* NEW: Share Button */}
                    <Button
                      appearance="secondary"
                      size="small"
                      icon={<ShareRegular />}
                      onClick={handleShare}
                      style={{
                        fontSize: "12px",
                        padding: "6px 12px",
                        backgroundColor: "#0078D4",
                        color: "white",
                        border: "none",
                      }}
                    >
                      Share
                    </Button>

                    {!isEditing ? (
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<EditRegular />}
                        onClick={handleEdit}
                        style={{ fontSize: "12px", padding: "6px 12px" }}
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
                          style={{
                            backgroundColor: appColor,
                            border: "none",
                            fontSize: "12px",
                            padding: "6px 12px",
                            minWidth: "70px", // Ensure consistent width
                          }}
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          appearance="subtle"
                          size="small"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          style={{ fontSize: "12px", padding: "6px 12px" }}
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
                      style={{
                        minWidth: "auto",
                        padding: "6px",
                        fontSize: "12px",
                      }}
                    />
                  </div>
                </div>
              </div>
            }
          />

          {/* Real Document Notice */}
          {document.isRealDocument && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#E6F3FF",
                border: "1px solid #C7E0F4",
                borderLeft: "none",
                borderRight: "none",
              }}
            >
              <Text size={200} style={{ color: "#0078D4" }}>
                📄 <strong>Real Microsoft 365 Document:</strong> For full
                editing capabilities, use "Word Online\" button above. Changes
                made here are saved to your OneDrive. Use "Share\" to send this
                document to colleagues via email.
              </Text>
            </div>
          )}

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
              {document.isRealDocument && (
                <Text size={200} style={{ color: "#107C10" }}>
                  • Synced with Microsoft 365
                </Text>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
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
              box-shadow: 0 1px 4px rgba(247, 99, 12, 0.2);
            }
            50% { 
              transform: scale(1.02);
              box-shadow: 0 2px 6px rgba(247, 99, 12, 0.3);
            }
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

      {/* NEW: Share Dialog */}
      <Dialog
        open={showShareDialog}
        onOpenChange={(event, data) => setShowShareDialog(data.open)}
      >
        <DialogSurface style={{ maxWidth: "600px", width: "90vw" }}>
          <DialogTitle>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ShareRegular style={{ fontSize: "24px", color: "#0078D4" }} />
              <div>
                <Text size={500} weight="semibold">
                  Share Document
                </Text>
                <Text size={300} style={{ color: "#605E5C", display: "block" }}>
                  Send "{document?.name}" to colleagues via email
                </Text>
              </div>
            </div>
          </DialogTitle>

          <DialogContent>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Recipients */}
              <Field label="Recipients" required>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <Input
                    placeholder="Enter email address and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const email = e.currentTarget.value.trim();
                        if (email && email.includes("@")) {
                          handleAddRecipient(email);
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />

                  {shareData.recipients.length > 0 && (
                    <div
                      style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                    >
                      {shareData.recipients.map((email, index) => (
                        <Badge
                          key={index}
                          appearance="filled"
                          color="brand"
                          style={{
                            padding: "4px 8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <PersonRegular style={{ fontSize: "12px" }} />
                          {email}
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<DismissRegular />}
                            onClick={() => handleRemoveRecipient(email)}
                            style={{
                              minWidth: "auto",
                              padding: "2px",
                              marginLeft: "4px",
                              color: "white",
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              {/* Permission Level */}
              <Field label="Permission Level">
                <div style={{ display: "flex", gap: "12px" }}>
                  <Button
                    appearance={
                      shareData.permission === "view" ? "primary" : "secondary"
                    }
                    size="small"
                    onClick={() =>
                      setShareData((prev) => ({ ...prev, permission: "view" }))
                    }
                  >
                    View Only
                  </Button>
                  <Button
                    appearance={
                      shareData.permission === "edit" ? "primary" : "secondary"
                    }
                    size="small"
                    onClick={() =>
                      setShareData((prev) => ({ ...prev, permission: "edit" }))
                    }
                  >
                    Can Edit
                  </Button>
                </div>
              </Field>

              {/* Subject */}
              <Field label="Email Subject">
                <Input
                  value={shareData.subject}
                  onChange={(e) =>
                    setShareData((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  placeholder="Enter email subject"
                />
              </Field>

              {/* Message */}
              <Field label="Message">
                <Textarea
                  value={shareData.message}
                  onChange={(e) =>
                    setShareData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  placeholder="Enter your message"
                  rows={4}
                />
              </Field>

              {/* Include Link Option */}
              <Field>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="checkbox"
                    checked={shareData.includeLink}
                    onChange={(e) =>
                      setShareData((prev) => ({
                        ...prev,
                        includeLink: e.target.checked,
                      }))
                    }
                  />
                  <Label>Include sharing link in email (recommended)</Label>
                </div>
              </Field>

              {/* Preview */}
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#F8F9FA",
                  borderRadius: "6px",
                  border: "1px solid #E1DFDD",
                }}
              >
                <Text
                  size={300}
                  weight="semibold"
                  style={{ display: "block", marginBottom: "8px" }}
                >
                  Email Preview:
                </Text>
                <Text size={200} style={{ color: "#605E5C" }}>
                  <strong>To:</strong>{" "}
                  {shareData.recipients.join(", ") || "No recipients"}
                  <br />
                  <strong>Subject:</strong> {shareData.subject}
                  <br />
                  <strong>Permission:</strong>{" "}
                  {shareData.permission === "view" ? "View only" : "Can edit"}
                  <br />
                  <strong>Include Link:</strong>{" "}
                  {shareData.includeLink ? "Yes" : "No (attach file)"}
                </Text>
              </div>
            </div>
          </DialogContent>

          <DialogActions>
            <Button
              appearance="secondary"
              onClick={() => setShowShareDialog(false)}
              disabled={isSharing}
            >
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleShareSubmit}
              disabled={isSharing || shareData.recipients.length === 0}
              icon={isSharing ? <Spinner size="tiny" /> : <SendRegular />}
              style={{ backgroundColor: "#0078D4", border: "none" }}
            >
              {isSharing ? "Sending..." : "Send Email"}
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </>
  );
};
