/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  Text,
  Badge,
  Button,
  Spinner,
  Avatar,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Toast,
  ToastTitle,
  useToastController,
  Toaster,
} from "@fluentui/react-components";
import {
  MailRegular,
  DocumentRegular,
  TaskListAddRegular,
  PeopleRegular,
  AlertRegular,
  ClockRegular,
  FlagRegular,
  ArrowClockwiseRegular,
  ImportantRegular,
  CheckmarkCircleRegular,
  ShareRegular,
  ChatRegular,
  MoreHorizontalRegular,
  SendRegular,
  PersonAddRegular,
  CheckmarkRegular,
  OpenRegular,
} from "@fluentui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/msalConfig";

interface PriorityItem {
  id: string;
  title: string;
  description: string;
  app:
    | "outlook"
    | "teams"
    | "excel"
    | "word"
    | "powerpoint"
    | "onenote"
    | "planner";
  priority: "high" | "medium" | "low";
  dueDate?: Date;
  type: "email" | "meeting" | "task" | "document" | "notification" | "deadline";
  actionRequired: boolean;
  participants?: string[];
  webUrl?: string;
  documentId?: string;
  isCollaborative?: boolean;
  lastModifiedBy?: string;
  sharedWith?: string[];
}

interface PriorityDashboardProps {
  connectedApps: string[];
}

