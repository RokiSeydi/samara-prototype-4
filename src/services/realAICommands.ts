import { graphConfig } from "../config/msalConfig";

interface CommandContext {
  command: string;
  accessToken: string;
  connectedApps?: string[];
  availableDocuments?: any[];
}

export class RealAICommandProcessor {
  private async callGraphAPI(
    endpoint: string,
    accessToken: string,
    method = "GET",
    body?: any
  ) {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0${endpoint}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Graph API error: ${response.statusText} - ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    return response.json();
  }

  async processCommand({
    command,
    accessToken,
    connectedApps = [],
    availableDocuments = [],
  }: CommandContext): Promise<string> {
    const lowerCommand = command.toLowerCase();

    console.log("🤖 Processing real AI command:", command);
    console.log("📱 Connected apps:", connectedApps);
    console.log("📄 Available documents:", availableDocuments.length);

    try {
      // EMAIL OPERATIONS
      if (lowerCommand.includes("email") || lowerCommand.includes("mail")) {
        if (
          lowerCommand.includes("recent") ||
          lowerCommand.includes("get") ||
          lowerCommand.includes("show")
        ) {
          return await this.getRecentEmails(accessToken);
        }
        if (
          lowerCommand.includes("send") ||
          lowerCommand.includes("notify") ||
          lowerCommand.includes("team")
        ) {
          return await this.sendEmailToTeam(accessToken, command);
        }
      }

      // CALENDAR OPERATIONS
      if (
        lowerCommand.includes("meeting") ||
        lowerCommand.includes("calendar") ||
        lowerCommand.includes("schedule")
      ) {
        if (
          lowerCommand.includes("upcoming") ||
          lowerCommand.includes("today") ||
          lowerCommand.includes("show")
        ) {
          return await this.getUpcomingMeetings(accessToken);
        }
        if (
          lowerCommand.includes("create") ||
          lowerCommand.includes("schedule") ||
          lowerCommand.includes("teams meeting")
        ) {
          return await this.createTeamsMeeting(accessToken, command);
        }
      }

      // FILE OPERATIONS
      if (
        lowerCommand.includes("files") ||
        lowerCommand.includes("documents") ||
        lowerCommand.includes("excel") ||
        lowerCommand.includes("word")
      ) {
        if (
          lowerCommand.includes("recent") ||
          lowerCommand.includes("find") ||
          lowerCommand.includes("show")
        ) {
          return await this.getRecentFiles(accessToken);
        }
        if (lowerCommand.includes("create") && lowerCommand.includes("word")) {
          return await this.createWordDocument(accessToken, command);
        }
      }

      // TASKS OPERATIONS
      if (
        lowerCommand.includes("task") ||
        lowerCommand.includes("todo") ||
        lowerCommand.includes("planner")
      ) {
        return await this.getTasksFromPlanner(accessToken);
      }

      // TEAMS OPERATIONS
      if (lowerCommand.includes("teams") && !lowerCommand.includes("meeting")) {
        return await this.getTeamsInfo(accessToken);
      }

      // CROSS-APP OPERATIONS
      if (lowerCommand.includes("summary") || lowerCommand.includes("report")) {
        return await this.createCrossAppSummary(accessToken, connectedApps);
      }

      // DEFAULT: Try to understand the intent and provide helpful response
      return await this.handleGenericCommand(
        accessToken,
        command,
        connectedApps
      );
    } catch (error) {
      console.error("❌ Real AI command failed:", error);
      throw new Error(`Failed to execute command: ${error.message}`);
    }
  }

  private async getRecentEmails(accessToken: string): Promise<string> {
    try {
      const emails = await this.callGraphAPI(
        "/me/messages?$top=5&$orderby=receivedDateTime desc",
        accessToken
      );

      if (!emails.value || emails.value.length === 0) {
        return "No recent emails found in your mailbox.";
      }

      const emailSummary = emails.value
        .map((email: any, index: number) => {
          const from = email.from?.emailAddress?.name || "Unknown sender";
          const subject = email.subject || "No subject";
          const received = new Date(
            email.receivedDateTime
          ).toLocaleDateString();
          return `${
            index + 1
          }. From: ${from}\n   Subject: ${subject}\n   Received: ${received}`;
        })
        .join("\n\n");

      return `Here are your 5 most recent emails:\n\n${emailSummary}`;
    } catch (error) {
      throw new Error(`Failed to retrieve emails: ${error.message}`);
    }
  }

