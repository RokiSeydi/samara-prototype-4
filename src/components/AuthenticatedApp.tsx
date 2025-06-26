import React, { useState, useEffect } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import {
  Text,
  Spinner,
  Button,
  MessageBar,
  MessageBarTitle,
  MessageBarBody,
} from "@fluentui/react-components";
import {
  SettingsRegular,
  InfoRegular,
  WarningRegular,
  PlugConnectedRegular,
  ChartMultipleRegular,
  TaskListAddRegular,
} from "@fluentui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { AuthButton } from "./AuthButton";
import { WelcomeScreen } from "./WelcomeScreen";
import { AppDashboard } from "./AppDashboard";
import { PriorityDashboard } from "./PriorityDashboard";
import { AICommandInterface } from "./AICommandInterface";
import { AppIntegrationSidebar } from "./AppIntegrationSidebar";
import { SettingsPanel } from "./SettingsPanel";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { useGraphData } from "../hooks/useGraphData";
import {
  useAnalytics,
  usePerformanceTracking,
  useErrorTracking,
} from "../hooks/useAnalytics";
import { analytics } from "../services/analytics";

interface AICommand {
  id: string;
  command: string;
  status: "processing" | "completed" | "error" | "blocked";
  result?: string;
  timestamp: Date;
  apps: string[];
  missingApps?: string[];
}

