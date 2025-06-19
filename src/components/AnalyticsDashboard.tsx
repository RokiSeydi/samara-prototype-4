import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  Button,
  Badge,
  Divider,
  MessageBar,
  MessageBarTitle,
  MessageBarBody,
} from "@fluentui/react-components";
import {
  ChartMultipleRegular,
  DataUsageRegular,
  PeopleRegular,
  ClockRegular,
  ErrorCircleRegular,
  CheckmarkCircleRegular,
  EyeRegular,
  DismissRegular,
  ShieldCheckmarkRegular,
  PersonRegular,
} from "@fluentui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import {
  analytics,
  type AnalyticsEvent,
  type UserMetrics,
} from "../services/analytics";

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MetricCard {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
  trend?: "up" | "down" | "stable";
  description?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [sessionMetrics, setSessionMetrics] = useState<UserMetrics | null>(
    null
  );
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [authStatus, setAuthStatus] = useState<unknown>(null);

  useEffect(() => {
    if (isOpen) {
      // Check authorization status
      const status = analytics.getAuthorizationStatus();
      setAuthStatus(status);

      // Only proceed if user is authorized
      if (!status.canViewAnalytics) {
        return;
      }

      // Get current session metrics
      setSessionMetrics(analytics.getSessionSummary());

      // Get recent events
      setRecentEvents(analytics.getStoredEvents().slice(-20));

      // Check if debug mode is enabled
      setIsDebugMode(localStorage.getItem("analytics-debug") === "true");
    }
  }, [isOpen]);

  const toggleDebugMode = () => {
    if (!authStatus?.canViewAnalytics) return;

    if (isDebugMode) {
      analytics.disableDebugMode();
    } else {
      analytics.enableDebugMode();
    }
    setIsDebugMode(!isDebugMode);
  };

  const clearAnalyticsData = () => {
    if (!authStatus?.canViewAnalytics) return;

    analytics.clearStoredEvents();
    setRecentEvents([]);
  };

  const getMetricCards = (): MetricCard[] => {
    if (!sessionMetrics || !authStatus?.canViewAnalytics) return [];

    return [
      {
        title: "Session Duration",
        value: `${Math.round(
          sessionMetrics.averageSessionDuration / 1000 / 60
        )}m`,
        icon: <ClockRegular />,
        color: "#0078D4",
        description: "Time spent in current session",
      },
      {
        title: "AI Commands",
        value: sessionMetrics.totalCommands,
        icon: <ChartMultipleRegular />,
        color: "#107C10",
        description: "Commands executed this session",
      },
      {
        title: "Connected Apps",
        value: sessionMetrics.connectedApps.length,
        icon: <PeopleRegular />,
        color: "#7719AA",
        description: "Microsoft 365 apps connected",
      },
      {
        title: "Success Rate",
        value:
          sessionMetrics.totalCommands > 0
            ? `${Math.round(
                (sessionMetrics.successfulCommands /
                  sessionMetrics.totalCommands) *
                  100
              )}%`
            : "0%",
        icon: <CheckmarkCircleRegular />,
        color: "#107C10",
        description: "Command success rate",
      },
      {
        title: "Documents Accessed",
        value: sessionMetrics.documentsAccessed,
        icon: <DataUsageRegular />,
        color: "#D24726",
        description: "Documents viewed or edited",
      },
      {
        title: "Features Used",
        value: sessionMetrics.featuresUsed.length,
        icon: <EyeRegular />,
        color: "#F7630C",
        description: "Unique features accessed",
      },
    ];
  };

  const formatEventTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEventIcon = (eventName: string) => {
    if (eventName.includes("error") || eventName.includes("failed")) {
      return <ErrorCircleRegular style={{ color: "#D13438" }} />;
    }
    if (eventName.includes("success") || eventName.includes("completed")) {
      return <CheckmarkCircleRegular style={{ color: "#107C10" }} />;
    }
    return <DataUsageRegular style={{ color: "#0078D4" }} />;
  };

  const getEventColor = (eventName: string) => {
    if (eventName.includes("error") || eventName.includes("failed"))
      return "#FDF2F2";
    if (eventName.includes("success") || eventName.includes("completed"))
      return "#F3F9F1";
    if (eventName.includes("auth")) return "#EDF3FF";
    if (eventName.includes("ai_command")) return "#F0F9FF";
    if (eventName.includes("app_")) return "#F8F0FF";
    return "#F8F9FA";
  };

  if (!isOpen) return null;

  // Show unauthorized message if user cannot view analytics
  if (!authStatus?.canViewAnalytics) {
    return (
      <>
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
              }}
            >
              <Text size={600} weight="semibold">
                Analytics Dashboard
              </Text>
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                onClick={onClose}
                style={{ minWidth: "auto", padding: "8px" }}
              />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <ShieldCheckmarkRegular
              style={{
                fontSize: "64px",
                color: "#F7630C",
                marginBottom: "24px",
              }}
            />

            <Text
              size={500}
              weight="semibold"
              style={{
                marginBottom: "16px",
                color: "#323130",
              }}
            >
              Analytics Access Restricted
            </Text>

            <Text
              size={400}
              style={{
                color: "#605E5C",
                lineHeight: "1.5",
                marginBottom: "24px",
              }}
            >
              The analytics dashboard is only available for authorized users.
              This helps protect user privacy and ensures data security.
            </Text>

            <div
              style={{
                padding: "16px",
                backgroundColor: "#FFF4E6",
                border: "1px solid #F7630C",
                borderRadius: "8px",
                marginBottom: "24px",
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
                <PersonRegular style={{ color: "#F7630C" }} />
                <Text size={300} weight="semibold" style={{ color: "#F7630C" }}>
                  Current User
                </Text>
              </div>
              <Text size={300} style={{ color: "#8B4513" }}>
                {authStatus?.userEmail || "Not authenticated"}
              </Text>
            </div>

            <Text
              size={300}
              style={{
                color: "#8A8886",
                fontStyle: "italic",
              }}
            >
              Contact the system administrator if you believe you should have
              access to analytics.
            </Text>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
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
              Analytics Dashboard
            </Text>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={onClose}
              style={{ minWidth: "auto", padding: "8px" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <Badge
              appearance="filled"
              color={isDebugMode ? "warning" : "success"}
              size="small"
            >
              {isDebugMode ? "Debug Mode" : "Production Mode"}
            </Badge>
            <Badge appearance="filled" color="important" size="small">
              <ShieldCheckmarkRegular
                style={{ fontSize: "12px", marginRight: "4px" }}
              />
              Authorized User
            </Badge>
          </div>

          <Text size={300} style={{ color: "#605E5C" }}>
            Session: {sessionMetrics?.sessionId.split("_")[1]} • Welcome, Roki!
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
          {/* Authorization Notice */}
          <MessageBar intent="info" style={{ marginBottom: "24px" }}>
            <MessageBarBody>
              <MessageBarTitle>Authorized Analytics Access</MessageBarTitle>
              You have full access to analytics data as an authorized user. All
              user interactions and system metrics are being tracked for product
              improvement.
            </MessageBarBody>
          </MessageBar>

          {/* Debug Mode Notice */}
          {isDebugMode && (
            <MessageBar intent="warning" style={{ marginBottom: "24px" }}>
              <MessageBarBody>
                <MessageBarTitle>Debug Mode Active</MessageBarTitle>
                Analytics events are being logged to console and stored locally
                for debugging.
              </MessageBarBody>
            </MessageBar>
          )}

          {/* Session Metrics */}
          <div style={{ marginBottom: "32px" }}>
            <Text
              size={500}
              weight="semibold"
              style={{ marginBottom: "16px", display: "block" }}
            >
              Current Session Metrics
            </Text>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "16px",
              }}
            >
              {getMetricCards().map((metric, index) => (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    style={{
                      padding: "16px",
                      border: `2px solid ${metric.color}20`,
                      backgroundColor: `${metric.color}08`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ color: metric.color, fontSize: "20px" }}>
                        {metric.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text
                          size={600}
                          weight="semibold"
                          style={{ display: "block" }}
                        >
                          {metric.value}
                        </Text>
                        <Text size={200} style={{ color: "#605E5C" }}>
                          {metric.title}
                        </Text>
                      </div>
                    </div>
                    {metric.description && (
                      <Text size={200} style={{ color: "#8A8886" }}>
                        {metric.description}
                      </Text>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <Divider />

          {/* Recent Events */}
          <div style={{ marginTop: "32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <Text size={500} weight="semibold">
                Recent Events
              </Text>
              <Badge appearance="outline" size="small">
                {recentEvents.length} events
              </Badge>
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <AnimatePresence>
                {recentEvents
                  .slice()
                  .reverse()
                  .map((event, index) => (
                    <motion.div
                      key={`${event.timestamp}-${index}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ marginBottom: "8px" }}
                    >
                      <Card
                        style={{
                          padding: "12px",
                          backgroundColor: getEventColor(event.event),
                          border: "1px solid #E1DFDD",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          {getEventIcon(event.event)}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              size={300}
                              weight="semibold"
                              style={{
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {event.event
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Text>
                            <Text size={200} style={{ color: "#605E5C" }}>
                              {formatEventTime(event.timestamp)}
                            </Text>
                          </div>
                          {Object.keys(event.properties).length > 0 && (
                            <Badge appearance="outline" size="small">
                              {Object.keys(event.properties).length} props
                            </Badge>
                          )}
                        </div>

                        {/* Show key properties */}
                        {event.properties.command && (
                          <div
                            style={{
                              marginTop: "8px",
                              padding: "8px",
                              backgroundColor: "rgba(255, 255, 255, 0.7)",
                              borderRadius: "4px",
                            }}
                          >
                            <Text size={200} style={{ fontStyle: "italic" }}>
                              "{event.properties.command}"
                            </Text>
                          </div>
                        )}

                        {event.properties.appId && (
                          <div style={{ marginTop: "4px" }}>
                            <Badge size="small" color="brand">
                              {event.properties.appId}
                            </Badge>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  ))}
              </AnimatePresence>

              {recentEvents.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    color: "#8A8886",
                  }}
                >
                  <DataUsageRegular
                    style={{ fontSize: "48px", marginBottom: "16px" }}
                  />
                  <Text size={400}>No events recorded yet</Text>
                  <Text
                    size={300}
                    style={{ display: "block", marginTop: "8px" }}
                  >
                    Start using Samara to see analytics data
                  </Text>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E1DFDD",
            backgroundColor: "#F8F9FA",
            display: "flex",
            gap: "12px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <Button appearance="subtle" size="small" onClick={toggleDebugMode}>
              {isDebugMode ? "Disable" : "Enable"} Debug Mode
            </Button>

            <Button
              appearance="subtle"
              size="small"
              onClick={clearAnalyticsData}
              disabled={recentEvents.length === 0}
            >
              Clear Data
            </Button>
          </div>

          <Text size={200} style={{ color: "#8A8886", alignSelf: "center" }}>
            Analytics help improve Samara
          </Text>
        </div>
      </motion.div>
    </>
  );
};
