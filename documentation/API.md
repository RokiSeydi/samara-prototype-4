# Samara API Documentation

This document describes the APIs and integrations used by Samara for Microsoft 365 connectivity and AI command processing.

## 🔐 Authentication APIs

### Microsoft Authentication Library (MSAL)

Samara uses MSAL.js for secure authentication with Microsoft 365.

#### Configuration

```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: "your-client-id-here",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};
```

#### Login Request Scopes

```typescript
export const loginRequest: PopupRequest = {
  scopes: [
    "User.Read", // Basic user profile
    "Files.Read", // Read user files
    "Files.ReadWrite", // Read and write user files
    "Sites.Read.All", // Read SharePoint sites
    "offline_access", // Refresh tokens
  ],
};
```

#### Authentication Methods

##### `instance.loginPopup()`

Initiates popup-based authentication flow.

```typescript
const handleLogin = async () => {
  try {
    const response = await instance.loginPopup(loginRequest);
    console.log("Login successful:", response);
  } catch (error) {
    console.error("Login failed:", error);
  }
};
```

##### `instance.acquireTokenSilent()`

Acquires tokens silently using cached credentials.

```typescript
const getAccessToken = async () => {
  const account = accounts[0];
  try {
    const response = await instance.acquireTokenSilent({
      ...loginRequest,
      account: account,
    });
    return response.accessToken;
  } catch (error) {
    // Handle token acquisition failure
    throw error;
  }
};
```

## 📊 Microsoft Graph API Integration

### Base Configuration

```typescript
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphFilesEndpoint: "https://graph.microsoft.com/v1.0/me/drive/root/children",
};
```

### Document Retrieval APIs

#### Get User Files

Retrieves Office documents from user's OneDrive.

**Endpoint**: `GET /me/drive/root/children`

**Query Parameters**:

- `$top`: Number of items to return (default: 50)
- `$orderby`: Sort order (e.g., 'lastModifiedDateTime desc')
- `$filter`: Filter criteria (e.g., file type filters)

**Example Request**:

```typescript
const getDocuments = async (accessToken: string) => {
  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/drive/root/children?$top=50&$orderby=lastModifiedDateTime desc",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.json();
};
```

**Response Format**:

```json
{
  "value": [
    {
      "id": "01BYE5RZ6QN3ZWBTUFOFD3GSPGOHDJD36K",
      "name": "Budget Analysis.xlsx",
      "lastModifiedDateTime": "2024-01-15T10:30:00Z",
      "size": 2048576,
      "webUrl": "https://onedrive.live.com/...",
      "file": {
        "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    }
  ]
}
```

#### Get User Profile

Retrieves basic user information.

**Endpoint**: `GET /me`

**Example Request**:

```typescript
const getUserProfile = async (accessToken: string) => {
  const response = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
};
```

**Response Format**:

```json
{
  "id": "12345678-1234-1234-1234-123456789012",
  "displayName": "John Doe",
  "mail": "john.doe@company.com",
  "userPrincipalName": "john.doe@company.com"
}
```

### File Operations APIs

#### Read Excel Data

Reads data from Excel workbooks.

**Endpoint**: `GET /me/drive/items/{item-id}/workbook/worksheets`

**Example**:

```typescript
const readExcelData = async (accessToken: string, fileId: string) => {
  // Get worksheets
  const worksheetsResponse = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const worksheets = await worksheetsResponse.json();
  const worksheetId = worksheets.value[0].id;

  // Get range data
  const rangeResponse = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets/${worksheetId}/range(address='A1:Z100')`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return rangeResponse.json();
};
```

#### Create Word Document

Creates new Word documents.

**Endpoint**: `POST /me/drive/root/children`

**Example**:

```typescript
const createWordDocument = async (
  accessToken: string,
  name: string,
  content: string
) => {
  // Create file
  const createResponse = await fetch(
    "https://graph.microsoft.com/v1.0/me/drive/root/children",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        file: {},
        "@microsoft.graph.conflictBehavior": "rename",
      }),
    }
  );

  const file = await createResponse.json();

  // Add content
  await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/content`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: content,
    }
  );

  return file;
};
```

## 🤖 AI Command Processing APIs

### Demo AI Command Processor

The demo processor simulates realistic AI operations without making actual API calls.

#### Interface

```typescript
interface DemoCommandContext {
  command: string;
  apps: string[];
  connectedApps: string[];
}

interface DemoCommandResult {
  message: string;
  documentsUsed: Array<{
    name: string;
    type: string;
    action: string;
  }>;
  outputFiles: Array<{
    name: string;
    type: string;
    size: string;
  }>;
}
```

#### Usage Example

```typescript
const processor = new DemoAICommandProcessor(documents);
const result = await processor.processCommand({
  command: "Extract budget data from Excel and create Word summary",
  apps: ["excel", "word"],
  connectedApps: ["excel", "word"],
});
```

### Real AI Command Processor

The real processor executes actual Microsoft Graph API operations.

#### Excel to Word Data Transfer

