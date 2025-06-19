import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  Text,
  Switch,
  Badge,
  Divider,
  Toast,
  ToastTitle,
  useToastController,
  Toaster,
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
} from "@fluentui/react-components";
import {
  SettingsRegular,
  HistoryRegular,
  InfoRegular,
  QuestionCircleRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  PlugDisconnectedRegular,
  ArrowSyncRegular,
  DismissRegular,
  LightbulbRegular,
  TaskListAddRegular,
  PeopleRegular,
} from "@fluentui/react-icons";
import { motion, AnimatePresence } from "framer-motion";

interface AICommand {
  id: string;
  command: string;
  status: "processing" | "completed" | "error" | "blocked";
  result?: string;
  timestamp: Date;
  apps: string[];
  missingApps?: string[];
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  recentCommands: AICommand[];
  onClearHistory: () => void;
  onRequestConnection?: (appIds: string[]) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  recentCommands,
  onClearHistory,
  onRequestConnection,
}) => {
  const { dispatchToast } = useToastController();
  const [settings, setSettings] = useState({
    enableNotifications: true,
    autoSaveCommands: true,
    showAppHighlights: true,
    enableRealTimeSync: false,
  });

  const getAppDisplayName = (appId: string): string => {
    const appNames: { [key: string]: string } = {
      excel: "Excel",
      word: "Word",
      powerpoint: "PowerPoint",
      onenote: "OneNote",
      outlook: "Outlook",
      teams: "Teams",
    };
    return appNames[appId] || appId;
  };

  const getStatusIcon = (status: AICommand["status"]) => {
    switch (status) {
      case "processing":
        return <ArrowSyncRegular style={{ fontSize: "14px" }} />;
      case "completed":
        return <CheckmarkCircleRegular style={{ color: "#107C10" }} />;
      case "error":
        return <ErrorCircleRegular style={{ color: "#D13438" }} />;
      case "blocked":
        return <PlugDisconnectedRegular style={{ color: "#F7630C" }} />;
    }
  };

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    dispatchToast(
      <Toast>
        <ToastTitle>Setting Updated</ToastTitle>
      </Toast>,
      { intent: "success" }
    );
  };

  const handleClearHistory = () => {
    onClearHistory();
    dispatchToast(
      <Toast>
        <ToastTitle>Command History Cleared</ToastTitle>
      </Toast>,
      { intent: "info" }
    );
  };

  const formatTimestamp = (date: Date) => {
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
          width: "520px",
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
              Settings & Help
            </Text>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={onClose}
              style={{ minWidth: "auto", padding: "8px" }}
            />
          </div>

          <Text size={300} style={{ color: "#605E5C" }}>
            Manage preferences, view history, and get help
          </Text>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
          }}
        >
          {/* Settings Section */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <SettingsRegular style={{ fontSize: "20px", color: "#0078D4" }} />
              <Text size={500} weight="semibold">
                Preferences
              </Text>
            </div>

            <Card style={{ marginBottom: "16px" }}>
              <CardHeader
                header={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <div>
                      <Text size={400} weight="semibold">
                        Enable Notifications
                      </Text>
                      <Text
                        size={200}
                        style={{ color: "#605E5C", display: "block" }}
                      >
                        Get notified when commands complete
                      </Text>
                    </div>
                    <Switch
                      checked={settings.enableNotifications}
                      onChange={(e) =>
                        handleSettingChange(
                          "enableNotifications",
                          e.currentTarget.checked
                        )
                      }
                    />
                  </div>
                }
              />
            </Card>

            <Card style={{ marginBottom: "16px" }}>
              <CardHeader
                header={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <div>
                      <Text size={400} weight="semibold">
                        Auto-save Commands
                      </Text>
                      <Text
                        size={200}
                        style={{ color: "#605E5C", display: "block" }}
                      >
                        Automatically save command history
                      </Text>
                    </div>
                    <Switch
                      checked={settings.autoSaveCommands}
                      onChange={(e) =>
                        handleSettingChange(
                          "autoSaveCommands",
                          e.currentTarget.checked
                        )
                      }
                    />
                  </div>
                }
              />
            </Card>

            <Card style={{ marginBottom: "16px" }}>
              <CardHeader
                header={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <div>
                      <Text size={400} weight="semibold">
                        App Highlights
                      </Text>
                      <Text
                        size={200}
                        style={{ color: "#605E5C", display: "block" }}
                      >
                        Show visual highlights when apps communicate
                      </Text>
                    </div>
                    <Switch
                      checked={settings.showAppHighlights}
                      onChange={(e) =>
                        handleSettingChange(
                          "showAppHighlights",
                          e.currentTarget.checked
                        )
                      }
                    />
                  </div>
                }
              />
            </Card>

            <Card>
              <CardHeader
                header={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <div>
                      <Text size={400} weight="semibold">
                        Real-time Sync
                      </Text>
                      <Text
                        size={200}
                        style={{ color: "#605E5C", display: "block" }}
                      >
                        Enable live data synchronization
                      </Text>
                    </div>
                    <Switch
                      checked={settings.enableRealTimeSync}
                      onChange={(e) =>
                        handleSettingChange(
                          "enableRealTimeSync",
                          e.currentTarget.checked
                        )
                      }
                    />
                  </div>
                }
              />
            </Card>
          </div>

          <Divider />

          {/* Recent Commands Section */}
          <div style={{ marginTop: "32px", marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <HistoryRegular
                  style={{ fontSize: "20px", color: "#0078D4" }}
                />
                <Text size={500} weight="semibold">
                  Recent Commands
                </Text>
                <Badge appearance="outline" size="small">
                  {recentCommands.length}
                </Badge>
              </div>

              {recentCommands.length > 0 && (
                <Button
                  appearance="subtle"
                  size="small"
                  onClick={handleClearHistory}
                >
                  Clear All
                </Button>
              )}
            </div>

            {recentCommands.length === 0 ? (
              <Card style={{ textAlign: "center", padding: "32px" }}>
                <HistoryRegular
                  style={{
                    fontSize: "48px",
                    color: "#C8C6C4",
                    marginBottom: "16px",
                  }}
                />
                <Text size={400} style={{ color: "#605E5C" }}>
                  No recent commands
                </Text>
                <Text
                  size={300}
                  style={{
                    color: "#8A8886",
                    display: "block",
                    marginTop: "8px",
                  }}
                >
                  Your AI command history will appear here
                </Text>
              </Card>
            ) : (
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                <AnimatePresence>
                  {recentCommands.slice(0, 5).map((cmd) => (
                    <motion.div
                      key={cmd.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ marginBottom: "12px" }}
                    >
                      <Card
                        style={{
                          border:
                            cmd.status === "blocked"
                              ? "2px solid #F7630C"
                              : "1px solid #E1DFDD",
                          backgroundColor:
                            cmd.status === "blocked" ? "#FFF4E6" : "#FFFFFF",
                        }}
                      >
                        <CardHeader
                          header={
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "12px",
                              }}
                            >
                              {getStatusIcon(cmd.status)}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Text
                                  size={300}
                                  style={{
                                    display: "block",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    marginBottom: "4px",
                                  }}
                                >
                                  {cmd.command}
                                </Text>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                    marginBottom: "8px",
                                  }}
                                >
                                  {cmd.apps.map((app) => (
                                    <Badge
                                      key={app}
                                      size="small"
                                      color={
                                        cmd.status === "blocked"
                                          ? "warning"
                                          : cmd.status === "processing"
                                          ? "important"
                                          : "brand"
                                      }
                                    >
                                      {getAppDisplayName(app)}
                                    </Badge>
                                  ))}
                                  {cmd.missingApps &&
                                    cmd.missingApps.map((app) => (
                                      <Badge
                                        key={`missing-${app}`}
                                        size="small"
                                        color="danger"
                                      >
                                        <PlugDisconnectedRegular
                                          style={{
                                            fontSize: "10px",
                                            marginRight: "2px",
                                          }}
                                        />
                                        {getAppDisplayName(app)}
                                      </Badge>
                                    ))}
                                </div>
                                <Text size={200} style={{ color: "#8A8886" }}>
                                  {formatTimestamp(cmd.timestamp)}
                                </Text>
                              </div>
                            </div>
                          }
                          description={
                            cmd.result && (
                              <div style={{ marginTop: "8px" }}>
                                <Text
                                  size={200}
                                  style={{
                                    color:
                                      cmd.status === "error"
                                        ? "#D13438"
                                        : cmd.status === "blocked"
                                        ? "#F7630C"
                                        : "#107C10",
                                    display: "block",
                                    marginBottom: "8px",
                                  }}
                                >
                                  {cmd.result}
                                </Text>
                                {cmd.status === "blocked" &&
                                  cmd.missingApps && (
                                    <Button
                                      appearance="subtle"
                                      size="small"
                                      onClick={() =>
                                        onRequestConnection?.(cmd.missingApps!)
                                      }
                                      style={{ color: "#F7630C" }}
                                    >
                                      Connect Missing Apps
                                    </Button>
                                  )}
                              </div>
                            )
                          }
                        />
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <Divider />

          {/* Help & Support Section */}
          <div style={{ marginTop: "32px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <QuestionCircleRegular
                style={{ fontSize: "20px", color: "#0078D4" }}
              />
              <Text size={500} weight="semibold">
                Help & Support
              </Text>
            </div>

            <Accordion multiple collapsible>
              {/* Priority Dashboard Help */}
              <AccordionItem value="priority-dashboard">
                <AccordionHeader>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <TaskListAddRegular
                      style={{ fontSize: "16px", color: "#0078D4" }}
                    />
                    <Text size={400} weight="semibold">
                      Priority Dashboard
                    </Text>
                  </div>
                </AccordionHeader>
                <AccordionPanel>
                  <div style={{ padding: "16px 0" }}>
                    <Text
                      size={300}
                      weight="semibold"
                      style={{ display: "block", marginBottom: "12px" }}
                    >
                      How to use the Priority Dashboard:
                    </Text>

                    <div style={{ marginBottom: "16px" }}>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#0078D4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        📋 Smart Priority Detection
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • High-priority emails and flagged messages appear
                        automatically
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • Meetings starting within 2 hours are highlighted
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • Recently modified documents show up for review
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        • Overdue tasks from Planner and To-Do are prioritized
                      </Text>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#0078D4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        🎛️ Filtering Options
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • <strong>All Items:</strong> View complete priority
                        list
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • <strong>High Priority:</strong> Focus on urgent items
                        only
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • <strong>Due Today:</strong> Items with today's
                        deadline
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        • <strong>Overdue:</strong> Past-due items requiring
                        immediate attention
                      </Text>
                    </div>

                    <div>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#0078D4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        ⚡ Quick Actions
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • <strong>Open:</strong> Launch files directly in
                        Microsoft 365 web apps
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • <strong>Mark Complete:</strong> Remove finished items
                        from your list
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • <strong>Start Teams Chat:</strong> Begin discussions
                        about specific items
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        • <strong>Notify Collaborators:</strong> Send automatic
                        updates about task status
                      </Text>
                    </div>
                  </div>
                </AccordionPanel>
              </AccordionItem>

              {/* Collaboration Features Help */}
              <AccordionItem value="collaboration">
                <AccordionHeader>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <PeopleRegular
                      style={{ fontSize: "16px", color: "#0078D4" }}
                    />
                    <Text size={400} weight="semibold">
                      Collaboration Features
                    </Text>
                  </div>
                </AccordionHeader>
                <AccordionPanel>
                  <div style={{ padding: "16px 0" }}>
                    <Text
                      size={300}
                      weight="semibold"
                      style={{ display: "block", marginBottom: "12px" }}
                    >
                      How to collaborate effectively:
                    </Text>

                    <div style={{ marginBottom: "16px" }}>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#0078D4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        💬 Team Communication
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • Click the menu button (⋯) on shared priority items
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • Select "Start Teams Chat" to discuss with
                        collaborators
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        • Use notification options to update team members
                        automatically
                      </Text>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#0078D4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        📢 Smart Notifications
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • <strong>Task Completed:</strong> Notify team when you
                        finish work
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • <strong>Task Assigned:</strong> Inform someone they're
                        now responsible
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • <strong>Document Updated:</strong> Alert collaborators
                        about changes
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        • <strong>Meeting Reminders:</strong> Automatic
                        notifications for upcoming meetings
                      </Text>
                    </div>

                    <div>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#0078D4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        👥 Team Tracking
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • See collaborator avatars and names on shared items
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • "Last Modified By" shows who made recent changes
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        • Participant lists show everyone involved in meetings
                        and projects
                      </Text>
                    </div>
                  </div>
                </AccordionPanel>
              </AccordionItem>

              {/* AI Commands Help */}
              <AccordionItem value="ai-commands">
                <AccordionHeader>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <LightbulbRegular
                      style={{ fontSize: "16px", color: "#0078D4" }}
                    />
                    <Text size={400} weight="semibold">
                      AI Commands
                    </Text>
                  </div>
                </AccordionHeader>
                <AccordionPanel>
                  <div style={{ padding: "16px 0" }}>
                    <Text
                      size={300}
                      weight="semibold"
                      style={{ display: "block", marginBottom: "12px" }}
                    >
                      How to use AI commands effectively:
                    </Text>

                    <div style={{ marginBottom: "16px" }}>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#0078D4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        📝 Example Commands
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • "Extract budget data from Excel and create a Word
                        summary"
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • "Take sales figures from Q4 analysis and create
                        PowerPoint slides"
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • "Schedule a Teams meeting with project stakeholders"
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        • "Email the team about completed tasks and next steps"
                      </Text>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#0078D4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        🔗 App Dependencies
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • Commands automatically detect which apps are needed
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • You'll be prompted to connect missing apps before
                        execution
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        • Connected apps will light up during command processing
                      </Text>
                    </div>

                    <div>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#0078D4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        ✅ Best Practices
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • Be specific about which files or data you want to use
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • Mention the output format you want (Word doc,
                        PowerPoint, etc.)
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        • Include any specific requirements or formatting
                        preferences
                      </Text>
                    </div>
                  </div>
                </AccordionPanel>
              </AccordionItem>

              {/* App Connections Help */}
              <AccordionItem value="app-connections">
                <AccordionHeader>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <PlugDisconnectedRegular
                      style={{ fontSize: "16px", color: "#0078D4" }}
                    />
                    <Text size={400} weight="semibold">
                      App Connections
                    </Text>
                  </div>
                </AccordionHeader>
                <AccordionPanel>
                  <div style={{ padding: "16px 0" }}>
                    <Text
                      size={300}
                      weight="semibold"
                      style={{ display: "block", marginBottom: "12px" }}
                    >
                      Managing your Microsoft 365 app connections:
                    </Text>

                    <div style={{ marginBottom: "16px" }}>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#0078D4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        🔗 Connecting Apps
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • Click "App Connections" in the header to open the
                        sidebar
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • Toggle the switch next to each app to
                        connect/disconnect
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        • Connected apps will show live data and recent activity
                      </Text>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#0078D4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        📊 What You Get
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • <strong>Live Previews:</strong> See recent documents
                        and activity
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • <strong>Priority Integration:</strong> Items from
                        connected apps appear in priorities
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • <strong>AI Commands:</strong> Use connected apps in
                        cross-application workflows
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        • <strong>Real-time Sync:</strong> Automatic updates
                        when data changes
                      </Text>
                    </div>

                    <div>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#0078D4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        🔒 Permissions
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • Samara only requests the minimum permissions needed
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        • You can revoke permissions at any time in your
                        Microsoft account
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        • All data remains in your Microsoft 365 environment
                      </Text>
                    </div>
                  </div>
                </AccordionPanel>
              </AccordionItem>

              {/* Troubleshooting Help */}
              <AccordionItem value="troubleshooting">
                <AccordionHeader>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <InfoRegular
                      style={{ fontSize: "16px", color: "#0078D4" }}
                    />
                    <Text size={400} weight="semibold">
                      Troubleshooting
                    </Text>
                  </div>
                </AccordionHeader>
                <AccordionPanel>
                  <div style={{ padding: "16px 0" }}>
                    <Text
                      size={300}
                      weight="semibold"
                      style={{ display: "block", marginBottom: "12px" }}
                    >
                      Common issues and solutions:
                    </Text>

                    <div style={{ marginBottom: "16px" }}>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#D13438",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        ❌ "No documents found" in Live Mode
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        <strong>Cause:</strong> No Office documents in OneDrive
                        or insufficient permissions
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        <strong>Solution:</strong> Create some Office files or
                        check app permissions in Azure AD
                      </Text>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#D13438",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        ❌ Priority Dashboard shows demo data
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        <strong>Cause:</strong> Missing Microsoft Graph API
                        permissions or SharePoint Online license
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        <strong>Solution:</strong> Add required permissions and
                        ensure Microsoft 365 Business Standard subscription
                      </Text>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#D13438",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        ❌ Authentication Errors
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        <strong>Cause:</strong> Incorrect Azure AD configuration
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        <strong>Solution:</strong> Verify client ID and redirect
                        URIs in Azure portal
                      </Text>
                    </div>

                    <div>
                      <Text
                        size={300}
                        weight="semibold"
                        style={{
                          color: "#D13438",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        ❌ Collaboration features not working
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      >
                        <strong>Cause:</strong> Missing permissions for Teams,
                        Mail, or Calendar APIs
                      </Text>
                      <Text
                        size={200}
                        style={{
                          color: "#605E5C",
                          lineHeight: "1.4",
                          display: "block",
                        }}
                      >
                        <strong>Solution:</strong> Add required delegated
                        permissions in Azure AD app registration
                      </Text>
                    </div>
                  </div>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </motion.div>
    </>
  );
};
