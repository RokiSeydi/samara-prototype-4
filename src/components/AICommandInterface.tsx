import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  Spinner,
  Toast,
  ToastTitle,
  useToastController,
  Toaster,
  MessageBar,
  MessageBarTitle,
  MessageBarBody,
} from "@fluentui/react-components";
import {
  SendRegular,
  BrainCircuitRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  WarningRegular,
  PlugDisconnectedRegular,
  DocumentRegular,
  DocumentTableRegular,
  SlideTextRegular,
  NotebookRegular,
} from "@fluentui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useMsal } from "@azure/msal-react";
import { RealAICommandProcessor } from "../services/realAICommands";
import { DemoAICommandProcessor } from "../services/demoAICommands";
import { loginRequest } from "../config/msalConfig";
import { useGraphData } from "../hooks/useGraphData";

interface AICommand {
  id: string;
  command: string;
  status: "processing" | "completed" | "error" | "blocked";
  result?: string;
  timestamp: Date;
  apps: string[];
  missingApps?: string[];
  documentsUsed?: Array<{
    name: string;
    type: string;
    action: string;
  }>;
  outputFiles?: Array<{
    name: string;
    type: string;
    size: string;
  }>;
}

interface AICommandInterfaceProps {
  onCommandExecute?: (command: string, apps: string[]) => void;
  onCommandUpdate?: (commands: AICommand[]) => void;
  connectedApps?: string[];
  onRequestConnection?: (appIds: string[]) => void;
}

