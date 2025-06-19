import React, { useState, useEffect } from "react";
import { Text, Button } from "@fluentui/react-components";
import { GridRegular } from "@fluentui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { AppWidget } from "./AppWidget";

interface AppData {
  id: string;
  name: string;
  type: "excel" | "word" | "powerpoint" | "onenote" | "outlook" | "teams";
  color: string;
  isConnected: boolean;
  lastActivity?: string;
  summary?: {
    totalFiles: number;
    recentActivity: string;
    quickStats?: string;
  };
}

interface AppDashboardProps {
  onCommandExecute?: (command: string, apps: string[]) => void;
  highlightedApps?: string[];
  connectedApps?: string[];
  onAppConnection?: (appId: string, connected: boolean) => void;
}

export const AppDashboard: React.FC<AppDashboardProps> = ({
  highlightedApps = [],
  connectedApps = [],
  onAppConnection,
}) => {
  const [minimizedApps, setMinimizedApps] = useState<Set<string>>(
    new Set(["excel", "word", "onenote"])
  );
  const [apps, setApps] = useState<AppData[]>([
    {
      id: "excel",
      name: "Excel",
      type: "excel",
      color: "#107C41",
      isConnected: true,
      lastActivity: "Updated 2 hours ago",
      summary: {
        totalFiles: 12,
        recentActivity: "Q4 Budget analysis completed",
        quickStats: "3 active sheets",
      },
    },
    {
      id: "word",
      name: "Word",
      type: "word",
      color: "#185ABD",
      isConnected: true,
      lastActivity: "Updated 1 hour ago",
      summary: {
        totalFiles: 8,
        recentActivity: "Project report finalized",
        quickStats: "2 docs in review",
      },
    },
    {
      id: "onenote",
      name: "OneNote",
      type: "onenote",
      color: "#7719AA",
      isConnected: true,
      lastActivity: "Updated 30 min ago",
      summary: {
        totalFiles: 5,
        recentActivity: "Meeting notes added",
        quickStats: "15 new notes",
      },
    },
    {
      id: "powerpoint",
      name: "PowerPoint",
      type: "powerpoint",
      color: "#D24726",
      isConnected: false,
    },
    {
      id: "outlook",
      name: "Outlook",
      type: "outlook",
      color: "#0078D4",
      isConnected: false,
    },
    {
      id: "teams",
      name: "Teams",
      type: "teams",
      color: "#6264A7",
      isConnected: false,
    },
  ]);

  // Sync apps with parent component's connected apps state
  useEffect(() => {
    setApps((prev) =>
      prev.map((app) => ({
        ...app,
        isConnected: connectedApps.includes(app.id),
      }))
    );
  }, [connectedApps]);

  const handleToggleSize = (appId: string) => {
    setMinimizedApps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const handleOpenInTab = (appId: string) => {
    const app = apps.find((a) => a.id === appId);
    if (app) {
      const urls = {
        excel: "https://office.live.com/start/Excel.aspx",
        word: "https://office.live.com/start/Word.aspx",
        powerpoint: "https://office.live.com/start/PowerPoint.aspx",
        onenote: "https://www.onenote.com/notebooks",
        outlook: "https://outlook.live.com",
        teams: "https://teams.microsoft.com",
      };
      window.open(urls[app.type], "_blank");
    }
  };

  const handleAppConnect = (appId: string) => {
    const newConnectedState = !apps.find((a) => a.id === appId)?.isConnected;

    setApps((prev) =>
      prev.map((app) =>
        app.id === appId
          ? {
              ...app,
              isConnected: newConnectedState,
              lastActivity: newConnectedState ? "Just connected" : undefined,
              summary: newConnectedState
                ? {
                    totalFiles: Math.floor(Math.random() * 20) + 1,
                    recentActivity: "Syncing data...",
                    quickStats: "Setting up...",
                  }
                : undefined,
            }
          : app
      )
    );

    // Notify parent component
    onAppConnection?.(appId, newConnectedState);
  };

  const connectedAppsData = apps.filter((app) => app.isConnected);
  const disconnectedApps = apps.filter((app) => !app.isConnected);

  // Calculate grid layout based on expanded widgets
  const getConnectedAppsGridLayout = () => {
    const expandedApps = connectedAppsData.filter(
      (app) => !minimizedApps.has(app.id)
    );

    // If we have expanded apps, use fewer columns to prevent overlap
    if (expandedApps.length > 0) {
      if (expandedApps.length === 1) {
        return "repeat(auto-fit, minmax(420px, 1fr))"; // Single expanded app gets more space
      } else if (expandedApps.length === 2) {
        return "repeat(2, 1fr)"; // Two expanded apps side by side
      } else {
        return "repeat(auto-fit, minmax(380px, 1fr))"; // Multiple expanded apps with minimum width
      }
    }

    // All minimized - use compact grid
    return "repeat(auto-fit, minmax(280px, 1fr))";
  };

  const getDisconnectedAppsGridLayout = () => {
    return "repeat(auto-fit, minmax(220px, 1fr))";
  };

  // Check if all connected apps are minimized
  const allConnectedAppsMinimized = connectedAppsData.every((app) =>
    minimizedApps.has(app.id)
  );

  const handleToggleAllApps = () => {
    const connectedAppIds = connectedAppsData.map((app) => app.id);

    if (allConnectedAppsMinimized) {
      // Expand all - remove all connected apps from minimized set
      setMinimizedApps((prev) => {
        const newSet = new Set(prev);
        connectedAppIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      // Minimize all - add all connected apps to minimized set
      setMinimizedApps((prev) => {
        const newSet = new Set(prev);
        connectedAppIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <Text size={600} weight="semibold" style={{ display: "block" }}>
            Your Microsoft 365 Apps
          </Text>
          <Text
            size={300}
            style={{ color: "#605E5C", display: "block", marginTop: "4px" }}
          >
            {connectedAppsData.length} apps connected • Live data and previews
            {highlightedApps.length > 0 && (
              <span style={{ color: "#D24726", marginLeft: "8px" }}>
                • {highlightedApps.length} apps active
              </span>
            )}
          </Text>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {connectedAppsData.length > 0 && (
            <Button
              appearance="subtle"
              icon={<GridRegular />}
              onClick={handleToggleAllApps}
            >
              {allConnectedAppsMinimized ? "Expand All" : "Minimize All"}
            </Button>
          )}
        </div>
      </div>

      {connectedAppsData.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <Text
            size={400}
            weight="semibold"
            style={{ marginBottom: "16px", display: "block" }}
          >
            Connected Apps
          </Text>

          <motion.div
            layout
            style={{
              display: "grid",
              gridTemplateColumns: getConnectedAppsGridLayout(),
              gap: "24px",
              justifyItems: "stretch", // Changed from 'center' to 'stretch'
              alignItems: "start", // Align to top to prevent vertical centering issues
            }}
          >
            <AnimatePresence>
              {connectedAppsData.map((app) => (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <AppWidget
                    app={app}
                    isMinimized={minimizedApps.has(app.id)}
                    onToggleSize={() => handleToggleSize(app.id)}
                    onOpenInTab={() => handleOpenInTab(app.id)}
                    onConnect={() => handleAppConnect(app.id)}
                    isHighlighted={highlightedApps.includes(app.id)}
                    highlightIntensity="medium"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {disconnectedApps.length > 0 && (
        <div>
          <Text
            size={400}
            weight="semibold"
            style={{ marginBottom: "16px", display: "block" }}
          >
            Available Apps
          </Text>

          <motion.div
            layout
            style={{
              display: "grid",
              gridTemplateColumns: getDisconnectedAppsGridLayout(),
              gap: "16px",
              justifyItems: "center",
            }}
          >
            <AnimatePresence>
              {disconnectedApps.map((app) => (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <AppWidget
                    app={app}
                    isMinimized={true}
                    onToggleSize={() => {}}
                    onOpenInTab={() => handleOpenInTab(app.id)}
                    onConnect={() => handleAppConnect(app.id)}
                    isHighlighted={highlightedApps.includes(app.id)}
                    highlightIntensity="high"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* <div
        style={{
          marginTop: "32px",
          padding: "16px",
          backgroundColor: "#EDF3FF",
          borderRadius: "8px",
          border: "1px solid #C7E0F4",
        }}
      >
        <Text size={300} style={{ color: "#323130" }}>
          <strong>How it works:</strong> Connect your Microsoft 365 apps to see
          live previews and recent activity. When you submit AI commands, the
          system will check if the required apps are connected. If not, you'll
          be prompted to connect them first. Watch as the relevant app widgets
          light up to show which apps are communicating and processing your
          request. Click "Expand\" to see more details, or \"Open App\" to
          launch the full application in a new tab.
        </Text>
      </div> */}
    </div>
  );
};
