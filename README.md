# Samara - Microsoft 365 AI Integration Hub

A modern React prototype that demonstrates advanced Microsoft 365 integration with AI-powered cross-application workflows and intelligent priority management. Samara provides a unified dashboard for managing Office documents with intelligent command processing, seamless app connectivity, and smart priority tracking.

![Samara Logo](https://img.shields.io/badge/Samara-Microsoft%20365%20Hub-0078D4?style=for-the-badge&logo=microsoft&logoColor=white)

## 🌟 Key Features

### 🎯 **Smart Priority Dashboard** ⭐ NEW!

- **Intelligent Priority Detection**: Automatically identifies urgent emails, upcoming meetings, overdue tasks, and recently modified documents
- **Cross-App Aggregation**: Pulls priorities from Outlook, Teams, Planner, Excel, Word, PowerPoint, and OneNote
- **Real-time Collaboration**: See who's working on what with collaborator avatars and activity tracking
- **One-Click Actions**: Open files directly, mark tasks complete, and notify team members
- **Smart Filtering**: Filter by priority level, due date, or overdue status

### 🤖 **AI Command Interface**

- **Natural Language Processing**: Execute complex workflows using plain English commands
- **Cross-App Intelligence**: Seamlessly coordinate actions between Excel, Word, PowerPoint, OneNote, Outlook, and Teams
- **Real-time Validation**: Smart app dependency checking with guided connection prompts
- **Demo Mode**: Realistic simulation with sample documents for testing and demonstration

### 📊 **Interactive App Dashboard**

- **Live Document Previews**: Real-time document summaries and recent activity
- **Expandable Widgets**: Minimize/maximize app views for optimal workspace management
- **Embedded Document Editor**: Edit Word and OneNote documents directly within the dashboard
- **Visual App Highlighting**: Dynamic visual feedback during AI command execution

### 🔗 **Smart App Connectivity**

- **MSAL Authentication**: Secure Microsoft 365 login with proper token management
- **Permission Management**: Granular control over app permissions and access levels
- **Connection Status**: Real-time monitoring of app connectivity and sync status
- **Automatic Reconnection**: Intelligent handling of token refresh and connection recovery

### 🤝 **Advanced Collaboration Features** ⭐ NEW!

- **Team Communication**: Start Teams chats directly from priority items
- **Smart Notifications**: Notify collaborators about task completion, assignments, or document updates
- **Shared Document Tracking**: See who last modified documents and who has access
- **Meeting Integration**: View upcoming meetings with participant lists and join links
- **Task Assignment**: Assign tasks to team members with automatic notifications

### 🎨 **Premium User Experience**

- **Microsoft Fluent UI**: Native Microsoft design system for authentic look and feel
- **Smooth Animations**: Framer Motion for polished interactions and transitions
- **Responsive Design**: Optimized for desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Microsoft 365 account (Business or Personal)
- Azure AD application registration

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd samara
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Azure AD** (See [Setup Guide](#-azure-ad-setup))

   ```typescript
   // src/config/msalConfig.ts
   export const msalConfig: Configuration = {
     auth: {
       clientId: "your-client-id-here", // Replace with your Azure AD app ID
       authority: "https://login.microsoftonline.com/common",
       redirectUri: window.location.origin,
     },
     // ...
   };
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Azure AD Setup

### 1. Create Azure AD App Registration

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure the application:
   - **Name**: Samara - Microsoft 365 Hub
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: Web - `http://localhost:5173`

### 2. Configure Authentication

1. In your app registration, go to **Authentication**
2. Add redirect URIs:
   - `http://localhost:5173` (development)
   - `https://your-domain.com` (production)
3. Enable **Access tokens** and **ID tokens** under "Implicit grant and hybrid flows"

### 3. Set API Permissions

Add the following Microsoft Graph permissions:

- `User.Read` (Delegated)
- `Files.Read` (Delegated)
- `Files.ReadWrite` (Delegated)
- `Sites.Read.All` (Delegated)
- `Mail.Read` (Delegated) ⭐ NEW!
- `Calendars.Read` (Delegated) ⭐ NEW!
- `Tasks.Read` (Delegated) ⭐ NEW!
- `Chat.Read` (Delegated) ⭐ NEW!
- `offline_access` (Delegated)

### 4. Update Configuration

Copy your **Application (client) ID** and update `src/config/msalConfig.ts`:

```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: "your-application-client-id-here",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
  },
  // ...
};
```

## 🏗️ Architecture Overview

### Core Technologies

- **React 19** with TypeScript for type-safe component development
- **Azure MSAL** for Microsoft 365 authentication and token management
- **Microsoft Fluent UI** for consistent design system
- **Framer Motion** for smooth animations and transitions
- **Vite** for fast development and optimized builds

### Project Structure

```
src/
├── components/           # React components
│   ├── AuthenticatedApp.tsx    # Main app wrapper with auth logic
│   ├── PriorityDashboard.tsx   # ⭐ NEW! Smart priority management
│   ├── AICommandInterface.tsx  # AI command input and processing
│   ├── AppDashboard.tsx        # App widgets dashboard
│   ├── AppWidget.tsx           # Individual app widget component
│   ├── EmbeddedDocumentEditor.tsx # In-dashboard document editing
│   ├── AppIntegrationSidebar.tsx  # App connection management
│   ├── SettingsPanel.tsx       # Settings and command history
│   ├── AnalyticsDashboard.tsx  # Analytics and usage insights
│   └── WelcomeScreen.tsx       # Onboarding experience
├── config/               # Configuration files
│   └── msalConfig.ts          # MSAL and Graph API configuration
├── hooks/                # Custom React hooks
│   ├── useGraphData.ts        # Microsoft Graph API integration
│   └── useAnalytics.ts        # ⭐ NEW! Analytics tracking
├── services/             # Business logic services
│   ├── demoAICommands.ts      # Demo mode AI command processor
│   ├── realAICommands.ts      # Real API AI command processor
│   └── analytics.ts           # ⭐ NEW! Analytics service
├── types/                # TypeScript type definitions
│   └── index.ts               # Shared interfaces and types
└── main.tsx             # Application entry point
```

### Key Components

#### `PriorityDashboard.tsx` ⭐ NEW!

Smart priority management interface featuring:

- Cross-app priority aggregation from Outlook, Teams, Planner, and Office documents
- Real-time collaboration tracking with participant information
- One-click file opening and task management
- Team communication integration with Teams and Outlook
- Smart filtering and priority-based sorting

#### `AuthenticatedApp.tsx`

Main application wrapper that handles:

- Authentication state management
- View switching between Priority Dashboard and App Dashboard
- App connection tracking
- Command execution coordination
- UI state management (sidebars, panels, etc.)

#### `AICommandInterface.tsx`

AI command processing interface featuring:

- Natural language command input
- App dependency validation
- Real-time command execution
- Demo mode with realistic simulations

#### `AppDashboard.tsx`

Interactive dashboard that provides:

- Live app widgets with document previews
- Expandable/minimizable app views
- Visual highlighting during AI operations
- App connection management

#### `useGraphData.ts`

Custom hook for Microsoft Graph integration:

- Document fetching from OneDrive/SharePoint
- Priority data aggregation from multiple Microsoft 365 services
- Error handling for different account types
- Demo data fallback for testing
- Real-time sync status monitoring

## 🤖 AI Command Examples

### Excel to Word Operations

```
"Extract the budget data from my Excel file and create a summary in Word"
"Take the sales figures from Q4 Budget Analysis and create a comprehensive report"
```

### Cross-App Workflows

```
"Combine the project status from Word with Excel data to create a PowerPoint presentation"
"Create meeting notes in OneNote based on the action items in my Word documents"
```

### Teams Integration

```
"Schedule a Teams meeting with everyone mentioned in my Excel project tracker"
"Create a Teams workspace for the project with shared documents"
```

### Email Automation

```
"Email the budget summary to my team with the Excel file attached"
"Send personalized updates to stakeholders based on the project report"
```

### Priority Management ⭐ NEW!

```
"Show me all high-priority items due today"
"Mark the budget review task as complete and notify the finance team"
"Start a Teams chat about the client proposal deadline"
```

## 🎯 Demo Mode vs Live Mode

### Demo Mode Features

- **Realistic Sample Documents**: Pre-populated with business-relevant content
- **Simulated AI Processing**: Demonstrates full workflow capabilities
- **Mock Priority Data**: Realistic priority items from all Microsoft 365 apps
- **Collaboration Simulation**: Sample team members and shared documents
- **No API Dependencies**: Works without Microsoft 365 subscription
- **Educational Examples**: Guided command suggestions and explanations

### Live Mode Features

- **Real Document Access**: Direct integration with your Microsoft 365 files
- **Actual Priority Data**: Live emails, meetings, tasks, and document changes
- **Real Collaboration**: Actual team members and shared document tracking
- **Live API Calls**: Real Microsoft Graph API operations
- **Live Synchronization**: Real-time document updates and notifications
- **Production Workflows**: Actual file creation and modification

## 📊 Analytics & Insights ⭐ NEW!

### Comprehensive Analytics System

- **User Engagement Metrics**: Session duration, feature usage, return rates
- **AI Command Analytics**: Command success rates, popular workflows, app usage patterns
- **Collaboration Insights**: Team interaction patterns, document sharing metrics
- **Performance Monitoring**: Load times, error rates, API response times
- **Business Metrics**: Demo-to-live conversion, feature adoption rates

### Privacy & Security

- **Authorized User Access**: Analytics dashboard only available to authorized users
- **Data Minimization**: Only essential metrics collected
- **User Consent**: Clear disclosure and opt-out options
- **Secure Storage**: Local storage with automatic cleanup

## 🔒 Security & Privacy

### Authentication Security

- **OAuth 2.0 Flow**: Industry-standard authentication with Microsoft
- **Token Management**: Secure token storage and automatic refresh
- **Scope-Limited Access**: Minimal required permissions
- **Session Management**: Proper logout and session cleanup

### Data Privacy

- **No Data Storage**: Documents remain in your Microsoft 365 environment
- **Client-Side Processing**: AI commands processed locally when possible
- **Audit Trail**: Command history for transparency and debugging
- **Permission Transparency**: Clear indication of required app permissions

### Collaboration Security

- **Secure Communication**: All team notifications use official Microsoft APIs
- **Permission Respect**: Only notify users who have access to shared items
- **Data Integrity**: No modification of original documents without explicit user action

## 🚀 Deployment

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Production Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Update Azure AD redirect URIs**
   Add your production domain to the Azure AD app registration

3. **Deploy to your hosting platform**

   - Netlify, Vercel, Azure Static Web Apps, etc.
   - Ensure HTTPS is enabled for OAuth security

4. **Environment Configuration**
   Update `msalConfig.ts` with production settings

## 🧪 Testing

### Manual Testing Checklist

- [ ] Authentication flow (login/logout)
- [ ] Priority Dashboard loading and filtering
- [ ] Document opening from priority items
- [ ] Collaboration features (notifications, chat)
- [ ] AI command execution
- [ ] App connection management
- [ ] Document editing functionality
- [ ] Responsive design on different screen sizes

### Demo Scenarios

1. **First-time User**: Experience the welcome flow and demo mode
2. **Business User**: Connect real Microsoft 365 apps and test workflows
3. **Team Collaboration**: Test priority sharing and team notifications
4. **Power User**: Execute complex cross-app AI commands
5. **Mobile User**: Test responsive design and touch interactions

## 🔧 Customization

### Theming

Samara uses Microsoft Fluent UI's theming system. Customize colors and styles in:

```typescript
// src/App.tsx
<FluentProvider theme={webLightTheme}>
  {/* Custom theme configuration */}
</FluentProvider>
```

### Adding New Priority Sources

Extend the Priority Dashboard in `src/components/PriorityDashboard.tsx`:

```typescript
// Add new Microsoft 365 service integration
const fetchNewServicePriorities = async (): Promise<PriorityItem[]> => {
  // Implementation for new service
};
```

### Custom AI Commands

Extend the AI command processor in `src/services/demoAICommands.ts`:

```typescript
// Add new command patterns
if (lowerCommand.includes("your-new-command")) {
  return this.processYourNewCommand(relevantDocs, lowerCommand);
}
```

### Custom App Integrations

Add new Microsoft 365 apps by:

1. Updating the app types in `src/types/index.ts`
2. Adding app configurations in `AppDashboard.tsx`
3. Implementing app-specific logic in the AI command processors

## 📊 Performance Optimization

### Bundle Size Optimization

- **Tree Shaking**: Unused Fluent UI components are automatically removed
- **Code Splitting**: Components are lazy-loaded where appropriate
- **Asset Optimization**: Images and icons are optimized for web delivery

### Runtime Performance

- **Memoization**: React.memo and useMemo for expensive computations
- **Virtual Scrolling**: Efficient rendering of large priority lists
- **Debounced API Calls**: Reduced API requests during user interactions

## 🐛 Troubleshooting

### Common Issues

#### "No documents found" in Live Mode

- **Cause**: No Office documents in OneDrive or insufficient permissions
- **Solution**: Create some Office files or check app permissions in Azure AD

#### Priority Dashboard shows demo data

- **Cause**: Missing Microsoft Graph API permissions or SharePoint Online license
- **Solution**: Add required permissions and ensure Microsoft 365 Business Standard subscription

#### Authentication Errors

- **Cause**: Incorrect Azure AD configuration
- **Solution**: Verify client ID and redirect URIs in Azure portal

#### Collaboration features not working

- **Cause**: Missing permissions for Teams, Mail, or Calendar APIs
- **Solution**: Add required delegated permissions in Azure AD app registration

### Debug Mode

Enable detailed logging by setting:

```typescript
// In browser console
localStorage.setItem("debug", "samara:*");
```

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow the existing TypeScript and React patterns
2. **Component Structure**: Keep components focused and reusable
3. **Type Safety**: Maintain strict TypeScript compliance
4. **Accessibility**: Ensure all interactive elements are keyboard accessible
5. **Performance**: Consider performance impact of new features

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Implement your changes with tests
4. Update documentation as needed
5. Submit a pull request with detailed description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Microsoft Fluent UI Team** for the excellent design system
- **Azure MSAL Team** for robust authentication libraries
- **React Team** for the powerful framework
- **Framer Motion** for smooth animation capabilities

## 📞 Support

For questions, issues, or feature requests:

- Create an issue in the GitHub repository
- Check the Help & Support section in Settings
- Review Microsoft Graph API documentation for integration questions

---

**Built with ❤️ for the Microsoft 365 ecosystem**

_Samara represents the future of integrated productivity workflows, where AI seamlessly connects your favorite Microsoft 365 applications to create powerful, automated business processes with intelligent priority management and team collaboration._

## 🆕 Latest Updates

### Version 2.0 - Priority Dashboard & Collaboration Features

**🎯 New Priority Dashboard**

- Smart priority detection across all Microsoft 365 apps
- Real-time collaboration tracking
- One-click file opening and task management
- Advanced filtering and sorting options

**🤝 Enhanced Collaboration**

- Team communication integration
- Smart notification system
- Shared document tracking
- Meeting and task management

**📊 Advanced Analytics**

- Comprehensive usage tracking
- Performance monitoring
- Business metrics and insights
- Privacy-focused data collection

**🔧 Technical Improvements**

- Enhanced Microsoft Graph API integration
- Improved error handling and fallback systems
- Better SharePoint Online license detection
- Optimized performance and loading times
# samara-prototype-4