export const AuthenticatedApp: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();
  const { accounts } = useMsal();
  const [showWelcome, setShowWelcome] = useState(true);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionStep, setTransitionStep] = useState(0);
  const [visibleLetters, setVisibleLetters] = useState(0);
  const [highlightedApps, setHighlightedApps] = useState<string[]>([]);
  const [connectedApps, setConnectedApps] = useState<string[]>([]);
  const [showIntegrationSidebar, setShowIntegrationSidebar] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  const [requestedApps, setRequestedApps] = useState<string[]>([]);
  const [recentCommands, setRecentCommands] = useState<AICommand[]>([]);
  const [canViewAnalytics, setCanViewAnalytics] = useState(false);
  const [currentView, setCurrentView] = useState<"priorities" | "apps">(
    "priorities"
  ); // Default to priorities

  // NEW: Demo mode state
  const [isDemoMode, setIsDemoMode] = useState(false);

  const { documents, loading, error, accountType } = useGraphData();

  // Analytics hooks
  const {
    trackUserJourney,
    trackAuthentication,
    trackAICommand,
    trackAppConnection,
    trackFeatureUsage,
    trackBusinessEvent,
  } = useAnalytics();

  // Performance and error tracking
  usePerformanceTracking();
  useErrorTracking();

  // FIXED: Reset demo mode when user authenticates
  useEffect(() => {
    if (isAuthenticated && isDemoMode) {
      console.log(
        "🔄 User authenticated - switching from demo mode to authenticated mode"
      );
      setIsDemoMode(false);
      // Reset connected apps to empty for authenticated users (they'll connect manually)
      setConnectedApps([]);
    }
  }, [isAuthenticated, isDemoMode]);

  useEffect(() => {
    if (isAuthenticated && accounts[0]) {
      // Set user information in analytics service
      analytics.setUserInfo({
        displayName: accounts[0].name,
        mail: accounts[0].username,
        userPrincipalName: accounts[0].username,
      });

      // Check if user can view analytics
      const authStatus = analytics.getAuthorizationStatus();
      setCanViewAnalytics(authStatus.canViewAnalytics);

      if (authStatus.isAuthorizedUser) {
        console.log("🎯 Welcome Roki! Analytics dashboard is available.");
      }
    }
  }, [isAuthenticated, accounts]);

  useEffect(() => {
    // Handle both authenticated and demo mode transitions
    if ((isAuthenticated || isDemoMode) && showWelcome) {
      // Track the appropriate mode
      if (isAuthenticated) {
        trackAuthentication("login_success", {
          accountType: accountType,
          hasDocuments: documents.length > 0,
          connectedApps: connectedApps.length,
        });

        if (accounts[0]) {
          analytics.setUserId(accounts[0].homeAccountId);
        }
      } else if (isDemoMode) {
        trackUserJourney("demo_mode_started", {
          isFirstTime: !localStorage.getItem("samara_demo_visited"),
          defaultView: "priorities",
        });

        // Mark demo as visited
        localStorage.setItem("samara_demo_visited", "true");
      }

      // Track user journey
      trackUserJourney("app_loaded", {
        isFirstTime: !localStorage.getItem("samara_visited"),
        accountType: isDemoMode ? "demo" : accountType,
        defaultView: "priorities",
        mode: isDemoMode ? "demo" : "authenticated",
      });

      // Mark as visited
      localStorage.setItem("samara_visited", "true");

      // Start the transition sequence
      const timer = setTimeout(() => {
        setShowWelcome(false);
        setShowTransition(true);

        // Letter-by-letter animation for "SAMARA" (6 letters)
        const letterTimings = [200, 400, 600, 800, 1000, 1200];
        letterTimings.forEach((delay, index) => {
          setTimeout(() => {
            setVisibleLetters(index + 1);
          }, delay);
        });

        // Transition steps after letters are complete
        const steps = [
          { delay: 2000, step: 1 },
          { delay: 3500, step: 2 },
          { delay: 5000, step: 3 },
        ];

        steps.forEach(({ delay, step }) => {
          setTimeout(() => {
            setTransitionStep(step);
          }, delay);
        });

        // Complete transition after 6 seconds total
        setTimeout(() => {
          setShowTransition(false);
          trackUserJourney(
            isDemoMode ? "demo_dashboard_loaded" : "priorities_dashboard_loaded"
          );
        }, 6000);
      }, 800);

      return () => clearTimeout(timer);
    } else if (!isAuthenticated && !isDemoMode) {
      setShowWelcome(true);
      setShowTransition(false);
      setTransitionStep(0);
      setVisibleLetters(0);
    }
  }, [
    isAuthenticated,
    isDemoMode,
    showWelcome,
    trackAuthentication,
    trackUserJourney,
    accountType,
    documents.length,
    connectedApps.length,
    accounts,
  ]);

  // Track demo to live conversion
  useEffect(() => {
    if (!error && documents.length > 0 && accountType !== "unknown") {
      console.log("✅ Real Documents Loaded Successfully:", {
        accountType: accountType,
        documentsCount: documents.length,
        connectedApps: connectedApps,
      });

      trackBusinessEvent("demo_to_live_conversion", {
        accountType: accountType,
        documentsCount: documents.length,
        connectedApps: connectedApps,
      });
    }
  }, [error, documents.length, accountType, connectedApps, trackBusinessEvent]);

  // NEW: Handle demo mode start
  const handleStartDemo = () => {
    console.log("🎭 Starting demo mode without authentication");
    setIsDemoMode(true);
    setShowWelcome(false);
    setShowTransition(true);
    setVisibleLetters(0);

    // Set up demo environment with connected apps
    setConnectedApps(["excel", "word", "onenote"]); // Pre-connect some apps for demo

    trackUserJourney("demo_mode_started", {
      triggeredFrom: "welcome_screen",
      preConnectedApps: ["excel", "word", "onenote"],
    });

    // Letter-by-letter animation for demo mode
    const letterTimings = [150, 300, 450, 600, 750, 900];
    letterTimings.forEach((delay, index) => {
      setTimeout(() => {
        setVisibleLetters(index + 1);
      }, delay);
    });

    const steps = [
      { delay: 1500, step: 1 },
      { delay: 2800, step: 2 },
      { delay: 4200, step: 3 },
    ];

    steps.forEach(({ delay, step }) => {
      setTimeout(() => {
        setTransitionStep(step);
      }, delay);
    });

    setTimeout(() => {
      setShowTransition(false);
      trackUserJourney("demo_dashboard_loaded");
    }, 5000);
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // Authenticated user flow
      trackUserJourney("get_started_clicked");

      setShowWelcome(false);
      setShowTransition(true);
      setVisibleLetters(0);

      const letterTimings = [150, 300, 450, 600, 750, 900];
      letterTimings.forEach((delay, index) => {
        setTimeout(() => {
          setVisibleLetters(index + 1);
        }, delay);
      });

      const steps = [
        { delay: 1500, step: 1 },
        { delay: 2800, step: 2 },
        { delay: 4200, step: 3 },
      ];

      steps.forEach(({ delay, step }) => {
        setTimeout(() => {
          setTransitionStep(step);
        }, delay);
      });

      setTimeout(() => {
        setShowTransition(false);
        trackUserJourney("priorities_dashboard_loaded");
      }, 5000);
    } else {
      // Demo mode flow
      handleStartDemo();
    }
  };

  const handleCommandExecute = (command: string, apps: string[]) => {
    console.log("AI Command executed:", command, "Apps involved:", apps);

    // Track AI command execution
    trackAICommand("command_executed", {
      command: command,
      appsInvolved: apps,
      connectedAppsCount: connectedApps.length,
      commandLength: command.length,
      isDemoMode: isDemoMode || error !== null,
      mode: isDemoMode ? "demo" : "authenticated",
    });

    setHighlightedApps(apps);

    setTimeout(() => {
      setHighlightedApps([]);
    }, 5000);
  };

  const handleCommandUpdate = (commands: AICommand[]) => {
    setRecentCommands(commands);

    const latestCommand = commands[0];
    if (latestCommand) {
      if (latestCommand.status === "completed") {
        trackAICommand("command_executed", {
          command: latestCommand.command,
          apps: latestCommand.apps,
          success: true,
          mode: isDemoMode ? "demo" : "authenticated",
        });
      } else if (latestCommand.status === "error") {
        trackAICommand("command_failed", {
          command: latestCommand.command,
          apps: latestCommand.apps,
          error: latestCommand.result,
          mode: isDemoMode ? "demo" : "authenticated",
        });
      } else if (latestCommand.status === "blocked") {
        trackAICommand("command_blocked", {
          command: latestCommand.command,
          missingApps: latestCommand.missingApps,
          mode: isDemoMode ? "demo" : "authenticated",
        });
      }
    }
  };

  const handleRequestConnection = (appIds: string[]) => {
    console.log("Requesting connection for apps:", appIds);

    appIds.forEach((appId) => {
      trackAppConnection("connection_attempt", appId, {
        triggeredBy: "ai_command",
        currentConnectedApps: connectedApps,
        mode: isDemoMode ? "demo" : "authenticated",
      });
    });

    setRequestedApps(appIds);
    setShowIntegrationSidebar(true);
  };

  const handleAppConnection = (appId: string, connected: boolean) => {
    trackAppConnection(
      connected ? "connection_success" : "disconnection",
      appId,
      {
        totalConnectedApps: connected
          ? connectedApps.length + 1
          : connectedApps.length - 1,
        connectionMethod: "manual",
        mode: isDemoMode ? "demo" : "authenticated",
      }
    );

    const newConnectedApps = connected
      ? [...connectedApps, appId]
      : connectedApps.filter((id) => id !== appId);

    setConnectedApps(newConnectedApps);
  };

  const handleCloseSidebar = () => {
    setShowIntegrationSidebar(false);
    setRequestedApps([]);
  };

  const handleClearHistory = () => {
    trackFeatureUsage("settings", "clear_command_history");
    setRecentCommands([]);
  };

  const handleOpenAppConnections = () => {
    trackFeatureUsage("header", "open_app_connections");
    setRequestedApps([]);
    setShowIntegrationSidebar(true);
  };

  const handleOpenSettings = () => {
    trackFeatureUsage("header", "open_settings");
    setShowSettingsPanel(true);
  };

  const handleOpenAnalytics = () => {
    if (!canViewAnalytics) {
      console.warn(
        "Analytics dashboard is only available for authorized users"
      );
      return;
    }
    trackFeatureUsage("header", "open_analytics");
    setShowAnalyticsDashboard(true);
  };

  const handleViewChange = (view: "priorities" | "apps") => {
    trackFeatureUsage("navigation", `switch_to_${view}_view`);
    setCurrentView(view);
  };

  // FIXED: Handle switching from demo to authenticated mode
  const handleSwitchToAuthenticated = () => {
    console.log("🔄 Switching from demo mode to authentication");
    setIsDemoMode(false);
    setShowWelcome(true);
    setConnectedApps([]); // Reset connected apps
    trackUserJourney("demo_to_auth_switch");
  };

  const getStatusMessage = () => {
    if (loading) return null;

    // NEW: Demo mode message
    if (isDemoMode) {
      return {
        intent: "info" as const,
        title: "Demo Mode Active",
        message: (
          <>
            You're exploring Samara with realistic sample data. All features
            work exactly as they would with real Microsoft 365 data!
            <br />
            <strong>What's included:</strong> Priority Dashboard • AI Commands •
            Document editing • Collaboration features
            <br />
            <strong>Ready to connect your real data?</strong> Sign in with your
            Microsoft 365 account to access your actual documents and workflows.
          </>
        ),
      };
    }

    if (error === "BUSINESS_STANDARD_RESTRICTED") {
      return {
        intent: "warning" as const,
        title: "Business Account File Access Restricted",
        message: (
          <>
            Your Microsoft 365 Business Standard account has file access
            restrictions set by your IT administrator.
            <br />
            <strong>What works:</strong> Priority Dashboard with emails,
            calendar, and tasks • AI Commands • All collaboration features
            <br />
            <strong>Demo mode:</strong> Shows realistic sample documents to
            demonstrate full functionality
            <br />
            <strong>To get full access:</strong> Contact your IT administrator
            to enable third-party app file access permissions
          </>
        ),
      };
    }

    if (error === "SUBSCRIPTION_REQUIRED") {
      return {
        intent: "warning" as const,
        title: "Microsoft 365 Subscription Required",
        message: (
          <>
            Your account doesn't have access to OneDrive/SharePoint Online. This
            prototype is showing demo documents to demonstrate functionality.
            <br />
            <strong>To see your real documents:</strong> You'll need a Microsoft
            365 Business subscription or upgrade your personal account.
            <br />
            <strong>Current mode:</strong> Demo with realistic sample documents
          </>
        ),
      };
    }

    if (error === "PERMISSIONS_REQUIRED") {
      return {
        intent: "warning" as const,
        title: "Additional Permissions Required",
        message: (
          <>
            The app needs additional permissions to access your documents. This
            prototype is showing demo documents.
            <br />
            <strong>To fix:</strong> Contact your IT administrator to grant the
            necessary permissions.
            <br />
            <strong>Current mode:</strong> Demo with sample documents
          </>
        ),
      };
    }

    if (error === "NO_DOCUMENTS_FOUND") {
      return {
        intent: "info" as const,
        title: "No Office Documents Found",
        message: (
          <>
            No Office documents were found in your OneDrive. Demo documents are
            shown for testing.
            <br />
            <strong>To see real documents:</strong> Create some Excel, Word, or
            PowerPoint files in your OneDrive.
            <br />
            <strong>Current mode:</strong> Demo with sample documents
          </>
        ),
      };
    }

    if (error === "API_ERROR") {
      return {
        intent: "warning" as const,
        title: "Unable to Load Documents",
        message: (
          <>
            There was an issue connecting to Microsoft 365. Demo documents are
            shown for testing.
            <br />
            <strong>This is normal for prototype testing.</strong> All features
            work with demo data.
          </>
        ),
      };
    }

    return null;
  };

  const statusMessage = getStatusMessage();

  const getTransitionMessage = () => {
    switch (transitionStep) {
      case 1:
        return isDemoMode
          ? "Loading demo environment"
          : "Connecting to Microsoft 365";
      case 2:
        return isDemoMode ? "Preparing sample data" : "Loading your priorities";
      case 3:
        return isDemoMode
          ? "Setting up demo dashboard"
          : "Preparing your dashboard";
      default:
        return isDemoMode ? "Starting Samara Demo" : "Starting Samara";
    }
  };

  // FIXED: Determine current mode for styling
  const currentMode = isAuthenticated
    ? "authenticated"
    : isDemoMode
    ? "demo"
    : "welcome";
  const themeColor = currentMode === "demo" ? "#7719AA" : "#0078D4";

  // Show clean transition screen with letter-by-letter animation
  if (showTransition) {
    const logoLetters = ["S", "A", "M", "A", "R", "A"];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF",
          color: "#323130",
          textAlign: "center",
          padding: "48px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Samara Logo with Letter-by-Letter Animation */}
          <div
            style={{
              marginBottom: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "120px",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline" }}>
              {logoLetters.map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{
                    opacity: index < visibleLetters ? 1 : 0,
                    y: index < visibleLetters ? 0 : 20,
                    scale: index < visibleLetters ? 1 : 0.8,
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    delay: index < visibleLetters ? 0 : 0,
                  }}
                  style={{
                    fontSize: "72px",
                    fontWeight: 600,
                    color: themeColor,
                    letterSpacing: "4px",
                    fontFamily: "Segoe UI, system-ui, sans-serif",
                    display: "inline-block",
                    minWidth: index === 0 ? "50px" : "45px",
                    textAlign: "center",
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Status Message - Only show after letters are complete */}
          <AnimatePresence>
            {visibleLetters >= 6 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "24px",
                }}
              >
                <motion.div
                  key={transitionStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Text
                    size={400}
                    style={{
                      color: "#605E5C",
                      marginBottom: "16px",
                      display: "block",
                      fontWeight: 400,
                    }}
                  >
                    {getTransitionMessage()}
                  </Text>

                  <Spinner size="medium" style={{ color: themeColor }} />
                </motion.div>

                {/* Simple Progress Dots */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "12px",
                  }}
                >
                  {[1, 2, 3].map((step) => (
                    <motion.div
                      key={step}
                      initial={{ scale: 0.6, opacity: 0.3 }}
                      animate={{
                        scale: transitionStep >= step ? 1 : 0.6,
                        opacity: transitionStep >= step ? 1 : 0.3,
                      }}
                      transition={{ duration: 0.3 }}
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor:
                          transitionStep >= step ? themeColor : "#C8C6C4",
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={showWelcome ? "welcome" : "dashboard"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {(isAuthenticated || isDemoMode) && !showWelcome && (
          <>
            {/* SAMARA Logo Header */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              style={{
                padding: "16px 24px 8px",
                backgroundColor: "#FFFFFF",
                borderBottom: "1px solid #E1DFDD",
                textAlign: "center",
              }}
            >
              <Text
                size={700}
                weight="semibold"
                style={{
                  color: themeColor,
                  letterSpacing: "2px",
                  fontFamily: "Segoe UI, system-ui, sans-serif",
                }}
              >
                SAMARA{" "}
                {isDemoMode && (
                  <span style={{ fontSize: "14px", color: "#605E5C" }}>
                    DEMO
                  </span>
                )}
              </Text>
            </motion.div>

            {/* Main Header */}
            <motion.header
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{
                padding: "16px 24px",
                backgroundColor: "#FFFFFF",
                borderBottom: "1px solid #E1DFDD",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Text size={600} weight="semibold" style={{ color: "#323130" }}>
                  Microsoft 365 Integration Hub
                </Text>
                {isDemoMode && (
                  <div
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#F0F9FF",
                      border: "1px solid #7719AA",
                      borderRadius: "16px",
                      fontSize: "12px",
                      color: "#7719AA",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#7719AA",
                      }}
                    />
                    Demo Mode
                  </div>
                )}
                {highlightedApps.length > 0 && (
                  <div
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#FFF4CE",
                      border: "1px solid #F7E600",
                      borderRadius: "16px",
                      fontSize: "12px",
                      color: "#323130",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#F7E600",
                        animation: "pulse 1.5s infinite",
                      }}
                    />
                    AI Processing Active
                  </div>
                )}
                {loading && (
                  <div
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#EDF3FF",
                      border: "1px solid #C7E0F4",
                      borderRadius: "16px",
                      fontSize: "12px",
                      color: "#323130",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Spinner size="tiny" />
                    Loading Data
                  </div>
                )}
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {/* View Toggle */}
                <div
                  style={{ display: "flex", gap: "4px", marginRight: "12px" }}
                >
                  <Button
                    appearance={
                      currentView === "priorities" ? "primary" : "subtle"
                    }
                    icon={<TaskListAddRegular />}
                    onClick={() => handleViewChange("priorities")}
                    size="small"
                  >
                    Priorities
                  </Button>
                  <Button
                    appearance={currentView === "apps" ? "primary" : "subtle"}
                    icon={<PlugConnectedRegular />}
                    onClick={() => handleViewChange("apps")}
                    size="small"
                  >
                    Apps
                  </Button>
                </div>

                {canViewAnalytics && (
                  <Button
                    appearance="subtle"
                    icon={<ChartMultipleRegular />}
                    onClick={handleOpenAnalytics}
                  >
                    Analytics
                  </Button>
                )}
                <Button
                  appearance="subtle"
                  icon={<PlugConnectedRegular />}
                  onClick={handleOpenAppConnections}
                >
                  App Connections
                </Button>
                <Button
                  appearance="subtle"
                  icon={<SettingsRegular />}
                  onClick={handleOpenSettings}
                >
                  Settings
                </Button>

                {/* Show AuthButton only for authenticated users */}
                {isAuthenticated && <AuthButton />}

                {/* Show Sign In button for demo users */}
                {isDemoMode && (
                  <Button
                    appearance="primary"
                    size="small"
                    onClick={handleSwitchToAuthenticated}
                    style={{
                      backgroundColor: "#0078D4",
                      border: "none",
                    }}
                  >
                    Sign In for Real Data
                  </Button>
                )}
              </div>
            </motion.header>
          </>
        )}

        <main>
          {!isAuthenticated && !isDemoMode ? (
            <WelcomeScreen
              onGetStarted={handleGetStarted}
              onStartDemo={handleStartDemo}
            />
          ) : (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {/* Status Message */}
              {statusMessage && (
                <div style={{ padding: "24px 24px 0" }}>
                  <MessageBar
                    intent={statusMessage.intent}
                    style={{ marginBottom: "16px" }}
                  >
                    <MessageBarBody>
                      <MessageBarTitle>
                        {statusMessage.intent === "warning" ? (
                          <WarningRegular
                            style={{ fontSize: "16px", marginRight: "8px" }}
                          />
                        ) : (
                          <InfoRegular
                            style={{ fontSize: "16px", marginRight: "8px" }}
                          />
                        )}
                        {statusMessage.title}
                      </MessageBarTitle>
                      <div style={{ marginTop: "8px" }}>
                        <Text size={300}>{statusMessage.message}</Text>
                      </div>
                    </MessageBarBody>
                  </MessageBar>
                </div>
              )}

              {/* AI Command Interface */}
              <div style={{ padding: "24px 24px 0" }}>
                <AICommandInterface
                  onCommandExecute={handleCommandExecute}
                  onCommandUpdate={handleCommandUpdate}
                  connectedApps={connectedApps}
                  onRequestConnection={handleRequestConnection}
                />
              </div>

              {/* Conditional View Rendering */}
              {currentView === "priorities" ? (
                <PriorityDashboard connectedApps={connectedApps} />
              ) : (
                <AppDashboard
                  onCommandExecute={handleCommandExecute}
                  highlightedApps={highlightedApps}
                  connectedApps={connectedApps}
                  onAppConnection={handleAppConnection}
                />
              )}
            </motion.div>
          )}
        </main>

        <AppIntegrationSidebar
          isOpen={showIntegrationSidebar}
          onClose={handleCloseSidebar}
          onAppToggle={handleAppConnection}
          highlightedApps={requestedApps}
        />

        <SettingsPanel
          isOpen={showSettingsPanel}
          onClose={() => setShowSettingsPanel(false)}
          recentCommands={recentCommands}
          onClearHistory={handleClearHistory}
          onRequestConnection={handleRequestConnection}
        />

        {canViewAnalytics && (
          <AnalyticsDashboard
            isOpen={showAnalyticsDashboard}
            onClose={() => setShowAnalyticsDashboard(false)}
          />
        )}

        {/* {!isAuthenticated && !isDemoMode && (
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              padding: "16px",
              backgroundColor: "#FFF4CE",
              border: "1px solid #F7E600",
              borderRadius: "8px",
              maxWidth: "300px",
              fontSize: "12px",
              color: "#323130",
            }}
          >
            <Text
              size={200}
              weight="semibold"
              style={{ display: "block", marginBottom: "8px" }}
            >
              Setup Required
            </Text>
            <Text size={200}>
              To use this prototype, you'll need to register an Azure AD
              application and update the clientId in msalConfig.ts
            </Text>
          </div>
        )} */}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};