  private async sendEmailToTeam(
    accessToken: string,
    command: string
  ): Promise<string> {
    try {
      // Extract email content from command or use default
      const subject = command.includes("status")
        ? "Project Status Update"
        : "Team Notification";
      const body = `This is an automated message sent via Samara AI Assistant.\n\nCommand executed: "${command}"\n\nBest regards,\nYour AI Assistant`;

      // For demo purposes, we'll just simulate sending an email
      // In a real implementation, you would:
      // 1. Parse the command to extract recipients
      // 2. Generate appropriate email content
      // 3. Send via Microsoft Graph API

      return `Email "${subject}" has been prepared and would be sent to your team. In a full implementation, this would:\n\n1. Parse your command to identify recipients\n2. Generate appropriate email content\n3. Send via Microsoft Graph API\n\nCommand: "${command}"`;
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  private async getUpcomingMeetings(accessToken: string): Promise<string> {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const events = await this.callGraphAPI(
        `/me/events?$filter=start/dateTime ge '${today.toISOString()}' and start/dateTime lt '${tomorrow.toISOString()}'&$orderby=start/dateTime&$top=10`,
        accessToken
      );

      if (!events.value || events.value.length === 0) {
        return "No meetings scheduled for today.";
      }

      const meetingSummary = events.value
        .map((event: any, index: number) => {
          const subject = event.subject || "No title";
          const startTime = new Date(event.start.dateTime).toLocaleTimeString();
          const attendees = event.attendees?.length || 0;
          const location = event.location?.displayName || "No location";
          return `${
            index + 1
          }. ${subject}\n   Time: ${startTime}\n   Attendees: ${attendees}\n   Location: ${location}`;
        })
        .join("\n\n");

      return `Here are your meetings for today:\n\n${meetingSummary}`;
    } catch (error) {
      throw new Error(`Failed to retrieve meetings: ${error.message}`);
    }
  }

  private async createTeamsMeeting(
    accessToken: string,
    command: string
  ): Promise<string> {
    try {
      // Extract meeting details from command
      const subject = command.includes("follow-up")
        ? "Follow-up Meeting"
        : "Team Meeting";
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.setDate() + 1);
      tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow

      const endTime = new Date(tomorrow);
      endTime.setHours(15, 0, 0, 0); // 1 hour meeting

      const meetingData = {
        subject: subject,
        start: {
          dateTime: tomorrow.toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: "UTC",
        },
        isOnlineMeeting: true,
        onlineMeetingProvider: "teamsForBusiness",
      };

      const meeting = await this.callGraphAPI(
        "/me/events",
        accessToken,
        "POST",
        meetingData
      );

      return `Teams meeting "${subject}" has been created successfully!\n\nDetails:\n- Date: ${tomorrow.toLocaleDateString()}\n- Time: ${tomorrow.toLocaleTimeString()}\n- Meeting ID: ${
        meeting.id
      }\n- Join URL: ${
        meeting.onlineMeeting?.joinUrl || "Available in calendar"
      }`;
    } catch (error) {
      throw new Error(`Failed to create Teams meeting: ${error.message}`);
    }
  }

  private async getRecentFiles(accessToken: string): Promise<string> {
    try {
      const files = await this.callGraphAPI(
        "/me/drive/recent?$top=5",
        accessToken
      );

      if (!files.value || files.value.length === 0) {
        return "No recent files found in your OneDrive.";
      }

      const fileSummary = files.value
        .map((file: any, index: number) => {
          const name = file.name || "Unknown file";
          const modified = new Date(
            file.lastModifiedDateTime
          ).toLocaleDateString();
          const size = file.size
            ? `${Math.round(file.size / 1024)} KB`
            : "Unknown size";
          return `${
            index + 1
          }. ${name}\n   Modified: ${modified}\n   Size: ${size}`;
        })
        .join("\n\n");

      return `Here are your 5 most recently accessed files:\n\n${fileSummary}`;
    } catch (error) {
      throw new Error(`Failed to retrieve files: ${error.message}`);
    }
  }

  private async createWordDocument(
    accessToken: string,
    command: string
  ): Promise<string> {
    try {
      // Extract document name from command or use default
      const docName = command.includes("summary")
        ? "AI Generated Summary.docx"
        : "New Document.docx";
      const content = `Document created by Samara AI Assistant\n\nCommand: "${command}"\n\nThis document was automatically generated based on your AI command. In a full implementation, this would contain the processed content from your specified sources.\n\nCreated: ${new Date().toLocaleString()}`;

      // Create the document
      const document = await this.callGraphAPI(
        "/me/drive/root/children",
        accessToken,
        "POST",
        {
          name: docName,
          file: {},
          "@microsoft.graph.conflictBehavior": "rename",
        }
      );

      // Add content to the document
      await this.callGraphAPI(
        `/me/drive/items/${document.id}/content`,
        accessToken,
        "PUT",
        content
      );

      return `Word document "${docName}" has been created successfully!\n\nDocument ID: ${document.id}\nLocation: ${document.webUrl}\n\nThe document contains content generated based on your command: "${command}"`;
    } catch (error) {
      throw new Error(`Failed to create Word document: ${error.message}`);
    }
  }

