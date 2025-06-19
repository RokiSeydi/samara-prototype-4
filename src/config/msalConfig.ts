import type { Configuration, PopupRequest } from "@azure/msal-browser";

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: "52c720d1-0e02-45a4-a8e2-792a500c8fab", // Replace with your Azure AD app registration client ID
    // authority: "https://login.microsoftonline.com/common",
    authority:
      "https://login.microsoftonline.com/805f4fd4-5f9a-4d09-ba5b-89f0bd790eb1", // Replace with your Azure AD tenant ID
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

// Add scopes for Microsoft Graph API
export const loginRequest: PopupRequest = {
  scopes: [
    "User.Read",
    "Files.Read",
    "Files.ReadWrite",
    "Sites.Read.All",
    "offline_access",
  ],
};

// Graph API endpoint
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphFilesEndpoint: "https://graph.microsoft.com/v1.0/me/drive/root/children",
};