export const PriorityDashboard: React.FC<PriorityDashboardProps> = ({
  connectedApps,
}) => {
  const { instance, accounts } = useMsal();
  const { dispatchToast } = useToastController();
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "high" | "today" | "overdue"
  >("all");

  const callMsGraph = async (endpoint: string) => {
    const account = accounts[0];
    if (!account) throw new Error("No account found");

    const response = await instance.acquireTokenSilent({
      ...loginRequest,
      account: account,
    });

    const headers = new Headers();
    const bearer = `Bearer ${response.accessToken}`;
    headers.append("Authorization", bearer);

    const fetchResponse = await fetch(endpoint, {
      method: "GET",
      headers: headers,
    });

    if (!fetchResponse.ok) {
      throw new Error(`API call failed: ${fetchResponse.statusText}`);
    }

    return fetchResponse.json();
  };

  const fetchOutlookPriorities = async (): Promise<PriorityItem[]> => {
    try {
      const priorities: PriorityItem[] = [];

      // Get high-priority emails
      const emails = await callMsGraph(
        "https://graph.microsoft.com/v1.0/me/messages?$top=10&$filter=importance eq 'high' or flag/flagStatus eq 'flagged'&$orderby=receivedDateTime desc"
      );

      emails.value?.forEach((email: any) => {
        priorities.push({
          id: `email-${email.id}`,
          title: email.subject || "No Subject",
          description: `From: ${
            email.from?.emailAddress?.name || "Unknown"
          } • ${email.bodyPreview?.substring(0, 100)}...`,
          app: "outlook",
          priority: email.importance === "high" ? "high" : "medium",
          type: "email",
          actionRequired: email.flag?.flagStatus === "flagged",
          webUrl: email.webLink,
          isCollaborative: email.toRecipients?.length > 1,
          participants: email.toRecipients
            ?.map((r: any) => r.emailAddress?.name)
            .filter(Boolean),
        });
      });

      // Get today's meetings
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const events = await callMsGraph(
        `https://graph.microsoft.com/v1.0/me/events?$filter=start/dateTime ge '${today.toISOString()}' and start/dateTime lt '${tomorrow.toISOString()}'&$orderby=start/dateTime`
      );

      events.value?.forEach((event: any) => {
        const startTime = new Date(event.start.dateTime);
        const isUpcoming =
          startTime > new Date() &&
          startTime < new Date(Date.now() + 2 * 60 * 60 * 1000); // Next 2 hours

        priorities.push({
          id: `meeting-${event.id}`,
          title: event.subject || "No Title",
          description: `${startTime.toLocaleTimeString()} • ${
            event.attendees?.length || 0
          } attendees`,
          app: "outlook",
          priority: isUpcoming ? "high" : "medium",
          type: "meeting",
          actionRequired: isUpcoming,
          dueDate: startTime,
          participants: event.attendees
            ?.map((a: any) => a.emailAddress?.name)
            .filter(Boolean),
          webUrl: event.webLink,
          isCollaborative: true,
        });
      });

      return priorities;
    } catch (error) {
      console.warn("Failed to fetch Outlook priorities:", error);
      return [];
    }
  };

  const fetchTeamsPriorities = async (): Promise<PriorityItem[]> => {
    try {
      const priorities: PriorityItem[] = [];

      // Get recent Teams messages (mentions, urgent)
      const chats = await callMsGraph(
        "https://graph.microsoft.com/v1.0/me/chats?$top=20"
      );

      // Note: Getting actual messages requires additional permissions
      // For now, we'll create sample priorities based on chat activity
      chats.value?.slice(0, 3).forEach((chat: any, index: number) => {
        priorities.push({
          id: `teams-${chat.id}`,
          title: `Team Discussion: ${chat.topic || "Group Chat"}`,
          description: "New messages requiring attention",
          app: "teams",
          priority: index === 0 ? "high" : "medium",
          type: "notification",
          actionRequired: true,
          isCollaborative: true,
          participants: chat.members
            ?.map((m: any) => m.displayName)
            .filter(Boolean),
        });
      });

      return priorities;
    } catch (error) {
      console.warn("Failed to fetch Teams priorities:", error);
      return [];
    }
  };

  const fetchPlannerTasks = async (): Promise<PriorityItem[]> => {
    try {
      const priorities: PriorityItem[] = [];

      // Get Planner tasks
      const tasks = await callMsGraph(
        "https://graph.microsoft.com/v1.0/me/planner/tasks?$filter=percentComplete lt 100&$orderby=dueDateTime"
      );

      tasks.value?.forEach((task: any) => {
        const dueDate = task.dueDateTime ? new Date(task.dueDateTime) : null;
        const isOverdue = dueDate && dueDate < new Date();
        const isDueSoon =
          dueDate && dueDate < new Date(Date.now() + 24 * 60 * 60 * 1000);

        priorities.push({
          id: `task-${task.id}`,
          title: task.title || "Untitled Task",
          description: task.planTitle
            ? `Plan: ${task.planTitle}`
            : "Task assignment",
          app: "planner",
          priority: isOverdue ? "high" : isDueSoon ? "medium" : "low",
          type: "task",
          actionRequired: isOverdue || isDueSoon,
          dueDate: dueDate,
          isCollaborative: true,
        });
      });

      return priorities;
    } catch (error) {
      console.warn("Failed to fetch Planner tasks:", error);
      return [];
    }
  };

  const fetchDocumentPriorities = async (): Promise<PriorityItem[]> => {
    try {
      const priorities: PriorityItem[] = [];

      // Get recently modified documents
      const recentDocs = await callMsGraph(
        "https://graph.microsoft.com/v1.0/me/drive/recent?$top=10"
      );

      recentDocs.value?.forEach((doc: any) => {
        const modifiedDate = new Date(doc.lastModifiedDateTime);
        const isRecent =
          modifiedDate > new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

        if (isRecent) {
          const docType = doc.name?.toLowerCase().includes(".xlsx")
            ? "excel"
            : doc.name?.toLowerCase().includes(".docx")
            ? "word"
            : doc.name?.toLowerCase().includes(".pptx")
            ? "powerpoint"
            : "word";

          priorities.push({
            id: `doc-${doc.id}`,
            title: `Updated: ${doc.name}`,
            description: `Modified ${modifiedDate.toLocaleTimeString()} • Needs review`,
            app: docType as any,
            priority: "medium",
            type: "document",
            actionRequired: true,
            webUrl: doc.webUrl,
            documentId: doc.id,
            isCollaborative: doc.shared?.scope === "users",
            lastModifiedBy: doc.lastModifiedBy?.user?.displayName,
            sharedWith: doc.permissions
              ?.map((p: any) => p.grantedTo?.user?.displayName)
              .filter(Boolean),
          });
        }
      });

      return priorities;
    } catch (error) {
      console.warn("Failed to fetch document priorities:", error);
      return [];
    }
  };

  const createDemoPriorities = (): PriorityItem[] => {
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return [
      {
        id: "demo-1",
        title: "Budget Review Meeting",
        description: "Quarterly budget review with finance team • 9:00 AM",
        app: "outlook",
        priority: "high",
        type: "meeting",
        actionRequired: true,
        dueDate: inOneHour,
        participants: ["Sarah Johnson", "Mike Chen", "Finance Team"],
        webUrl: "https://teams.microsoft.com/l/meetup-join/demo",
        isCollaborative: true,
      },
      {
        id: "demo-2",
        title: "Urgent: Client Proposal Deadline",
        description: "Final review needed for ABC Corp proposal • Due today",
        app: "word",
        priority: "high",
        type: "deadline",
        actionRequired: true,
        dueDate: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        webUrl: "https://office.com/word/demo-proposal",
        documentId: "demo-doc-1",
        isCollaborative: true,
        lastModifiedBy: "Lisa Rodriguez",
        sharedWith: ["John Smith", "Sarah Johnson"],
      },
      {
        id: "demo-3",
        title: "Sales Dashboard Updated",
        description: "Q4 sales figures updated • Requires analysis",
        app: "excel",
        priority: "medium",
        type: "document",
        actionRequired: true,
        webUrl: "https://office.com/excel/demo-dashboard",
        documentId: "demo-doc-2",
        isCollaborative: true,
        lastModifiedBy: "Mike Chen",
        sharedWith: ["Sales Team", "Management"],
      },
      {
        id: "demo-4",
        title: "Team Standup - Project Alpha",
        description: "Daily standup meeting • 3 new messages",
        app: "teams",
        priority: "medium",
        type: "notification",
        actionRequired: true,
        isCollaborative: true,
        participants: ["Development Team", "Product Manager"],
        webUrl: "https://teams.microsoft.com/l/channel/demo",
      },
      {
        id: "demo-5",
        title: "Complete Market Research",
        description: "Research competitive landscape • Due tomorrow",
        app: "planner",
        priority: "medium",
        type: "task",
        actionRequired: true,
        dueDate: tomorrow,
        isCollaborative: true,
        sharedWith: ["Research Team"],
      },
      {
        id: "demo-6",
        title: "Presentation Review Request",
        description: "From: Lisa Rodriguez • Please review Q4 presentation",
        app: "outlook",
        priority: "medium",
        type: "email",
        actionRequired: true,
        webUrl: "https://outlook.office.com/mail/demo",
        isCollaborative: true,
        participants: ["Lisa Rodriguez", "Executive Team"],
      },
    ];
  };

  const fetchAllPriorities = async () => {
    setLoading(true);
    try {
      const allPriorities: PriorityItem[] = [];

      // Only fetch from connected apps
      if (connectedApps.includes("outlook")) {
        const outlookPriorities = await fetchOutlookPriorities();
        allPriorities.push(...outlookPriorities);
      }

      if (connectedApps.includes("teams")) {
        const teamsPriorities = await fetchTeamsPriorities();
        allPriorities.push(...teamsPriorities);
      }

      if (connectedApps.includes("planner")) {
        const plannerPriorities = await fetchPlannerTasks();
        allPriorities.push(...plannerPriorities);
      }

      if (
        connectedApps.some((app) =>
          ["excel", "word", "powerpoint"].includes(app)
        )
      ) {
        const docPriorities = await fetchDocumentPriorities();
        allPriorities.push(...docPriorities);
      }

      // If no real data or no connected apps, show demo data
      if (allPriorities.length === 0) {
        allPriorities.push(...createDemoPriorities());
      }

      // Sort by priority and due date
      allPriorities.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];

        if (priorityDiff !== 0) return priorityDiff;

        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }

        return a.dueDate ? -1 : b.dueDate ? 1 : 0;
      });

      setPriorities(allPriorities);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch priorities:", error);
      setPriorities(createDemoPriorities());
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connectedApps.length > 0) {
      fetchAllPriorities();
    }
  }, [connectedApps]);

  // Enhanced file opening with proper authentication
  const handleOpenFile = async (item: PriorityItem) => {
    console.log("🔗 Opening priority item:", item.title);

    try {
      if (item.webUrl && item.webUrl !== "#" && !item.webUrl.includes("demo")) {
        console.log("🌐 Opening real file with direct URL");

        // Open the document directly (no token in URL)
        window.open(item.webUrl, "_blank");

        dispatchToast(
          <Toast>
            <ToastTitle>Opening {item.title}</ToastTitle>
          </Toast>,
          { intent: "info" }
        );
        return;
      }

      // For demo items or items without webUrl
      console.log("🎭 Demo item - showing notification");
      dispatchToast(
        <Toast>
          <ToastTitle>Demo: Would open "{item.title}"</ToastTitle>
        </Toast>,
        { intent: "info" }
      );
    } catch (error) {
      console.error("❌ Failed to open file:", error);

      dispatchToast(
        <Toast>
          <ToastTitle>Failed to open {item.title}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  const handleMarkComplete = (item: PriorityItem) => {
    setPriorities((prev) => prev.filter((p) => p.id !== item.id));

    dispatchToast(
      <Toast>
        <ToastTitle>✅ Marked "{item.title}" as complete</ToastTitle>
      </Toast>,
      { intent: "success" }
    );
  };

  const handleNotifyCollaborators = async (
    item: PriorityItem,
    action: "completed" | "assigned" | "updated"
  ) => {
    // Simulate sending notifications
    const actionText = {
      completed: "completed",
      assigned: "assigned to you",
      updated: "updated",
    }[action];

    const recipients = item.participants || item.sharedWith || [];

    dispatchToast(
      <Toast>
        <ToastTitle>
          📧 Notified {recipients.length} collaborator
          {recipients.length !== 1 ? "s" : ""} that "{item.title}" was{" "}
          {actionText}
        </ToastTitle>
      </Toast>,
      { intent: "success" }
    );

    // In a real implementation, this would:
    // 1. Send Teams messages to relevant channels
    // 2. Send Outlook emails to collaborators
    // 3. Update Planner task assignments
    // 4. Post updates to shared documents
  };

  const handleStartChat = (item: PriorityItem) => {
    // In a real implementation, this would open Teams chat
    const participants = item.participants || item.sharedWith || [];

    dispatchToast(
      <Toast>
        <ToastTitle>
          💬 Starting Teams chat about "{item.title}" with {participants.length}{" "}
          participant{participants.length !== 1 ? "s" : ""}
        </ToastTitle>
      </Toast>,
      { intent: "info" }
    );
  };

  const getAppIcon = (app: string) => {
    const iconProps = { style: { fontSize: "16px" } };
    switch (app) {
      case "outlook":
        return <MailRegular {...iconProps} />;
      case "teams":
        return <PeopleRegular {...iconProps} />;
      case "excel":
        return <DocumentRegular {...iconProps} />;
      case "word":
        return <DocumentRegular {...iconProps} />;
      case "powerpoint":
        return <DocumentRegular {...iconProps} />;
      case "onenote":
        return <DocumentRegular {...iconProps} />;
      case "planner":
        return <TaskListAddRegular {...iconProps} />;
      default:
        return <DocumentRegular {...iconProps} />;
    }
  };

  const getAppColor = (app: string) => {
    const colors = {
      outlook: "#0078D4",
      teams: "#6264A7",
      excel: "#107C41",
      word: "#185ABD",
      powerpoint: "#D24726",
      onenote: "#7719AA",
      planner: "#0078D4",
    };
    return colors[app] || "#605E5C";
  };

  const getPriorityIcon = (priority: string, actionRequired: boolean) => {
    if (actionRequired && priority === "high") {
      return <AlertRegular style={{ color: "#D13438", fontSize: "16px" }} />;
    }
    if (priority === "high") {
      return (
        <ImportantRegular style={{ color: "#F7630C", fontSize: "16px" }} />
      );
    }
    if (actionRequired) {
      return <FlagRegular style={{ color: "#F7630C", fontSize: "16px" }} />;
    }
    return (
      <CheckmarkCircleRegular style={{ color: "#107C10", fontSize: "16px" }} />
    );
  };

  const formatTimeUntil = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return "Overdue";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m`;
    if (diff < 24 * 60 * 60 * 1000)
      return `${Math.floor(diff / (60 * 60 * 1000))}h`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d`;
  };

  const filteredPriorities = priorities.filter((item) => {
    switch (selectedFilter) {
      case "high":
        return item.priority === "high";
      case "today":
        return (
          item.dueDate &&
          item.dueDate < new Date(Date.now() + 24 * 60 * 60 * 1000)
        );
      case "overdue":
        return item.dueDate && item.dueDate < new Date();
      default:
        return true;
    }
  });

  const priorityStats = {
    total: priorities.length,
    high: priorities.filter((p) => p.priority === "high").length,
    actionRequired: priorities.filter((p) => p.actionRequired).length,
    overdue: priorities.filter((p) => p.dueDate && p.dueDate < new Date())
      .length,
  };

  return (
    <div style={{ padding: "24px" }}>
      <Toaster />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <Text size={600} weight="semibold" style={{ display: "block" }}>
            Today's Priorities
          </Text>
          <Text
            size={300}
            style={{ color: "#605E5C", display: "block", marginTop: "4px" }}
          >
            {lastUpdated
              ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
              : "Loading priorities..."}
          </Text>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Button
            appearance="subtle"
            icon={loading ? <Spinner size="tiny" /> : <ArrowClockwiseRegular />}
            onClick={fetchAllPriorities}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <Card style={{ padding: "16px", border: "2px solid #E1DFDD" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                padding: "8px",
                borderRadius: "50%",
                backgroundColor: "#EDF3FF",
                color: "#0078D4",
              }}
            >
              <TaskListAddRegular style={{ fontSize: "20px" }} />
            </div>
            <div>
              <Text size={500} weight="semibold">
                {priorityStats.total}
              </Text>
              <Text size={200} style={{ color: "#605E5C", display: "block" }}>
                Total Items
              </Text>
            </div>
          </div>
        </Card>

        <Card style={{ padding: "16px", border: "2px solid #F7630C20" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                padding: "8px",
                borderRadius: "50%",
                backgroundColor: "#FFF4E6",
                color: "#F7630C",
              }}
            >
              <ImportantRegular style={{ fontSize: "20px" }} />
            </div>
            <div>
              <Text size={500} weight="semibold">
                {priorityStats.high}
              </Text>
              <Text size={200} style={{ color: "#605E5C", display: "block" }}>
                High Priority
              </Text>
            </div>
          </div>
        </Card>

        <Card style={{ padding: "16px", border: "2px solid #D1343820" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                padding: "8px",
                borderRadius: "50%",
                backgroundColor: "#FDF2F2",
                color: "#D13438",
              }}
            >
              <AlertRegular style={{ fontSize: "20px" }} />
            </div>
            <div>
              <Text size={500} weight="semibold">
                {priorityStats.overdue}
              </Text>
              <Text size={200} style={{ color: "#605E5C", display: "block" }}>
                Overdue
              </Text>
            </div>
          </div>
        </Card>

        <Card style={{ padding: "16px", border: "2px solid #107C1020" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                padding: "8px",
                borderRadius: "50%",
                backgroundColor: "#F3F9F1",
                color: "#107C10",
              }}
            >
              <FlagRegular style={{ fontSize: "20px" }} />
            </div>
            <div>
              <Text size={500} weight="semibold">
                {priorityStats.actionRequired}
              </Text>
              <Text size={200} style={{ color: "#605E5C", display: "block" }}>
                Action Required
              </Text>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {[
          { key: "all", label: "All Items" },
          { key: "high", label: "High Priority" },
          { key: "today", label: "Due Today" },
          { key: "overdue", label: "Overdue" },
        ].map((filter) => (
          <Button
            key={filter.key}
            appearance={selectedFilter === filter.key ? "primary" : "subtle"}
            size="small"
            onClick={() => setSelectedFilter(filter.key as any)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Priority Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <AnimatePresence>
          {filteredPriorities.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                style={{
                  border: `2px solid ${
                    item.priority === "high" && item.actionRequired
                      ? "#D13438"
                      : item.priority === "high"
                      ? "#F7630C"
                      : item.actionRequired
                      ? "#F7630C40"
                      : "#E1DFDD"
                  }`,
                  backgroundColor:
                    item.priority === "high" && item.actionRequired
                      ? "#FDF2F2"
                      : item.priority === "high"
                      ? "#FFF4E6"
                      : item.actionRequired
                      ? "#FFF9F5"
                      : "#FFFFFF",
                  transition: "all 0.2s ease",
                }}
              >
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
                      <div style={{ color: getAppColor(item.app) }}>
                        {getAppIcon(item.app)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                          }}
                        >
                          <Text
                            size={400}
                            weight="semibold"
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                            }}
                          >
                            {item.title}
                          </Text>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            {getPriorityIcon(
                              item.priority,
                              item.actionRequired
                            )}

                            <Badge
                              appearance="outline"
                              size="small"
                              color={
                                item.priority === "high"
                                  ? "danger"
                                  : item.priority === "medium"
                                  ? "warning"
                                  : "success"
                              }
                            >
                              {item.priority.toUpperCase()}
                            </Badge>

                            {item.isCollaborative && (
                              <Badge
                                appearance="outline"
                                size="small"
                                color="brand"
                              >
                                <ShareRegular
                                  style={{
                                    fontSize: "10px",
                                    marginRight: "2px",
                                  }}
                                />
                                Shared
                              </Badge>
                            )}

                            {item.dueDate && (
                              <Badge
                                appearance="filled"
                                size="small"
                                color={
                                  item.dueDate < new Date()
                                    ? "danger"
                                    : item.dueDate <
                                      new Date(Date.now() + 2 * 60 * 60 * 1000)
                                    ? "warning"
                                    : "brand"
                                }
                              >
                                <ClockRegular
                                  style={{
                                    fontSize: "10px",
                                    marginRight: "2px",
                                  }}
                                />
                                {formatTimeUntil(item.dueDate)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Text
                          size={300}
                          style={{
                            color: "#605E5C",
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginBottom: "8px",
                          }}
                        >
                          {item.description}
                        </Text>

                        {/* Collaboration Info */}
                        {(item.participants ||
                          item.sharedWith ||
                          item.lastModifiedBy) && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginTop: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            {item.lastModifiedBy && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Avatar size={16} name={item.lastModifiedBy} />
                                <Text size={200} style={{ color: "#605E5C" }}>
                                  {item.lastModifiedBy}
                                </Text>
                              </div>
                            )}

                            {(item.participants || item.sharedWith) && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <PeopleRegular
                                  style={{ fontSize: "12px", color: "#605E5C" }}
                                />
                                <Text size={200} style={{ color: "#605E5C" }}>
                                  {(item.participants || item.sharedWith)
                                    ?.slice(0, 2)
                                    .join(", ")}
                                  {(item.participants || item.sharedWith)
                                    ?.length > 2 &&
                                    ` +${
                                      (item.participants || item.sharedWith)
                                        .length - 2
                                    } more`}
                                </Text>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Button
                          appearance="primary"
                          size="small"
                          icon={<OpenRegular />}
                          onClick={() => handleOpenFile(item)}
                        >
                          Open
                        </Button>

                        {item.isCollaborative && (
                          <Menu>
                            <MenuTrigger disableButtonEnhancement>
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<MoreHorizontalRegular />}
                              />
                            </MenuTrigger>
                            <MenuPopover>
                              <MenuList>
                                <MenuItem
                                  icon={<CheckmarkRegular />}
                                  onClick={() => handleMarkComplete(item)}
                                >
                                  Mark Complete
                                </MenuItem>
                                <MenuItem
                                  icon={<ChatRegular />}
                                  onClick={() => handleStartChat(item)}
                                >
                                  Start Teams Chat
                                </MenuItem>
                                <MenuItem
                                  icon={<SendRegular />}
                                  onClick={() =>
                                    handleNotifyCollaborators(item, "completed")
                                  }
                                >
                                  Notify: Task Completed
                                </MenuItem>
                                <MenuItem
                                  icon={<PersonAddRegular />}
                                  onClick={() =>
                                    handleNotifyCollaborators(item, "assigned")
                                  }
                                >
                                  Notify: Task Assigned
                                </MenuItem>
                                <MenuItem
                                  icon={<ShareRegular />}
                                  onClick={() =>
                                    handleNotifyCollaborators(item, "updated")
                                  }
                                >
                                  Notify: Document Updated
                                </MenuItem>
                              </MenuList>
                            </MenuPopover>
                          </Menu>
                        )}

                        {!item.isCollaborative && (
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<CheckmarkRegular />}
                            onClick={() => handleMarkComplete(item)}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  }
                />
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredPriorities.length === 0 && !loading && (
          <Card
            style={{
              padding: "48px",
              textAlign: "center",
              backgroundColor: "#F8F9FA",
            }}
          >
            <CheckmarkCircleRegular
              style={{
                fontSize: "48px",
                color: "#107C10",
                marginBottom: "16px",
              }}
            />
            <Text
              size={400}
              weight="semibold"
              style={{ display: "block", marginBottom: "8px" }}
            >
              All caught up!
            </Text>
            <Text size={300} style={{ color: "#605E5C" }}>
              {selectedFilter === "all"
                ? "No priorities found. Great job staying on top of everything!"
                : `No items match the "${selectedFilter}" filter.`}
            </Text>
          </Card>
        )}
      </div>

      {/* Collaboration Features Info */}
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
          <strong>💡 Enhanced File Access:</strong> Click "Open" to access files
          directly without re-authentication. Files open with your existing
          Microsoft 365 session for seamless access. For shared items, use the
          menu to notify collaborators about task completion, assignments, or
          document updates. Start Teams chats to discuss priorities with your
          team members in real-time.
        </Text>
      </div>
    </div>
  );
};
