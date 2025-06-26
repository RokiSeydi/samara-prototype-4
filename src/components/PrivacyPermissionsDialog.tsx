import React, { useState } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Text,
  Card,
  Badge,
  Divider,
} from "@fluentui/react-components";
import {
  ShieldCheckmarkRegular,
  LockClosedRegular,
  DocumentRegular,
  MailRegular,
  ShareRegular,
  CloudSyncRegular,
  InfoRegular,
  EyeRegular,
  DismissRegular,
  PersonRegular,
  CheckmarkCircleRegular,
} from "@fluentui/react-icons";
import { motion } from "framer-motion";

interface PrivacyPermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToSignIn: () => void;
  onTryDemo: () => void;
}

export const PrivacyPermissionsDialog: React.FC<
  PrivacyPermissionsDialogProps
> = ({ isOpen, onClose, onProceedToSignIn, onTryDemo }) => {
  const [currentSection, setCurrentSection] = useState<
    "overview" | "permissions" | "security"
  >("overview");

  const permissionItems = [
    {
      icon: <DocumentRegular style={{ fontSize: "20px", color: "#107C41" }} />,
      title: "Reading & Editing Files",
      description: "Access your Excel, Word, PowerPoint, and OneNote files",
      details: [
        "Merge or compare Excel spreadsheets",
        "Edit Word documents directly in Samara",
        "Auto-generate or update reports from existing documents",
        "Create new documents and save them to your OneDrive",
      ],
      technical: "Files.Read, Files.ReadWrite permissions",
    },
    {
      icon: <MailRegular style={{ fontSize: "20px", color: "#0078D4" }} />,
      title: "Sending Emails as You",
      description: "Send documents and summaries directly through your Outlook",
      details: [
        "Share merged files or auto-generated summaries with your team",
        "Keep your workflow seamless without copying/pasting into Outlook",
        "Send professional emails with proper document links",
        "Maintain your email signature and formatting",
      ],
      technical: "Mail.Send permission",
    },
    {
      icon: <ShareRegular style={{ fontSize: "20px", color: "#6264A7" }} />,
      title: "Reading Site Collections",
      description: "Access documents from SharePoint and shared workspaces",
      details: [
        "Pull in documents from across your SharePoint sites",
        "Maintain full visibility when working across teams or departments",
        "Access shared team documents and collaborative workspaces",
        "Integrate with your organization's document libraries",
      ],
      technical: "Sites.Read.All permission",
    },
    {
      icon: <CloudSyncRegular style={{ fontSize: "20px", color: "#7719AA" }} />,
      title: "Persistent Access",
      description:
        "Keep your work synced even when you're not actively using Samara",
      details: [
        "Let automations run in the background as expected",
        "Maintain real-time sync with your Microsoft 365 data",
        "Enable seamless workflow continuity",
        "Support for scheduled tasks and notifications",
      ],
      technical: "offline_access permission",
    },
  ];

  const securityFeatures = [
    {
      icon: (
        <LockClosedRegular style={{ fontSize: "18px", color: "#107C10" }} />
      ),
      title: "Zero Data Storage",
      description:
        "Samara never stores or exports your files. All data remains in your Microsoft 365 environment.",
    },
    {
      icon: (
        <ShieldCheckmarkRegular
          style={{ fontSize: "18px", color: "#0078D4" }}
        />
      ),
      title: "Microsoft Security",
      description:
        "All actions follow Microsoft's security policies and use official Microsoft Graph APIs.",
    },
    {
      icon: (
        <CheckmarkCircleRegular
          style={{ fontSize: "18px", color: "#6264A7" }}
        />
      ),
      title: "Audit Trail Only",
      description:
        "We only store metadata for audit trails - never your actual document content or sensitive data.",
    },
    {
      icon: <PersonRegular style={{ fontSize: "18px", color: "#D24726" }} />,
      title: "Your Control",
      description:
        "You can revoke permissions at any time through your Microsoft 365 admin panel.",
    },
  ];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(event, data) => !data.open && onClose()}
    >
      <DialogSurface
        style={{ maxWidth: "700px", width: "90vw", maxHeight: "90vh" }}
      >
        <DialogTitle>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ShieldCheckmarkRegular
              style={{ fontSize: "28px", color: "#0078D4" }}
            />
            <div>
              <Text size={600} weight="semibold">
                Privacy & Permissions
              </Text>
              <Text size={300} style={{ color: "#605E5C", display: "block" }}>
                Understanding what Samara needs and how we protect your data
              </Text>
            </div>
          </div>
        </DialogTitle>

        <DialogContent style={{ padding: "0 24px" }}>
          {/* Navigation Tabs */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "24px",
              borderBottom: "1px solid #E1DFDD",
              paddingBottom: "12px",
            }}
          >
            <Button
              appearance={currentSection === "overview" ? "primary" : "subtle"}
              size="small"
              onClick={() => setCurrentSection("overview")}
            >
              Overview
            </Button>
            <Button
              appearance={
                currentSection === "permissions" ? "primary" : "subtle"
              }
              size="small"
              onClick={() => setCurrentSection("permissions")}
            >
              Permissions
            </Button>
            <Button
              appearance={currentSection === "security" ? "primary" : "subtle"}
              size="small"
              onClick={() => setCurrentSection("security")}
            >
              Security
            </Button>
          </div>

          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            {/* Overview Section */}
            {currentSection === "overview" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ marginBottom: "24px" }}>
                  <Text
                    size={500}
                    weight="semibold"
                    style={{ display: "block", marginBottom: "12px" }}
                  >
                    Why Samara Needs These Permissions
                  </Text>
                  <Text
                    size={400}
                    style={{ lineHeight: "1.6", color: "#323130" }}
                  >
                    Samara helps you automate and streamline your work within
                    your existing Microsoft 365 tools.
                    <strong> We don't store any of your data</strong>—everything
                    stays in your Microsoft environment.
                  </Text>
                </div>

                <Card
                  style={{
                    padding: "20px",
                    backgroundColor: "#E6F3FF",
                    border: "2px solid #C7E0F4",
                    marginBottom: "24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <InfoRegular
                      style={{ fontSize: "20px", color: "#0078D4" }}
                    />
                    <Text
                      size={400}
                      weight="semibold"
                      style={{ color: "#0078D4" }}
                    >
                      What happens when you click "Sign in with Microsoft"
                    </Text>
                  </div>
                  <Text
                    size={300}
                    style={{ lineHeight: "1.5", color: "#323130" }}
                  >
                    You'll be redirected to Microsoft's secure login page where
                    you can review and approve the specific permissions Samara
                    needs. You're always in control and can revoke these
                    permissions at any time through your Microsoft 365 settings.
                  </Text>
                </Card>

                <div style={{ marginBottom: "24px" }}>
                  <Text
                    size={400}
                    weight="semibold"
                    style={{ display: "block", marginBottom: "16px" }}
                  >
                    Quick Permission Summary:
                  </Text>

                  <div style={{ display: "grid", gap: "12px" }}>
                    {permissionItems.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          backgroundColor: "#F8F9FA",
                          borderRadius: "6px",
                          border: "1px solid #E1DFDD",
                        }}
                      >
                        {item.icon}
                        <div style={{ flex: 1 }}>
                          <Text
                            size={300}
                            weight="semibold"
                            style={{ display: "block" }}
                          >
                            {item.title}
                          </Text>
                          <Text size={200} style={{ color: "#605E5C" }}>
                            {item.description}
                          </Text>
                        </div>
                        <CheckmarkCircleRegular
                          style={{ fontSize: "16px", color: "#107C10" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Card
                  style={{
                    padding: "16px",
                    backgroundColor: "#F3F9F1",
                    border: "2px solid #C4E7C7",
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
                    <LockClosedRegular
                      style={{ fontSize: "18px", color: "#107C10" }}
                    />
                    <Text
                      size={400}
                      weight="semibold"
                      style={{ color: "#107C10" }}
                    >
                      Your Data Security Promise
                    </Text>
                  </div>
                  <Text
                    size={300}
                    style={{ lineHeight: "1.5", color: "#323130" }}
                  >
                    <strong>Samara never stores or exports your files.</strong>{" "}
                    All actions happen within your Microsoft 365 account and
                    follow Microsoft's security policies. We only keep metadata
                    for audit trails—never your actual document content.
                  </Text>
                </Card>
              </motion.div>
            )}

            {/* Permissions Section */}
            {currentSection === "permissions" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Text
                  size={500}
                  weight="semibold"
                  style={{ display: "block", marginBottom: "16px" }}
                >
                  Detailed Permission Breakdown
                </Text>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {permissionItems.map((item, index) => (
                    <Card
                      key={index}
                      style={{ padding: "20px", border: "1px solid #E1DFDD" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "16px",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px",
                            borderRadius: "8px",
                            backgroundColor: `${item.icon.props.style.color}15`,
                          }}
                        >
                          {item.icon}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: "8px",
                            }}
                          >
                            <Text size={400} weight="semibold">
                              {item.title}
                            </Text>
                            <Badge appearance="outline" size="small">
                              Required
                            </Badge>
                          </div>

                          <Text
                            size={300}
                            style={{ color: "#605E5C", marginBottom: "12px" }}
                          >
                            {item.description}
                          </Text>

                          <Text
                            size={300}
                            weight="semibold"
                            style={{ marginBottom: "8px", display: "block" }}
                          >
                            So you can:
                          </Text>

                          <ul style={{ margin: 0, paddingLeft: "20px" }}>
                            {item.details.map((detail, detailIndex) => (
                              <li
                                key={detailIndex}
                                style={{ marginBottom: "4px" }}
                              >
                                <Text size={300} style={{ color: "#323130" }}>
                                  {detail}
                                </Text>
                              </li>
                            ))}
                          </ul>

                          <div
                            style={{
                              marginTop: "12px",
                              padding: "8px 12px",
                              backgroundColor: "#F8F9FA",
                              borderRadius: "4px",
                            }}
                          >
                            <Text
                              size={200}
                              style={{
                                color: "#8A8886",
                                fontFamily: "monospace",
                              }}
                            >
                              Technical: {item.technical}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Security Section */}
            {currentSection === "security" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Text
                  size={500}
                  weight="semibold"
                  style={{ display: "block", marginBottom: "16px" }}
                >
                  How We Protect Your Data
                </Text>

                <div
                  style={{ display: "grid", gap: "16px", marginBottom: "24px" }}
                >
                  {securityFeatures.map((feature, index) => (
                    <Card
                      key={index}
                      style={{
                        padding: "16px",
                        border: "1px solid #E1DFDD",
                        backgroundColor: "#FAFAFA",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <div style={{ marginTop: "2px" }}>{feature.icon}</div>
                        <div>
                          <Text
                            size={400}
                            weight="semibold"
                            style={{ display: "block", marginBottom: "4px" }}
                          >
                            {feature.title}
                          </Text>
                          <Text
                            size={300}
                            style={{ color: "#605E5C", lineHeight: "1.5" }}
                          >
                            {feature.description}
                          </Text>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card
                  style={{
                    padding: "20px",
                    backgroundColor: "#FFF4E6",
                    border: "2px solid #F7E600",
                  }}
                >
                  <Text
                    size={400}
                    weight="semibold"
                    style={{ display: "block", marginBottom: "12px" }}
                  >
                    🏢 Perfect for Regulated Industries
                  </Text>
                  <Text
                    size={300}
                    style={{ lineHeight: "1.6", color: "#323130" }}
                  >
                    Samara is designed for heavily compliant sectors including
                    healthcare, finance, and government. We understand your data
                    governance requirements:
                  </Text>
                  <ul style={{ margin: "12px 0 0 20px", padding: 0 }}>
                    <li style={{ marginBottom: "4px" }}>
                      <Text size={300}>
                        ✅ <strong>No data exfiltration</strong> - everything
                        stays in your Microsoft tenant
                      </Text>
                    </li>
                    <li style={{ marginBottom: "4px" }}>
                      <Text size={300}>
                        ✅ <strong>Audit compliance</strong> - full activity
                        logging through Microsoft
                      </Text>
                    </li>
                    <li style={{ marginBottom: "4px" }}>
                      <Text size={300}>
                        ✅ <strong>Zero third-party storage</strong> - no
                        external databases or file systems
                      </Text>
                    </li>
                    <li style={{ marginBottom: "4px" }}>
                      <Text size={300}>
                        ✅ <strong>Microsoft security standards</strong> -
                        inherits your organization's policies
                      </Text>
                    </li>
                  </ul>
                </Card>

                <Divider style={{ margin: "24px 0" }} />

                <div style={{ textAlign: "center" }}>
                  <Text size={300} style={{ color: "#605E5C" }}>
                    Questions about our security practices?
                  </Text>
                  <br />
                  <Text size={300} style={{ color: "#0078D4" }}>
                    📧 Contact us at: <strong>security@samara.ai</strong>
                  </Text>
                </div>
              </motion.div>
            )}
          </div>
        </DialogContent>

        <DialogActions style={{ padding: "16px 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", gap: "12px" }}>
              <Button
                appearance="secondary"
                onClick={onTryDemo}
                icon={<EyeRegular />}
              >
                Try Demo First
              </Button>
              <Button
                appearance="subtle"
                onClick={onClose}
                icon={<DismissRegular />}
              >
                Cancel
              </Button>
            </div>

            <Button
              appearance="primary"
              onClick={onProceedToSignIn}
              icon={<PersonRegular />}
              style={{
                backgroundColor: "#0078D4",
                border: "none",
                padding: "12px 24px",
              }}
            >
              I Understand - Sign In with Microsoft
            </Button>
          </div>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};