export const AICommandInterface: React.FC<AICommandInterfaceProps> = ({
  onCommandExecute,
  onCommandUpdate,
  connectedApps = [],
  onRequestConnection,
}) => {
  const [command, setCommand] = useState("");
  const [commands, setCommands] = useState<AICommand[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationError, setValidationError] = useState<{
    missingApps: string[];
    message: string;
  } | null>(null);
  const { dispatchToast } = useToastController();
  const { instance, accounts } = useMsal();
  const { documents, error: documentsError, accountType } = useGraphData();

  // Determine if we should use real API or demo mode
  const shouldUseRealAPI = () => {
    // Use real API if:
    // 1. User is authenticated with business account
    // 2. Has connected apps
    // 3. Not in demo mode due to file restrictions (but still has other services)
    const isAuthenticated = accounts.length > 0;
    const hasConnectedApps = connectedApps.length > 0;
    const isBusinessAccount = accountType === "business";

    // Even if documents are restricted, we can still use real API for other operations
    const canUseRealAPI =
      isAuthenticated && hasConnectedApps && isBusinessAccount;

    console.log("🤖 AI Command Mode Decision:", {
      isAuthenticated,
      hasConnectedApps,
      isBusinessAccount,
      documentsError,
      decision: canUseRealAPI ? "REAL API" : "DEMO MODE",
    });

    return canUseRealAPI;
  };

  const useRealAPI = shouldUseRealAPI();

  // Update parent component when commands change
  useEffect(() => {
    onCommandUpdate?.(commands);
  }, [commands, onCommandUpdate]);

  const detectApps = (command: string): string[] => {
    const apps: string[] = [];
    const lowerCommand = command.toLowerCase();

    if (
      lowerCommand.includes("excel") ||
      lowerCommand.includes("spreadsheet") ||
      lowerCommand.includes("sheet") ||
      lowerCommand.includes("budget") ||
      lowerCommand.includes("data") ||
      lowerCommand.includes("sales")
    ) {
      apps.push("excel");
    }
    if (
      lowerCommand.includes("word") ||
      lowerCommand.includes("document") ||
      lowerCommand.includes("doc") ||
      lowerCommand.includes("report") ||
      lowerCommand.includes("proposal") ||
      lowerCommand.includes("notes")
    ) {
      apps.push("word");
    }
    if (
      lowerCommand.includes("powerpoint") ||
      lowerCommand.includes("presentation") ||
      lowerCommand.includes("slide") ||
      lowerCommand.includes("ppt")
    ) {
      apps.push("powerpoint");
    }
    if (
      lowerCommand.includes("teams") ||
      lowerCommand.includes("meeting") ||
      lowerCommand.includes("chat") ||
      lowerCommand.includes("schedule")
    ) {
      apps.push("teams");
    }
    if (lowerCommand.includes("onenote") || lowerCommand.includes("note")) {
      apps.push("onenote");
    }
    if (
      lowerCommand.includes("outlook") ||
      lowerCommand.includes("email") ||
      lowerCommand.includes("calendar") ||
      lowerCommand.includes("mail")
    ) {
      apps.push("outlook");
    }

    return apps.length > 0 ? apps : ["excel", "word"];
  };

  const validateAppConnections = (
    requiredApps: string[]
  ): { isValid: boolean; missingApps: string[] } => {
    const missingApps = requiredApps.filter(
      (app) => !connectedApps.includes(app)
    );
    return {
      isValid: missingApps.length === 0,
      missingApps,
    };
  };

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

  const getAppIcon = (appId: string) => {
    const iconProps = { style: { fontSize: "14px", marginRight: "4px" } };
    switch (appId) {
      case "excel":
        return <DocumentTableRegular {...iconProps} />;
      case "word":
        return <DocumentRegular {...iconProps} />;
      case "powerpoint":
        return <SlideTextRegular {...iconProps} />;
      case "onenote":
        return <NotebookRegular {...iconProps} />;
      default:
        return <DocumentRegular {...iconProps} />;
    }
  };

  const executeRealCommand = async (
    command: string,
    detectedApps: string[]
  ): Promise<AICommand> => {
    const account = accounts[0];
    if (!account) throw new Error("No account found");

    console.log("🚀 Executing REAL AI command:", command);

    const response = await instance.acquireTokenSilent({
      ...loginRequest,
      account: account,
    });

    const processor = new RealAICommandProcessor();
    const result = await processor.processCommand({
      command,
      accessToken: response.accessToken,
      connectedApps,
      availableDocuments: documents,
    });

    return {
      id: Date.now().toString(),
      command,
      status: "completed",
      result,
      timestamp: new Date(),
      apps: detectedApps,
    };
  };

  const executeDemoCommand = async (
    command: string,
    apps: string[]
  ): Promise<AICommand> => {
    console.log("🎭 Executing DEMO AI command:", command);

    const processor = new DemoAICommandProcessor(documents);
    const result = await processor.processCommand({
      command,
      apps,
      connectedApps,
    });

    return {
      id: Date.now().toString(),
      command,
      status: "completed",
      result: result.message,
      timestamp: new Date(),
      apps,
      documentsUsed: result.documentsUsed,
      outputFiles: result.outputFiles,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    const detectedApps = detectApps(command);
    const validation = validateAppConnections(detectedApps);

    setValidationError(null);

    if (!validation.isValid) {
      const newCommand: AICommand = {
        id: Date.now().toString(),
        command: command.trim(),
        status: "blocked",
        timestamp: new Date(),
        apps: detectedApps,
        missingApps: validation.missingApps,
        result: `Cannot execute command. Please connect the following apps first: ${validation.missingApps
          .map(getAppDisplayName)
          .join(", ")}`,
      };

      setCommands((prev) => [newCommand, ...prev]);

      setValidationError({
        missingApps: validation.missingApps,
        message: `This command requires ${validation.missingApps
          .map(getAppDisplayName)
          .join(" and ")} to be connected first.`,
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Apps Not Connected</ToastTitle>
        </Toast>,
        { intent: "warning" }
      );

      setCommand("");
      return;
    }

    const newCommand: AICommand = {
      id: Date.now().toString(),
      command: command.trim(),
      status: "processing",
      timestamp: new Date(),
      apps: detectedApps,
    };

    setCommands((prev) => [newCommand, ...prev]);
    setIsProcessing(true);
    setCommand("");

    onCommandExecute?.(newCommand.command, detectedApps);

    try {
      let completedCommand: AICommand;

      if (useRealAPI) {
        // Use real API processor for business accounts with connected apps
        completedCommand = await executeRealCommand(
          newCommand.command,
          detectedApps
        );
        console.log("✅ Real AI command completed:", completedCommand.result);
      } else {
        // Use demo processor for fallback
        completedCommand = await executeDemoCommand(
          newCommand.command,
          detectedApps
        );
        console.log("✅ Demo AI command completed:", completedCommand.result);
      }

      setCommands((prev) =>
        prev.map((cmd) =>
          cmd.id === newCommand.id
            ? { ...cmd, ...completedCommand, id: newCommand.id }
            : cmd
        )
      );

      dispatchToast(
        <Toast>
          <ToastTitle>
            {useRealAPI
              ? "AI Command Completed Successfully"
              : "Demo Command Completed"}
          </ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    } catch (error) {
      console.error("❌ AI command failed:", error);

      let errorMessage = "Unknown error";
      if (error && typeof error === "object" && "message" in error) {
        errorMessage = (error as { message: string }).message;
      }

      setCommands((prev) =>
        prev.map((cmd) =>
          cmd.id === newCommand.id
            ? {
                ...cmd,
                status: "error" as const,
                result: `Failed to execute command: ${errorMessage}`,
              }
            : cmd
        )
      );

      dispatchToast(
        <Toast>
          <ToastTitle>Command Failed</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectMissingApps = () => {
    if (validationError && onRequestConnection) {
      onRequestConnection(validationError.missingApps);
      setValidationError(null);
    }
  };

  const getExampleCommands = () => {
    if (useRealAPI) {
      return [
        "Get my recent emails and create a summary in Word",
        "List my upcoming meetings for today",
        "Create a Teams meeting for tomorrow at 2 PM",
        "Find my recent Excel files and show their contents",
        "Send an email to my team about project status",
        "Schedule a follow-up meeting with yesterday's attendees",
        "Create a Word document with my task list from Planner",
        "Export my calendar events to an Excel spreadsheet",
      ];
    } else {
      return [
        "Extract the budget data from my Excel file and create a summary in Word",
        "Take the sales figures from the Q4 Budget Analysis and create PowerPoint slides",
        "Combine the project status from Word with Excel data to create a comprehensive report",
        "Create meeting notes in OneNote based on the action items in my Word documents",
        "Generate a PowerPoint presentation from the key metrics in my Excel dashboard",
      ];
    }
  };

  return (
    <div style={{ marginBottom: "32px" }}>
      <Toaster />

      {/* AI Command Input */}
      <Card
        style={{
          marginBottom: "24px",
          background: useRealAPI
            ? "linear-gradient(135deg, #0078d4 0%, #106ebe 100%)"
            : "linear-gradient(135deg, #7719AA 0%, #5A1A78 100%)",
        }}
      >
        <CardHeader
          header={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: "white",
              }}
            >
              <BrainCircuitRegular style={{ fontSize: "24px" }} />
              <Text size={500} style={{ color: "white", fontWeight: 600 }}>
                AI Assistant - Cross-App Commands
              </Text>
              <Badge
                color={useRealAPI ? "success" : "severe"}
                size="small"
                style={{
                  backgroundColor: useRealAPI ? "#107C10" : "#E879F9",
                  color: "white",
                }}
              >
                {useRealAPI ? "LIVE API" : "DEMO MODE"}
              </Badge>
            </div>
          }
          description={
            <div>
              <Text
                size={300}
                style={{ color: "rgba(255, 255, 255, 0.8)", display: "block" }}
              >
                {useRealAPI
                  ? "Execute real commands with your Microsoft 365 business account and connected apps"
                  : "Demonstrating AI capabilities with realistic sample documents and workflows"}
              </Text>
              <Text
                size={200}
                style={{
                  color: "rgba(255, 255, 255, 0.7)",
                  display: "block",
                  marginTop: "4px",
                }}
              >
                Connected apps:{" "}
                {connectedApps.map(getAppDisplayName).join(", ") || "None"}
                {!useRealAPI && " • Using demo documents for simulation"}
              </Text>
            </div>
          }
        />
        <CardPreview>
          <form onSubmit={handleSubmit} style={{ padding: "16px" }}>
            <div
              style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}
            >
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder={
                  useRealAPI
                    ? "e.g., Get my recent emails and create a summary in Word"
                    : "e.g., Extract budget data from Excel and create a Word summary with charts"
                }
                disabled={isProcessing}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "none",
                }}
                size="large"
              />
              <Button
                type="submit"
                appearance="secondary"
                disabled={!command.trim() || isProcessing}
                icon={isProcessing ? <Spinner size="tiny" /> : <SendRegular />}
                size="large"
                style={{
                  backgroundColor: "white",
                  color: useRealAPI ? "#0078d4" : "#7719AA",
                  border: "none",
                  minWidth: "120px",
                }}
              >
                {isProcessing ? "Processing..." : "Execute"}
              </Button>
            </div>
          </form>
        </CardPreview>
      </Card>

      {/* Validation Error Message */}
      {validationError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: "32px",
            padding: "24px",
            backgroundColor: "#FDF2F8",
            border: "2px solid #E879F9",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(232, 121, 249, 0.15)",
          }}
        >
          <MessageBar
            intent="warning"
            style={{
              backgroundColor: "transparent",
              border: "none",
              padding: 0,
            }}
          >
            <MessageBarBody>
              <div style={{ padding: "8px 0" }}>
                <MessageBarTitle
                  style={{
                    marginBottom: "16px",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  <WarningRegular
                    style={{
                      fontSize: "20px",
                      marginRight: "8px",
                      verticalAlign: "middle",
                      color: "#E879F9",
                    }}
                  />
                  Apps Required
                </MessageBarTitle>
                <div style={{ marginBottom: "20px" }}>
                  <Text size={400} style={{ lineHeight: "1.5" }}>
                    {validationError.message}
                  </Text>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    padding: "16px 0",
                  }}
                >
                  <Text
                    size={300}
                    style={{ color: "#605E5C", fontWeight: 500 }}
                  >
                    Missing apps:
                  </Text>
                  <div
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    {validationError.missingApps.map((app) => (
                      <Badge
                        key={app}
                        color="severe"
                        size="medium"
                        style={{ padding: "6px 12px" }}
                      >
                        <PlugDisconnectedRegular
                          style={{ fontSize: "14px", marginRight: "6px" }}
                        />
                        {getAppDisplayName(app)}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    appearance="primary"
                    size="medium"
                    onClick={handleConnectMissingApps}
                    style={{
                      marginLeft: "12px",
                      padding: "8px 20px",
                      backgroundColor: "#E879F9",
                      border: "none",
                    }}
                  >
                    Connect Apps
                  </Button>
                </div>
              </div>
            </MessageBarBody>
          </MessageBar>
        </motion.div>
      )}

      {/* Recent Commands Results */}
      {commands.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <Text
            size={400}
            weight="semibold"
            style={{ marginBottom: "16px", display: "block" }}
          >
            Recent Commands
          </Text>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <AnimatePresence>
              {commands.slice(0, 3).map((cmd) => (
                <motion.div
                  key={cmd.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    style={{
                      border:
                        cmd.status === "blocked"
                          ? "2px solid #F7630C"
                          : cmd.status === "completed"
                          ? "2px solid #107C10"
                          : cmd.status === "processing"
                          ? "2px solid #0078D4"
                          : "2px solid #D13438",
                      backgroundColor:
                        cmd.status === "blocked"
                          ? "#FFF4E6"
                          : cmd.status === "completed"
                          ? "#F3F9F1"
                          : cmd.status === "processing"
                          ? "#EDF3FF"
                          : "#FDF2F2",
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
                          <div style={{ marginTop: "4px" }}>
                            {cmd.status === "processing" && (
                              <Spinner size="tiny" />
                            )}
                            {cmd.status === "completed" && (
                              <CheckmarkCircleRegular
                                style={{ color: "#107C10", fontSize: "16px" }}
                              />
                            )}
                            {cmd.status === "error" && (
                              <ErrorCircleRegular
                                style={{ color: "#D13438", fontSize: "16px" }}
                              />
                            )}
                            {cmd.status === "blocked" && (
                              <PlugDisconnectedRegular
                                style={{ color: "#F7630C", fontSize: "16px" }}
                              />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              size={400}
                              weight="semibold"
                              style={{
                                display: "block",
                                marginBottom: "8px",
                              }}
                            >
                              {cmd.command}
                            </Text>

                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                flexWrap: "wrap",
                                marginBottom: "12px",
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
                                  {getAppIcon(app)}
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

                            {cmd.result && (
                              <div
                                style={{
                                  padding: "12px",
                                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                                  borderRadius: "6px",
                                  marginBottom: "12px",
                                }}
                              >
                                <Text
                                  size={300}
                                  style={{
                                    color:
                                      cmd.status === "error"
                                        ? "#D13438"
                                        : cmd.status === "blocked"
                                        ? "#F7630C"
                                        : "#323130",
                                    display: "block",
                                    lineHeight: "1.4",
                                  }}
                                >
                                  {cmd.result}
                                </Text>
                              </div>
                            )}

                            {/* Show documents used in demo mode */}
                            {!useRealAPI &&
                              cmd.documentsUsed &&
                              cmd.documentsUsed.length > 0 && (
                                <div style={{ marginBottom: "12px" }}>
                                  <Text
                                    size={200}
                                    weight="semibold"
                                    style={{
                                      display: "block",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Documents Used:
                                  </Text>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "6px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {cmd.documentsUsed.map((doc, index) => (
                                      <Badge
                                        key={index}
                                        appearance="outline"
                                        size="small"
                                      >
                                        {getAppIcon(doc.type)}
                                        {doc.name} ({doc.action})
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Show output files in demo mode */}
                            {!useRealAPI &&
                              cmd.outputFiles &&
                              cmd.outputFiles.length > 0 && (
                                <div style={{ marginBottom: "12px" }}>
                                  <Text
                                    size={200}
                                    weight="semibold"
                                    style={{
                                      display: "block",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Files Created:
                                  </Text>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "6px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {cmd.outputFiles.map((file, index) => (
                                      <Badge
                                        key={index}
                                        color="success"
                                        size="small"
                                      >
                                        {getAppIcon(file.type)}
                                        {file.name} ({file.size})
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                            <Text size={200} style={{ color: "#8A8886" }}>
                              {cmd.timestamp.toLocaleTimeString()} •{" "}
                              {useRealAPI
                                ? "Real API execution"
                                : "Demo simulation"}
                            </Text>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Example Commands */}
      {commands.length === 0 && (
        <Card
          style={{ backgroundColor: "#f8f9fa", border: "1px solid #e1e5e9" }}
        >
          <CardHeader
            header={
              <Text size={400} weight="semibold">
                {useRealAPI
                  ? "Try these real API commands:"
                  : "Try these demo commands:"}
              </Text>
            }
            description={
              <div style={{ marginTop: "12px" }}>
                {getExampleCommands().map((example, index) => (
                  <div key={index} style={{ marginBottom: "8px" }}>
                    <Button
                      appearance="subtle"
                      size="small"
                      onClick={() => setCommand(example)}
                      style={{
                        textAlign: "left",
                        height: "auto",
                        padding: "8px 12px",
                        whiteSpace: "normal",
                        justifyContent: "flex-start",
                      }}
                    >
                      <Text
                        size={200}
                        style={{ color: useRealAPI ? "#0078d4" : "#7719AA" }}
                      >
                        "{example}"
                      </Text>
                    </Button>
                  </div>
                ))}

                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    backgroundColor: useRealAPI ? "#E6F3FF" : "#E6F3FF",
                    borderRadius: "6px",
                    border: `1px solid ${useRealAPI ? "#B3D9FF" : "#B3D9FF"}`,
                  }}
                >
                  <Text
                    size={200}
                    style={{ color: "#0078D4", fontWeight: 500 }}
                  >
                    {useRealAPI ? (
                      <>
                        🚀 <strong>Live API Mode:</strong> These commands will
                        execute real operations with your Microsoft 365 business
                        account. All actions will be performed on your actual
                        data and services!
                      </>
                    ) : (
                      <>
                        💡 <strong>Demo Mode:</strong> These commands will
                        simulate realistic AI workflows using your demo
                        documents. All features work exactly as they would with
                        real Microsoft 365 data! Try multiple commands to see
                        different scenarios.
                      </>
                    )}
                  </Text>
                </div>
              </div>
            }
          />
        </Card>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};
