import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  Badge,
  Spinner,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import {
  DocumentTableRegular,
  DocumentRegular,
  SlideTextRegular,
  NotebookRegular,
  MailRegular,
  PeopleRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  PlugConnectedRegular,
  PlugDisconnectedRegular,
  WarningRegular,
  OpenRegular,
  MaximizeRegular,
  ChevronRightRegular,
  EditRegular,
  DismissRegular,
  CompareRegular,
  ArrowClockwiseRegular,
  MoreHorizontalRegular,
  ShareRegular,
  PrintRegular,
  SaveRegular,
} from "@fluentui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/msalConfig";
import { EmbeddedDocumentEditor } from "./EmbeddedDocumentEditor";
import { ExcelComparison } from "./ExcelComparison";
import { useGraphData } from "../hooks/useGraphData";

interface AppWidgetData {
  id: string;
  name: string;
  type: "excel" | "word" | "powerpoint" | "onenote" | "outlook" | "teams";
  color: string;
  isConnected: boolean;
  lastActivity?: string;
  recentItems?: Array<{
    id: string;
    name: string;
    preview: string;
    lastModified: string;
  }>;
  summary?: {
    totalFiles: number;
    recentActivity: string;
    quickStats?: string;
  };
}

interface AppWidgetProps {
  app: AppWidgetData;
  isMinimized: boolean;
  onToggleSize: () => void;
  onOpenInTab: () => void;
  onConnect: () => void;
  isHighlighted?: boolean;
  highlightIntensity?: "low" | "medium" | "high";
  onRefresh?: () => void; // NEW: Refresh callback
}