```typescript
const processExcelToWord = async (accessToken: string, command: string) => {
  // 1. Get Excel files
  const excelFiles = await callGraphAPI(
    "/me/drive/root/children?$filter=endswith(name,'.xlsx')",
    accessToken
  );

  // 2. Read data from Excel
  const fileId = excelFiles.value[0].id;
  const worksheets = await callGraphAPI(
    `/me/drive/items/${fileId}/workbook/worksheets`,
    accessToken
  );
  const range = await callGraphAPI(
    `/me/drive/items/${fileId}/workbook/worksheets/${worksheets.value[0].id}/range(address='A:A')`,
    accessToken
  );

  // 3. Extract and process data
  const names = range.values
    .flat()
    .filter((cell) => cell && typeof cell === "string");

  // 4. Create Word document
  const wordDoc = await callGraphAPI(
    "/me/drive/root/children",
    accessToken,
    "POST",
    {
      name: "Extracted Names.docx",
      file: {},
      "@microsoft.graph.conflictBehavior": "rename",
    }
  );

  // 5. Add content to Word document
  const bulletPoints = names.map((name) => `• ${name}`).join("\n");
  await callGraphAPI(
    `/me/drive/items/${wordDoc.id}/content`,
    accessToken,
    "PUT",
    bulletPoints
  );

  return `Successfully extracted ${names.length} names and created Word document.`;
};
```

## 📧 Teams and Outlook Integration

### Schedule Teams Meeting

```typescript
const scheduleTeamsMeeting = async (
  accessToken: string,
  subject: string,
  attendees: string[]
) => {
  const meeting = await fetch("https://graph.microsoft.com/v1.0/me/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: subject,
      start: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(
          Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000
        ).toISOString(),
        timeZone: "UTC",
      },
      attendees: attendees.map((email) => ({
        emailAddress: { address: email, name: email },
      })),
      isOnlineMeeting: true,
      onlineMeetingProvider: "teamsForBusiness",
    }),
  });

  return meeting.json();
};
```

### Send Email

```typescript
const sendEmail = async (
  accessToken: string,
  to: string[],
  subject: string,
  body: string
) => {
  const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: subject,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: to.map((email) => ({
          emailAddress: { address: email },
        })),
      },
    }),
  });

  return response.status === 202; // Accepted
};
```

## 🔄 Custom Hooks API

### useGraphData Hook

Custom hook for managing Microsoft Graph data with error handling and demo fallback.

#### Interface

```typescript
interface UseGraphDataReturn {
  documents: OfficeDocument[];
  loading: boolean;
  error: string | null;
  accountType: "personal" | "business" | "unknown";
  refetch: () => Promise<void>;
}
```

#### Usage

```typescript
const { documents, loading, error, accountType } = useGraphData();

useEffect(() => {
  if (error === "SUBSCRIPTION_REQUIRED") {
    // Handle subscription requirement
    console.log("Demo mode active - subscription required");
  }
}, [error]);
```

#### Error Codes

- `SUBSCRIPTION_REQUIRED`: User needs Microsoft 365 subscription
- `PERMISSIONS_REQUIRED`: Additional permissions needed
- `NO_DOCUMENTS_FOUND`: No Office documents in OneDrive
- `API_ERROR`: General API communication error

## 🛡️ Error Handling

### API Error Response Format

```typescript
interface GraphError {
  error: {
    code: string;
    message: string;
    innerError?: {
      code: string;
      message: string;
    };
  };
}
```

### Common Error Codes

- `BadRequest`: Invalid request parameters
- `Unauthorized`: Invalid or expired token
- `Forbidden`: Insufficient permissions
- `NotFound`: Resource not found
- `TooManyRequests`: Rate limit exceeded

### Error Handling Pattern

```typescript
const callGraphAPI = async (endpoint: string, accessToken: string) => {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0${endpoint}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Graph API Error: ${errorData.error.message}`);
    }

    return response.json();
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
};
```

## 📊 Rate Limiting

### Microsoft Graph Rate Limits

- **Per app per tenant**: 10,000 requests per 10 minutes
- **Per user per app**: 1,000 requests per 10 minutes
- **Large file uploads**: Special limits apply

### Rate Limit Handling

```typescript
const handleRateLimit = async (response: Response) => {
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

    await new Promise((resolve) => setTimeout(resolve, delay));
    // Retry the request
  }
};
```

## 🔍 Debugging APIs

### Enable Debug Logging

```typescript
// In browser console
localStorage.setItem("debug", "msal:*");

// Or in code
const msalConfig = {
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (!containsPii) {
          console.log(message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Verbose,
    },
  },
};
```

### API Response Inspection

```typescript
const debugGraphCall = async (endpoint: string, accessToken: string) => {
  console.log(`Calling: ${endpoint}`);

  const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  console.log(`Response status: ${response.status}`);
  console.log(`Response headers:`, Object.fromEntries(response.headers));

  const data = await response.json();
  console.log(`Response data:`, data);

  return data;
};
```

---

This API documentation provides comprehensive coverage of all external integrations and internal APIs used by Samara, enabling developers to understand and extend the system's capabilities.
