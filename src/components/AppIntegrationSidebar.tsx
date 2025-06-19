import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  Text,
  Switch,
  Badge,
  Spinner,
  Toast,
  ToastTitle,
  useToastController,
  Toaster,
} from "@fluentui/react-components";
import {
  DocumentTableRegular,
  DocumentRegular,
  SlideTextRegular,
  NotebookRegular,
  MailRegular,
  PeopleRegular,
  CheckmarkCircleRegular,
  PlugConnectedRegular,
  PlugDisconnectedRegular,
  WarningRegular,
} from "@fluentui/react-icons";
import { motion, AnimatePresence } from "framer-motion";

interface AppIntegration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  isConnected: boolean;
  isConnecting: boolean;
  permissions: string[];
  lastSync?: Date;
}

interface AppIntegrationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAppToggle?: (appId: string, connected: boolean) => void;
  highlightedApps?: string[]; // Apps that need to be connected
}

export const AppIntegrationSidebar: React.FC<AppIntegrationSidebarProps> = ({
  isOpen,
  onClose,
  onAppToggle,
  highlightedApps = [],
}) => {
  const { dispatchToast } = useToastController();
  const [apps, setApps] = useState<AppIntegration[]>([
    {
      id: "excel",
      name: "Microsoft Excel",
      description: "Access spreadsheets, workbooks, and data analysis tools",
      icon: <DocumentTableRegular style={{ fontSize: "24px" }} />,
      color: "#107C41",
      isConnected: true,
      isConnecting: false,
      permissions: ["Files.Read", "Files.ReadWrite"],
      lastSync: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    },
    {
      id: "word",
      name: "Microsoft Word",
      description: "Access documents, templates, and collaborative editing",
      icon: <DocumentRegular style={{ fontSize: "24px" }} />,
      color: "#185ABD",
      isConnected: true,
      isConnecting: false,
      permissions: ["Files.Read", "Files.ReadWrite"],
      lastSync: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: "powerpoint",
      name: "Microsoft PowerPoint",
      description: "Access presentations, slides, and design templates",
      icon: <SlideTextRegular style={{ fontSize: "24px" }} />,
      color: "#D24726",
      isConnected: false,
      isConnecting: false,
      permissions: ["Files.Read", "Files.ReadWrite"],
    },
    {
      id: "onenote",
      name: "Microsoft OneNote",
      description: "Access notebooks, sections, and collaborative notes",
      icon: <NotebookRegular style={{ fontSize: "24px" }} />,
      color: "#7719AA",
      isConnected: true,
      isConnecting: false,
      permissions: ["Notes.Read", "Notes.ReadWrite"],
      lastSync: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      description: "Access emails, calendar, and contact management",
      icon: <MailRegular style={{ fontSize: "24px" }} />,
      color: "#0078D4",
      isConnected: false,
      isConnecting: false,
      permissions: ["Mail.Read", "Calendars.Read", "Contacts.Read"],
    },
    {
      id: "teams",
      name: "Microsoft Teams",
      description: "Access team chats, meetings, and shared files",
      icon: <PeopleRegular style={{ fontSize: "24px" }} />,
      color: "#6264A7",
      isConnected: false,
      isConnecting: false,
      permissions: ["Team.ReadBasic.All", "Chat.Read"],
    },
  ]);

  const handleAppToggle = async (appId: string) => {
    const app = apps.find((a) => a.id === appId);
    if (!app || app.isConnecting) return;

    // Set connecting state
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, isConnecting: true } : a))
    );

    try {
      // Simulate connection process
      await new Promise((resolve) =>
        setTimeout(resolve, 1500 + Math.random() * 1000)
      );

      const newConnectedState = !app.isConnected;

      setApps((prev) =>
        prev.map((a) =>
          a.id === appId
            ? {
                ...a,
                isConnected: newConnectedState,
                isConnecting: false,
                lastSync: newConnectedState ? new Date() : undefined,
              }
            : a
        )
      );

      dispatchToast(
        <Toast>
          <ToastTitle>
            {app.name} {newConnectedState ? "Connected" : "Disconnected"}{" "}
            Successfully
          </ToastTitle>
        </Toast>,
        { intent: newConnectedState ? "success" : "info" }
      );

      onAppToggle?.(appId, newConnectedState);
    } catch {
      setApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, isConnecting: false } : a))
      );

      dispatchToast(
        <Toast>
          <ToastTitle>
            Failed to {app.isConnected ? "disconnect" : "connect"} {app.name}
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };
  const formatLastSync = (date?: Date) => {
    if (!date) return "Never";
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

  const connectedApps = apps.filter((app) => app.isConnected).length;
  const highlightedAppsData = apps.filter((app) =>
    highlightedApps.includes(app.id)
  );

  if (!isOpen) return null;

  return (
    <>
      <Toaster />
      <div
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
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "500px",
          backgroundColor: "#FFFFFF",
          boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.15)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #E1DFDD",
            backgroundColor: "#F8F9FA",
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
            <Text size={600} weight="semibold">
              App Integrations
            </Text>
            <Button
              appearance="subtle"
              onClick={onClose}
              style={{ minWidth: "auto", padding: "8px" }}
            >
              ✕
            </Button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <Badge
              appearance="filled"
              color={connectedApps > 0 ? "success" : "subtle"}
              size="large"
            >
              {connectedApps} of {apps.length} Connected
            </Badge>
            <PlugConnectedRegular
              style={{ fontSize: "16px", color: "#107C10" }}
            />
          </div>

          {/* Required Apps Alert */}
          {highlightedApps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: "12px",
                backgroundColor: "#FFF4E6",
                border: "1px solid #F7630C",
                borderRadius: "6px",
                marginTop: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <WarningRegular
                  style={{ fontSize: "16px", color: "#F7630C" }}
                />
                <Text size={300} weight="semibold" style={{ color: "#F7630C" }}>
                  Apps Required for AI Command
                </Text>
              </div>
              <Text size={200} style={{ color: "#605E5C" }}>
                Connect these apps to execute your AI command:
              </Text>
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  marginTop: "8px",
                  flexWrap: "wrap",
                }}
              >
                {highlightedAppsData.map((app) => (
                  <Badge key={app.id} color="warning" size="small">
                    {app.name.replace("Microsoft ", "")}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* App List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
          }}
        >
          <AnimatePresence>
            {apps.map((app) => {
              const isHighlighted = highlightedApps.includes(app.id);
              return (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{ marginBottom: "16px" }}
                >
                  <Card
                    style={{
                      border: `2px solid ${
                        isHighlighted && !app.isConnected
                          ? "#F7630C"
                          : app.isConnected
                          ? app.color
                          : "#E1DFDD"
                      }`,
                      backgroundColor:
                        isHighlighted && !app.isConnected
                          ? "#FFF4E6"
                          : app.isConnected
                          ? `${app.color}08`
                          : "#FFFFFF",
                      boxShadow:
                        isHighlighted && !app.isConnected
                          ? "0 0 20px rgba(247, 99, 12, 0.3)"
                          : "none",
                      animation:
                        isHighlighted && !app.isConnected
                          ? "pulse 2s infinite"
                          : "none",
                    }}
                  >
                    <CardHeader
                      header={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div style={{ color: app.color }}>{app.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <Text size={400} weight="semibold">
                                {app.name}
                              </Text>
                              {isHighlighted && !app.isConnected && (
                                <Badge color="warning" size="small">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <Text
                              size={200}
                              style={{ color: "#605E5C", display: "block" }}
                            >
                              {app.description}
                            </Text>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {app.isConnecting ? (
                              <Spinner size="tiny" />
                            ) : app.isConnected ? (
                              <CheckmarkCircleRegular
                                style={{ color: "#107C10", fontSize: "16px" }}
                              />
                            ) : (
                              <PlugDisconnectedRegular
                                style={{ color: "#605E5C", fontSize: "16px" }}
                              />
                            )}
                            <Switch
                              checked={app.isConnected}
                              onChange={() => handleAppToggle(app.id)}
                              disabled={app.isConnecting}
                            />
                          </div>
                        </div>
                      }
                    />

                    {app.isConnected && (
                      <div style={{ padding: "0 16px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                          }}
                        >
                          <Text size={200} style={{ color: "#605E5C" }}>
                            Last sync: {formatLastSync(app.lastSync)}
                          </Text>
                          <Badge
                            appearance="outline"
                            size="small"
                            color="success"
                          >
                            Active
                          </Badge>
                        </div>

                        <div style={{ marginTop: "8px" }}>
                          <Text
                            size={200}
                            style={{
                              color: "#605E5C",
                              display: "block",
                              marginBottom: "4px",
                            }}
                          >
                            Permissions:
                          </Text>
                          <div
                            style={{
                              display: "flex",
                              gap: "4px",
                              flexWrap: "wrap",
                            }}
                          >
                            {app.permissions.map((permission) => (
                              <Badge
                                key={permission}
                                appearance="outline"
                                size="small"
                              >
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E1DFDD",
            backgroundColor: "#F8F9FA",
          }}
        >
          <Text
            size={200}
            style={{ color: "#605E5C", textAlign: "center", display: "block" }}
          >
            Connected apps will sync automatically and appear in your dashboard
          </Text>
        </div>
      </motion.div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </>
  );
};
