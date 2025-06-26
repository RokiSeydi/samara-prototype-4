import React, { useState } from "react";
import { Text, Button } from "@fluentui/react-components";
import {
  CloudRegular,
  DocumentRegular,
  PeopleRegular,
  PersonRegular,
  EyeRegular,
} from "@fluentui/react-icons";
import { motion } from "framer-motion";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "../config/msalConfig";
import { PrivacyPermissionsDialog } from "./PrivacyPermissionsDialog";

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onStartDemo: () => void; // NEW: Demo mode handler
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onStartDemo,
}) => {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const handleSignInClick = () => {
    // Show privacy dialog before proceeding to sign in
    setShowPrivacyDialog(true);
  };

  const handleProceedToSignIn = async () => {
    setShowPrivacyDialog(false);

    try {
      await instance.loginPopup(loginRequest);
      // After successful login, automatically proceed to the main app
      setTimeout(() => {
        onGetStarted();
      }, 500);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleTryDemo = () => {
    setShowPrivacyDialog(false);
    // NEW: Start demo mode directly without authentication
    onStartDemo();
  };

  const handleTryDemoFromButton = () => {
    // NEW: Direct demo mode from button (no privacy dialog needed)
    console.log("🎭 Starting demo mode directly");
    onStartDemo();
  };

  const handleClosePrivacyDialog = () => {
    setShowPrivacyDialog(false);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* SAMARA Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            <Text
              size={900}
              weight="semibold"
              style={{
                color: "#0078D4",
                letterSpacing: "4px",
                fontFamily: "Segoe UI, system-ui, sans-serif",
                display: "block",
                fontSize: "64px",
                marginBottom: "8px",
              }}
            >
              SAMARA
            </Text>
            <div
              style={{
                width: "120px",
                height: "3px",
                backgroundColor: "#0078D4",
                margin: "0 auto",
                borderRadius: "2px",
              }}
            />
          </motion.div>

          <div style={{ marginBottom: "32px" }}>
            <CloudRegular style={{ fontSize: "64px", color: "#0078D4" }} />
          </div>

          <Text
            size={800}
            weight="semibold"
            style={{
              display: "block",
              marginBottom: "16px",
              color: "#323130",
            }}
          >
            Microsoft 365 Integration Hub
          </Text>

          <Text
            size={400}
            style={{
              display: "block",
              marginBottom: "48px",
              color: "#605E5C",
              maxWidth: "600px",
              lineHeight: "1.5",
            }}
          >
            Connect your Microsoft 365 apps and get a bird's eye view of all
            your documents. Zoom in to see details, zoom out for the big
            picture, and seamlessly access your Excel, Word, PowerPoint, and
            OneNote files.
          </Text>

          <div
            style={{
              display: "flex",
              gap: "32px",
              justifyContent: "center",
              marginBottom: "48px",
              flexWrap: "wrap",
            }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "24px",
                backgroundColor: "#F3F2F1",
                borderRadius: "8px",
                minWidth: "150px",
              }}
            >
              <DocumentRegular
                style={{
                  fontSize: "32px",
                  color: "#0078D4",
                  marginBottom: "8px",
                }}
              />
              <Text size={300} weight="semibold">
                Smart Document View
              </Text>
              <Text size={200} style={{ color: "#605E5C", marginTop: "4px" }}>
                Intelligent summaries and previews
              </Text>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "24px",
                backgroundColor: "#F3F2F1",
                borderRadius: "8px",
                minWidth: "150px",
              }}
            >
              <PeopleRegular
                style={{
                  fontSize: "32px",
                  color: "#0078D4",
                  marginBottom: "8px",
                }}
              />
              <Text size={300} weight="semibold">
                Seamless Integration
              </Text>
              <Text size={200} style={{ color: "#605E5C", marginTop: "4px" }}>
                Direct access to Microsoft 365
              </Text>
            </motion.div>
          </div>

          {/* Action Buttons */}
          {!isAuthenticated ? (
            <div
              style={{
                display: "flex",
                gap: "16px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  appearance="primary"
                  size="large"
                  icon={<PersonRegular />}
                  onClick={handleSignInClick}
                  style={{
                    fontSize: "16px",
                    padding: "16px 32px",
                    background:
                      "linear-gradient(135deg, #0078d4 0%, #106ebe 100%)",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0, 120, 212, 0.3)",
                  }}
                >
                  Sign In with Microsoft 365
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  appearance="secondary"
                  size="large"
                  icon={<EyeRegular />}
                  onClick={handleTryDemoFromButton}
                  style={{
                    fontSize: "16px",
                    padding: "16px 32px",
                    borderColor: "#7719AA",
                    color: "#7719AA",
                    background:
                      "linear-gradient(135deg, #F0F9FF 0%, #E6F3FF 100%)",
                  }}
                >
                  Try Demo First
                </Button>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                appearance="primary"
                size="large"
                onClick={onGetStarted}
                style={{
                  fontSize: "16px",
                  padding: "16px 40px",
                  background:
                    "linear-gradient(135deg, #107C10 0%, #0B5A0B 100%)",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(16, 124, 16, 0.3)",
                }}
              >
                Access Your Apps & Documents
              </Button>
            </motion.div>
          )}

          {/* Progress Indicator */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ marginTop: "24px" }}
            >
              <Text
                size={300}
                style={{
                  color: "#107C10",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                ✓ Successfully connected to Microsoft 365
              </Text>
            </motion.div>
          )}

          {/* Privacy Notice */}
          <div
            style={{
              marginTop: "48px",
              padding: "16px",
              backgroundColor: "#F8F9FA",
              borderRadius: "8px",
              border: "1px solid #E1DFDD",
              maxWidth: "500px",
              marginLeft: "auto",
              marginRight: "auto",
              textAlign: "center", // Optional: center the text as well
            }}
          >
            <Text size={300} style={{ color: "#605E5C", lineHeight: "1.5" }}>
              <strong>Privacy First:</strong> Samara never stores your data.
              Everything stays in your Microsoft 365 environment. We only keep
              metadata for audit trails—never your actual documents or sensitive
              information.
            </Text>
          </div>

          {/* NEW: Demo Mode Benefits */}
          {/* <div
            style={{
              marginTop: "24px",
              padding: "16px",
              backgroundColor: "#F0F9FF",
              borderRadius: "8px",
              border: "1px solid #7719AA",
              maxWidth: "500px",
            }}
          >
            <Text size={300} style={{ color: "#7719AA", lineHeight: "1.5" }}>
              🎭 <strong>Try Demo Mode:</strong> Explore all features with
              realistic sample data. No sign-in required! See how Samara works
              with your workflow before connecting your real Microsoft 365
              account.
            </Text>
          </div> */}
        </motion.div>
      </div>

      {/* Privacy & Permissions Dialog */}
      <PrivacyPermissionsDialog
        isOpen={showPrivacyDialog}
        onClose={handleClosePrivacyDialog}
        onProceedToSignIn={handleProceedToSignIn}
        onTryDemo={handleTryDemo}
      />
    </>
  );
};