  private async getTasksFromPlanner(accessToken: string): Promise<string> {
    try {
      const tasks = await this.callGraphAPI(
        "/me/planner/tasks?$top=10",
        accessToken
      );

      if (!tasks.value || tasks.value.length === 0) {
        return "No tasks found in Microsoft Planner.";
      }

      const taskSummary = tasks.value
        .map((task: any, index: number) => {
          const title = task.title || "Untitled task";
          const dueDate = task.dueDateTime
            ? new Date(task.dueDateTime).toLocaleDateString()
            : "No due date";
          const progress = task.percentComplete || 0;
          return `${
            index + 1
          }. ${title}\n   Due: ${dueDate}\n   Progress: ${progress}%`;
        })
        .join("\n\n");

      return `Here are your tasks from Microsoft Planner:\n\n${taskSummary}`;
    } catch (error) {
      // Planner API might not be available for all accounts
      return "Unable to access Microsoft Planner tasks. This might be due to permissions or your account type.";
    }
  }

  private async getTeamsInfo(accessToken: string): Promise<string> {
    try {
      const teams = await this.callGraphAPI(
        "/me/joinedTeams?$top=5",
        accessToken
      );

      if (!teams.value || teams.value.length === 0) {
        return "No Teams found or you are not a member of any teams.";
      }

      const teamsSummary = teams.value
        .map((team: any, index: number) => {
          const name = team.displayName || "Unknown team";
          const description = team.description || "No description";
          return `${index + 1}. ${name}\n   Description: ${description}`;
        })
        .join("\n\n");

      return `Here are your Microsoft Teams:\n\n${teamsSummary}`;
    } catch (error) {
      throw new Error(`Failed to retrieve Teams information: ${error.message}`);
    }
  }

  private async createCrossAppSummary(
    accessToken: string,
    connectedApps: string[]
  ): Promise<string> {
    try {
      const summaryParts: string[] = [];

      // Get data from each connected app
      if (connectedApps.includes("outlook")) {
        try {
          const emails = await this.callGraphAPI(
            "/me/messages?$top=3",
            accessToken
          );
          summaryParts.push(
            `📧 Recent Emails: ${emails.value?.length || 0} messages`
          );
        } catch (error) {
          summaryParts.push("📧 Emails: Unable to access");
        }
      }

      if (connectedApps.includes("teams")) {
        try {
          const teams = await this.callGraphAPI(
            "/me/joinedTeams?$top=3",
            accessToken
          );
          summaryParts.push(
            `👥 Teams: Member of ${teams.value?.length || 0} teams`
          );
        } catch (error) {
          summaryParts.push("👥 Teams: Unable to access");
        }
      }

      if (connectedApps.includes("excel") || connectedApps.includes("word")) {
        try {
          const files = await this.callGraphAPI(
            "/me/drive/recent?$top=3",
            accessToken
          );
          summaryParts.push(
            `📄 Recent Files: ${files.value?.length || 0} documents`
          );
        } catch (error) {
          summaryParts.push("📄 Files: Unable to access");
        }
      }

      const summary = summaryParts.join("\n");
      return `Cross-app summary for your Microsoft 365 account:\n\n${summary}\n\nConnected apps: ${connectedApps.join(
        ", "
      )}\nGenerated: ${new Date().toLocaleString()}`;
    } catch (error) {
      throw new Error(`Failed to create cross-app summary: ${error.message}`);
    }
  }

  private async handleGenericCommand(
    accessToken: string,
    command: string,
    connectedApps: string[]
  ): Promise<string> {
    // Try to provide a helpful response based on the command
    const lowerCommand = command.toLowerCase();

    if (
      lowerCommand.includes("help") ||
      lowerCommand.includes("what can you do")
    ) {
      return `I can help you with various Microsoft 365 tasks:\n\n📧 Email: Get recent emails, send notifications\n📅 Calendar: View meetings, schedule Teams meetings\n📄 Files: Access recent documents, create Word documents\n👥 Teams: View team information\n📋 Tasks: Access Planner tasks\n\nConnected apps: ${connectedApps.join(
        ", "
      )}\n\nTry commands like:\n- "Get my recent emails"\n- "Show today's meetings"\n- "Create a Teams meeting for tomorrow"\n- "Find my recent files"`;
    }

    if (lowerCommand.includes("status") || lowerCommand.includes("overview")) {
      return await this.createCrossAppSummary(accessToken, connectedApps);
    }

    // Default response for unrecognized commands
    return `I understand you want to: "${command}"\n\nThis command is not yet fully implemented in the real API processor. Currently supported operations:\n\n✅ Email operations (get recent, send notifications)\n✅ Calendar operations (view meetings, create Teams meetings)\n✅ File operations (recent files, create documents)\n✅ Teams information\n✅ Planner tasks\n\nTry one of the example commands or ask for help to see what I can do!`;
  }
}