const getAppIcon = (type: string, size = "24px") => {
  const iconProps = { style: { fontSize: size } };
  switch (type) {
    case "excel":
      return <DocumentTableRegular {...iconProps} />;
    case "word":
      return <DocumentRegular {...iconProps} />;
    case "powerpoint":
      return <SlideTextRegular {...iconProps} />;
    case "onenote":
      return <NotebookRegular {...iconProps} />;
    case "outlook":
      return <MailRegular {...iconProps} />;
    case "teams":
      return <PeopleRegular {...iconProps} />;
    default:
      return <DocumentRegular {...iconProps} />;
  }
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getMockPreviewData = (type: string): AppWidgetData["recentItems"] => {
  switch (type) {
    case "excel":
      return [
        {
          id: "1",
          name: "Q4 Budget.xlsx",
          preview: "Revenue: $2.4M | Expenses: $1.8M",
          lastModified: "2 hours ago",
        },
        {
          id: "2",
          name: "Sales Data.xlsx",
          preview: "156 new entries | 23% growth",
          lastModified: "1 day ago",
        },
        {
          id: "3",
          name: "Inventory.xlsx",
          preview: "89% stock level | 12 low items",
          lastModified: "3 days ago",
        },
      ];
    case "word":
      return [
        {
          id: "1",
          name: "Project Report.docx",
          preview: "Final draft ready for review...",
          lastModified: "1 hour ago",
        },
        {
          id: "2",
          name: "Meeting Notes.docx",
          preview: "Action items: 5 pending, 3 completed",
          lastModified: "4 hours ago",
        },
        {
          id: "3",
          name: "Proposal.docx",
          preview: "Budget section updated with new figures",
          lastModified: "1 day ago",
        },
      ];
    case "powerpoint":
      return [
        {
          id: "1",
          name: "Q4 Presentation.pptx",
          preview: "24 slides | Charts updated",
          lastModified: "3 hours ago",
        },
        {
          id: "2",
          name: "Team Training.pptx",
          preview: "18 slides | Ready for delivery",
          lastModified: "2 days ago",
        },
      ];
    case "onenote":
      return [
        {
          id: "1",
          name: "Project Notes",
          preview: "Latest: Client feedback incorporated",
          lastModified: "30 min ago",
        },
        {
          id: "2",
          name: "Research",
          preview: "15 new references added",
          lastModified: "2 hours ago",
        },
      ];
    case "outlook":
      return [
        {
          id: "1",
          name: "Inbox",
          preview: "12 unread | 3 flagged important",
          lastModified: "5 min ago",
        },
        {
          id: "2",
          name: "Calendar",
          preview: "Next: Team meeting in 2 hours",
          lastModified: "1 hour ago",
        },
      ];
    case "teams":
      return [
        {
          id: "1",
          name: "Project Alpha",
          preview: "5 new messages | Sarah shared files",
          lastModified: "15 min ago",
        },
        {
          id: "2",
          name: "Marketing Team",
          preview: "Meeting scheduled for tomorrow",
          lastModified: "1 hour ago",
        },
      ];
    default:
      return [];
  }
};

export const AppWidget: React.FC<AppWidgetProps> = ({
  app,
  isMinimized,
  onToggleSize,
  onOpenInTab,
  onConnect,
  isHighlighted = false,
  highlightIntensity = "medium",
  onRefresh, // NEW: Refresh prop
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDataFlow, setShowDataFlow] = useState(false);
  const [embeddedDocument, setEmbeddedDocument] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showExcelComparison, setShowExcelComparison] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // NEW: Refresh state
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null); // NEW: Last refresh time

  // MSAL for authenticated file access
  const { instance, accounts } = useMsal();

  // Get real documents from Graph API
  const { documents, loading: documentsLoading, refetch } = useGraphData();

  useEffect(() => {
    if (isHighlighted) {
      setShowDataFlow(true);
      const timer = setTimeout(() => {
        setShowDataFlow(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  const handleConnect = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    onConnect();
  };

  const handleCardClick = () => {
    if (isMinimized && app.isConnected) {
      onToggleSize();
    }
  };

  // NEW: Handle refresh functionality
  const handleRefresh = async (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    console.log(`🔄 Refreshing ${app.name} widget...`);
    setIsRefreshing(true);

    try {
      // Call the parent refresh function if provided
      if (onRefresh) {
        await onRefresh();
      }

      // Also trigger the Graph data refetch for real documents
      if (app.isConnected && refetch) {
        await refetch();
      }

      // Simulate refresh time for demo mode
      if (!app.isConnected || !refetch) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      setLastRefreshTime(new Date());
      console.log(`✅ ${app.name} widget refreshed successfully`);
    } catch (error) {
      console.error(`❌ Failed to refresh ${app.name} widget:`, error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // FIXED: Separate functions for edit vs open
  const handleDocumentEdit = async (
    documentId: string,
    documentName: string,
    event?: React.MouseEvent
  ) => {
    if (event) {
      event.stopPropagation();
    }

    console.log("✏️ Opening document in embedded editor:", documentName);

    // For Word and OneNote documents, open in embedded editor
    if (app.type === "word" || app.type === "onenote") {
      setEmbeddedDocument({ id: documentId, name: documentName });
      return;
    }

    // For other types, show message about embedded editing
    console.log("ℹ️ Embedded editing not available for this file type");
  };

  const handleDocumentOpen = async (
    documentId: string,
    documentName: string,
    webUrl?: string,
    event?: React.MouseEvent
  ) => {
    if (event) {
      event.stopPropagation();
    }

    console.log("🌐 Opening document in external app:", documentName);

    try {
      // For real documents with webUrl, try authenticated access first
      if (webUrl && webUrl !== "#" && !webUrl.includes("demo")) {
        console.log("🌐 Opening real document with authenticated URL");

        // Get access token for authenticated access
        if (accounts.length > 0) {
          try {
            const response = await instance.acquireTokenSilent({
              ...loginRequest,
              account: accounts[0],
            });

            // Create authenticated URL with access token
            const authenticatedUrl = `${webUrl}?access_token=${response.accessToken}`;

            console.log("✅ Opening with authenticated URL");
            window.open(authenticatedUrl, "_blank");
            return;
          } catch (error) {
            console.warn(
              "⚠️ Token acquisition failed, trying alternative methods:",
              error
            );
          }
        }

        // Fallback: Try direct URL (might prompt for login)
        console.log("🔄 Fallback: Opening direct URL");
        window.open(webUrl, "_blank");
        return;
      }

      // For demo items or items without webUrl
      console.log("🎭 Demo item - showing notification");
      console.log(`Demo: Would open "${documentName}" in external app`);
    } catch (error) {
      console.error("❌ Failed to open document:", error);
    }
  };

  // Enhanced app opening with proper authentication
  const handleOpenMainApp = async () => {
    console.log("🚀 Opening main app:", app.type);

    try {
      // Get access token for authenticated access
      if (accounts.length > 0) {
        try {
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          });

          // Create authenticated URLs for each app
          const authenticatedUrls = {
            excel: `https://office.live.com/start/Excel.aspx?auth_upn=${accounts[0].username}&access_token=${response.accessToken}`,
            word: `https://office.live.com/start/Word.aspx?auth_upn=${accounts[0].username}&access_token=${response.accessToken}`,
            powerpoint: `https://office.live.com/start/PowerPoint.aspx?auth_upn=${accounts[0].username}&access_token=${response.accessToken}`,
            onenote: `https://www.onenote.com/notebooks?auth_upn=${accounts[0].username}&access_token=${response.accessToken}`,
            outlook: `https://outlook.live.com/mail/?auth_upn=${accounts[0].username}&access_token=${response.accessToken}`,
            teams: `https://teams.microsoft.com/?auth_upn=${accounts[0].username}&access_token=${response.accessToken}`,
          };

          const authenticatedUrl = authenticatedUrls[app.type];
          if (authenticatedUrl) {
            console.log("✅ Opening with authenticated app URL");
            window.open(authenticatedUrl, "_blank");
            return;
          }
        } catch (error) {
          console.warn("⚠️ Token acquisition failed for app opening:", error);
        }
      }

      // Fallback: Use standard URLs (might prompt for login)
      const standardUrls = {
        excel: "https://office.live.com/start/Excel.aspx",
        word: "https://office.live.com/start/Word.aspx",
        powerpoint: "https://office.live.com/start/PowerPoint.aspx",
        onenote: "https://www.onenote.com/notebooks",
        outlook: "https://outlook.live.com",
        teams: "https://teams.microsoft.com",
      };

      const standardUrl = standardUrls[app.type];
      if (standardUrl) {
        console.log("🔄 Fallback: Opening standard app URL");
        window.open(standardUrl, "_blank");
      }
    } catch (error) {
      console.error("❌ Failed to open app:", error);
    }
  };

  const handleCloseEmbeddedDocument = () => {
    setEmbeddedDocument(null);
  };

  const handleSaveDocument = (content: string) => {
    console.log("Document saved:", content);
    // In real implementation, this would save to Microsoft Graph API
  };

  const handleExcelComparison = (event: React.MouseEvent) => {
    event.stopPropagation();
    setShowExcelComparison(true);
  };

  const getHighlightStyles = () => {
    if (!isHighlighted) return {};

    const intensityStyles = {
      low: {
        boxShadow: `0 0 20px ${app.color}40`,
        borderColor: app.color,
        borderWidth: "2px",
      },
      medium: {
        boxShadow: `0 0 30px ${app.color}60, 0 0 60px ${app.color}30`,
        borderColor: app.color,
        borderWidth: "3px",
      },
      high: {
        boxShadow: `0 0 40px ${app.color}80, 0 0 80px ${app.color}40`,
        borderColor: app.color,
        borderWidth: "4px",
      },
    };

    return intensityStyles[highlightIntensity];
  };

  // Get real documents for this app type
  const getRealDocumentsForApp = () => {
    if (!app.isConnected || documentsLoading) return [];

    return documents
      .filter((doc) => doc.type === app.type)
      .slice(0, 3) // Show only top 3 most recent
      .map((doc) => ({
        id: doc.id,
        name: doc.name,
        preview:
          doc.summary?.substring(0, 60) + "..." || "No preview available",
        lastModified: formatTimeAgo(doc.lastModified),
        webUrl: doc.webUrl,
      }));
  };

  // Get app summary based on real documents
  const getAppSummary = () => {
    if (!app.isConnected) return undefined;

    const appDocuments = documents.filter((doc) => doc.type === app.type);
    const totalFiles = appDocuments.length;

    if (totalFiles === 0) {
      return {
        totalFiles: 0,
        recentActivity: "No documents found",
        quickStats: "Create your first document",
      };
    }

    const mostRecent = appDocuments[0];
    const recentActivity = mostRecent
      ? `Updated "${
          mostRecent.name.length > 20
            ? mostRecent.name.substring(0, 20) + "..."
            : mostRecent.name
        }"`
      : "No recent activity";

    return {
      totalFiles,
      recentActivity,
      quickStats: `${totalFiles} file${totalFiles !== 1 ? "s" : ""}`,
    };
  };

  if (!app.isConnected) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          ...getHighlightStyles(),
        }}
        whileHover={{ scale: 1.02 }}
        style={{
          width: isMinimized ? "240px" : "280px",
          height: "auto",
          minHeight: "280px",
        }}
      >
        <Card
          style={{
            height: "100%",
            border: `2px solid ${isHighlighted ? app.color : "#E1DFDD"}`,
            display: "flex",
            flexDirection: "column",
            backgroundColor: isHighlighted ? `${app.color}08` : "#FAFAFA",
            cursor: "default",
            position: "relative",
            overflow: "visible",
            ...getHighlightStyles(),
          }}
        >
          <CardHeader
            header={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <div style={{ color: app.color }}>
                  {getAppIcon(app.type, "28px")}
                </div>
                <div style={{ flex: 1 }}>
                  <Text
                    size={400}
                    weight="semibold"
                    style={{ display: "block" }}
                  >
                    {app.name}
                  </Text>
                  <Text
                    size={200}
                    style={{ color: "#605E5C", display: "block" }}
                  >
                    Not connected
                  </Text>
                </div>
                {isHighlighted && (
                  <Badge
                    color="warning"
                    size="small"
                    style={{ fontSize: "10px" }}
                  >
                    Required
                  </Badge>
                )}
              </div>
            }
          />

          <CardPreview
            style={{
              flex: 1,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              textAlign: "center",
              minHeight: "200px",
            }}
          >
            <div style={{ marginBottom: "20px", width: "100%" }}>
              <PlugConnectedRegular
                style={{
                  fontSize: "32px",
                  color: "#C8C6C4",
                  marginBottom: "12px",
                  display: "block",
                }}
              />
              <Text
                size={300}
                style={{
                  color: "#605E5C",
                  lineHeight: "1.4",
                  display: "block",
                  marginBottom: "16px",
                }}
              >
                Connect to access your {app.name.replace("Microsoft ", "")}{" "}
                files and enable AI commands
              </Text>

              <div
                style={{
                  fontSize: "11px",
                  color: "#8A8886",
                  textAlign: "left",
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  padding: "12px",
                  borderRadius: "6px",
                  border: `1px solid ${app.color}20`,
                }}
              >
                <Text
                  size={200}
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  What you'll get:
                </Text>
                <Text
                  size={200}
                  style={{ display: "block", marginBottom: "4px" }}
                >
                  ✓ Live document previews
                </Text>
                <Text
                  size={200}
                  style={{ display: "block", marginBottom: "4px" }}
                >
                  ✓ AI-powered commands
                </Text>
                <Text size={200} style={{ display: "block" }}>
                  ✓ Real-time synchronization
                </Text>
                <Text size={200} style={{ display: "block", marginTop: "4px" }}>
                  ✓ Direct file access without re-login
                </Text>
                {app.type === "excel" && (
                  <Text
                    size={200}
                    style={{ display: "block", marginTop: "4px" }}
                  >
                    ✓ Side-by-side file comparison
                  </Text>
                )}
                <Text size={200} style={{ display: "block", marginTop: "4px" }}>
                  ✓ Refresh to see latest documents
                </Text>
              </div>
            </div>

            <div style={{ width: "100%" }}>
              <Button
                appearance="primary"
                size="medium"
                onClick={handleConnect}
                disabled={isLoading}
                icon={
                  isLoading ? <Spinner size="tiny" /> : <PlugConnectedRegular />
                }
                style={{
                  backgroundColor: app.color,
                  border: "none",
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  boxShadow: `0 2px 8px ${app.color}40`,
                  width: "100%",
                  height: "44px",
                  transition: "all 0.2s ease",
                }}
              >
                {isLoading ? "Connecting..." : "Connect App"}
              </Button>
            </div>
          </CardPreview>

          {isHighlighted && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                border: `3px solid ${app.color}`,
                borderRadius: "8px",
                animation: "highlightPulse 2s infinite",
                pointerEvents: "none",
              }}
            />
          )}
        </Card>
      </motion.div>
    );
  }

  // Use real documents when available, fallback to mock data
  const recentItems = getRealDocumentsForApp();
  const fallbackItems = getMockPreviewData(app.type);
  const displayItems = recentItems.length > 0 ? recentItems : fallbackItems;
  const appSummary = getAppSummary() || app.summary;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          ...getHighlightStyles(),
        }}
        whileHover={{ scale: 1.02 }}
        style={{
          width: isMinimized ? "250px" : embeddedDocument ? "600px" : "400px",
          height: isMinimized ? "150px" : embeddedDocument ? "500px" : "320px",
          cursor: isMinimized ? "pointer" : "default",
          position: "relative",
        }}
        onClick={handleCardClick}
      >
        {showDataFlow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              top: "-10px",
              left: "-10px",
              right: "-10px",
              bottom: "-10px",
              borderRadius: "12px",
              background: `linear-gradient(45deg, ${app.color}20, transparent, ${app.color}20)`,
              backgroundSize: "200% 200%",
              animation: "dataFlow 2s ease-in-out infinite",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
        )}

        {isHighlighted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: app.color,
              zIndex: 10,
              boxShadow: `0 0 10px ${app.color}`,
              animation: "pulse 1.5s infinite",
            }}
          />
        )}

        {isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              backgroundColor: `${app.color}`,
              color: "white",
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "10px",
              fontWeight: 600,
              zIndex: 10,
              boxShadow: `0 2px 4px ${app.color}40`,
              border: `1px solid ${app.color}`,
            }}
          >
            Click to expand
          </motion.div>
        )}

        <Card
          style={{
            height: "100%",
            border: `2px solid ${isHighlighted ? app.color : `${app.color}40`}`,
            backgroundColor: isHighlighted
              ? `${app.color}12`
              : `${app.color}08`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
            zIndex: 1,
            transition: "all 0.3s ease",
            ...getHighlightStyles(),
          }}
        >
          <CardHeader
            header={
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div style={{ color: app.color }}>
                  {getAppIcon(app.type, "20px")}
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    paddingRight: isMinimized ? "100px" : "0",
                  }}
                >
                  <Text
                    size={isMinimized ? 300 : 400}
                    weight="semibold"
                    style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {app.name}
                  </Text>
                  {app.lastActivity && !isMinimized && (
                    <Text
                      size={200}
                      style={{
                        color: "#605E5C",
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {app.lastActivity}
                    </Text>
                  )}
                  {/* NEW: Last refresh indicator */}
                  {lastRefreshTime && !isMinimized && (
                    <Text
                      size={200}
                      style={{
                        color: "#107C10",
                        display: "block",
                        fontSize: "11px",
                      }}
                    >
                      ↻ Refreshed {formatTimeAgo(lastRefreshTime.toISOString())}
                    </Text>
                  )}
                </div>
                {!isMinimized && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Badge
                      appearance="filled"
                      color={isHighlighted ? "important" : "success"}
                      size="small"
                      style={{
                        animation: isHighlighted
                          ? "pulse 1.5s infinite"
                          : "none",
                      }}
                    >
                      {isHighlighted
                        ? "Active"
                        : documentsLoading || isRefreshing
                        ? "Loading..."
                        : "Live"}
                    </Badge>
                    {embeddedDocument && (
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<DismissRegular />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseEmbeddedDocument();
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            }
          />

          <CardPreview
            style={{
              flex: 1,
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              position: "relative",
            }}
          >
            {embeddedDocument ? (
              <EmbeddedDocumentEditor
                documentId={embeddedDocument.id}
                documentName={embeddedDocument.name}
                appColor={app.color}
                onClose={handleCloseEmbeddedDocument}
                onSave={handleSaveDocument}
              />
            ) : isMinimized ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  textAlign: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    filter: "blur(8px)",
                    opacity: 0.3,
                    pointerEvents: "none",
                    overflow: "hidden",
                  }}
                >
                  {appSummary && (
                    <div style={{ padding: "8px" }}>
                      <Text
                        size={200}
                        style={{ display: "block", marginBottom: "4px" }}
                      >
                        {appSummary.quickStats ||
                          `${appSummary.totalFiles} files`}
                      </Text>
                      <Text size={100} style={{ color: "#605E5C" }}>
                        {appSummary.recentActivity}
                      </Text>
                    </div>
                  )}

                  {displayItems[0] && (
                    <div
                      style={{
                        padding: "6px",
                        margin: "8px",
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        borderRadius: "4px",
                      }}
                    >
                      <Text size={100} style={{ display: "block" }}>
                        {displayItems[0].name}
                      </Text>
                      <Text size={100} style={{ color: "#605E5C" }}>
                        {displayItems[0].preview.substring(0, 30)}...
                      </Text>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    padding: "16px",
                    borderRadius: "8px",
                    border: `1px solid ${app.color}30`,
                    backdropFilter: "blur(10px)",
                    boxShadow: `0 4px 12px ${app.color}20`,
                  }}
                >
                  <div style={{ color: app.color, marginBottom: "8px" }}>
                    {getAppIcon(app.type, "32px")}
                  </div>
                  <Text
                    size={400}
                    weight="semibold"
                    style={{
                      display: "block",
                      color: "#323130",
                      marginBottom: "4px",
                    }}
                  >
                    {app.name.replace("Microsoft ", "")}
                  </Text>
                  <Text
                    size={200}
                    style={{
                      color: "#605E5C",
                      display: "block",
                    }}
                  >
                    {appSummary?.totalFiles || 0} files •{" "}
                    {app.lastActivity || "Active"}
                  </Text>
                </div>
              </div>
            ) : (
              <div
                style={{
                  height: "100%",
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
                    marginBottom: "12px",
                  }}
                >
                  <Text
                    size={300}
                    weight="semibold"
                    style={{ display: "block" }}
                  >
                    {documentsLoading || isRefreshing
                      ? "Loading Documents..."
                      : "Recent Activity"}
                  </Text>

                  {/* NEW: Refresh Button */}
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={
                      isRefreshing ? (
                        <Spinner size="tiny" />
                      ) : (
                        <ArrowClockwiseRegular />
                      )
                    }
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    style={{
                      minWidth: "auto",
                      padding: "4px 8px",
                      color: app.color,
                      border: `1px solid ${app.color}40`,
                      borderRadius: "4px",
                    }}
                    title={
                      isRefreshing
                        ? "Refreshing..."
                        : "Refresh to see latest documents"
                    }
                  >
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>

                {documentsLoading || isRefreshing ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                    }}
                  >
                    <Spinner size="medium" />
                  </div>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      minHeight: 0,
                      paddingRight: "4px",
                    }}
                  >
                    {displayItems.length === 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          textAlign: "center",
                          padding: "20px",
                        }}
                      >
                        <div style={{ color: app.color, marginBottom: "12px" }}>
                          {getAppIcon(app.type, "32px")}
                        </div>
                        <Text
                          size={300}
                          style={{ color: "#605E5C", marginBottom: "8px" }}
                        >
                          No {app.name.replace("Microsoft ", "")} documents
                          found
                        </Text>
                        <Text size={200} style={{ color: "#8A8886" }}>
                          Create your first document to see it here
                        </Text>
                      </div>
                    ) : (
                      displayItems.slice(0, 3).map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          style={{
                            padding: "8px",
                            marginBottom: "8px",
                            backgroundColor: isHighlighted
                              ? `${app.color}20`
                              : "rgba(255, 255, 255, 0.8)",
                            borderRadius: "6px",
                            border: `1px solid ${app.color}${
                              isHighlighted ? "60" : "20"
                            }`,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.3s ease",
                            cursor: "pointer",
                          }}
                          onClick={(e) =>
                            handleDocumentEdit(item.id, item.name, e)
                          }
                          whileHover={{ scale: 1.02 }}
                        >
                          {/* FIXED: Better layout for document items */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              size={200}
                              weight="semibold"
                              style={{
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                marginBottom: "2px",
                              }}
                              title={item.name} // Show full name on hover
                            >
                              {item.name}
                            </Text>
                            <Text
                              size={100}
                              style={{
                                color: "#605E5C",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                marginBottom: "2px",
                              }}
                            >
                              {item.preview}
                            </Text>
                            <Text
                              size={100}
                              style={{ color: "#888", display: "block" }}
                            >
                              {item.lastModified}
                            </Text>
                          </div>

                          {/* FIXED: Compact action buttons */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "2px",
                              flexShrink: 0,
                            }}
                          >
                            {(app.type === "word" ||
                              app.type === "onenote") && (
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<EditRegular />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDocumentEdit(item.id, item.name, e);
                                }}
                                style={{
                                  minWidth: "auto",
                                  padding: "2px",
                                  color: app.color,
                                  fontSize: "10px",
                                }}
                                title="Edit in Samara"
                              />
                            )}
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<OpenRegular />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDocumentOpen(
                                  item.id,
                                  item.name,
                                  item.webUrl,
                                  e
                                );
                              }}
                              style={{
                                minWidth: "auto",
                                padding: "2px",
                                color: "#605E5C",
                                fontSize: "10px",
                              }}
                              title="Open in Microsoft 365"
                            />
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </CardPreview>

          {/* FIXED: Better footer with More menu */}
          {!embeddedDocument && !isMinimized && (
            <div
              style={{
                padding: "8px 16px",
                borderTop: `1px solid ${app.color}20`,
                display: "flex",
                gap: "8px",
                justifyContent: "space-between",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(4px)",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<MaximizeRegular />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSize();
                  }}
                >
                  Minimize
                </Button>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  appearance="primary"
                  size="small"
                  icon={<OpenRegular />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenMainApp();
                  }}
                  style={{ backgroundColor: app.color, border: "none" }}
                >
                  Open App
                </Button>

                {/* NEW: More menu with additional actions */}
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<MoreHorizontalRegular />}
                      style={{ minWidth: "auto", padding: "6px" }}
                    />
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      {app.type === "excel" && (
                        <MenuItem
                          icon={<CompareRegular />}
                          onClick={handleExcelComparison}
                        >
                          Compare Files
                        </MenuItem>
                      )}
                      <MenuItem
                        icon={<ShareRegular />}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Share functionality coming soon");
                        }}
                      >
                        Share App
                      </MenuItem>
                      <MenuItem
                        icon={<SaveRegular />}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Export functionality coming soon");
                        }}
                      >
                        Export Data
                      </MenuItem>
                      <MenuItem
                        icon={<PrintRegular />}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Print functionality coming soon");
                        }}
                      >
                        Print Summary
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </div>
            </div>
          )}
        </Card>

        <style>{`
          @keyframes dataFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
          }

          @keyframes highlightPulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </motion.div>

      {/* Excel Comparison Modal */}
      <AnimatePresence>
        {showExcelComparison && (
          <ExcelComparison
            isOpen={showExcelComparison}
            onClose={() => setShowExcelComparison(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
