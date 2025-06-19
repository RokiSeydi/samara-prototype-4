import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { msalConfig } from "./config/msalConfig";
import { AuthenticatedApp } from "./components/AuthenticatedApp";

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

await msalInstance.initialize();

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <FluentProvider theme={webLightTheme}>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#FAF9F8",
            fontFamily: "Segoe UI, system-ui, sans-serif",
          }}
        >
          <AuthenticatedApp />
        </div>
      </FluentProvider>
    </MsalProvider>
  );
}

export default App;
