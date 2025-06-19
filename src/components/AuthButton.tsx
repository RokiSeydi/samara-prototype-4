import React from "react";
import { useMsal } from "@azure/msal-react";
import { Button } from "@fluentui/react-components";
import { SignOutRegular } from "@fluentui/react-icons";

export const AuthButton: React.FC = () => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = accounts.length > 0;

  const handleLogout = () => {
    instance.logoutPopup();
  };

  // Only show sign out button when authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "14px", color: "#323130" }}>
        Welcome, {accounts[0].name}
      </span>
      <Button
        appearance="subtle"
        icon={<SignOutRegular />}
        onClick={handleLogout}
      >
        Sign Out
      </Button>
    </div>
  );
};
