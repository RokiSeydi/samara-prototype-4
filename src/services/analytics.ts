export interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

export interface UserMetrics {
  userId: string;
  sessionId: string;
  accountType: "personal" | "business" | "unknown";
  connectedApps: string[];
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  averageSessionDuration: number;
  documentsAccessed: number;
  featuresUsed: string[];
}

export interface UsageMetrics {
  // User Engagement
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
  returnUserRate: number;

  // Feature Usage
  aiCommandsPerSession: number;
  mostUsedCommands: Array<{ command: string; count: number }>;
  appConnectionRate: number;
  documentEditingRate: number;

  // Performance
  averageLoadTime: number;
  errorRate: number;
  apiResponseTimes: number;

  // Business Metrics
  demoToLiveConversionRate: number;
  featureAdoptionRate: Record<string, number>;
  userRetentionRate: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private userEmail?: string;
  private sessionStartTime: Date;
  private isEnabled: boolean;
  private isAuthorizedUser: boolean = false;

  // Authorized user configuration
  private readonly AUTHORIZED_USER = {
    name: "Roki Seydi",
    email: "roky.seydi@gmail.com",
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
    this.isEnabled =
      process.env.NODE_ENV === "production" ||
      localStorage.getItem("analytics-debug") === "true";

    // Track page visibility for session duration
    this.setupVisibilityTracking();

    // Track session end
    this.setupSessionEndTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupVisibilityTracking() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.track("session_hidden", {
          duration: Date.now() - this.sessionStartTime.getTime(),
        });
      } else {
        this.track("session_visible", {});
      }
    });
  }

  private setupSessionEndTracking() {
    window.addEventListener("beforeunload", () => {
      this.endSession();
    });
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.track("user_identified", { userId });
  }

  setUserInfo(userInfo: {
    displayName?: string;
    mail?: string;
    userPrincipalName?: string;
  }) {
    // Check if this is the authorized user
    const email = userInfo.mail || userInfo.userPrincipalName || "";
    const name = userInfo.displayName || "";

    this.userEmail = email;
    this.isAuthorizedUser =
      email.toLowerCase() === this.AUTHORIZED_USER.email.toLowerCase() ||
      name.toLowerCase().includes(this.AUTHORIZED_USER.name.toLowerCase());

    if (this.isAuthorizedUser) {
      console.log("🔐 Analytics enabled for authorized user:", name);
      this.track("authorized_user_session", {
        userName: name,
        userEmail: email,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Check if analytics should be active
  isAnalyticsEnabled(): boolean {
    return this.isEnabled && this.isAuthorizedUser;
  }

  // Check if user is authorized to view analytics dashboard
  canViewAnalytics(): boolean {
    return this.isAuthorizedUser;
  }

  track(event: string, properties: Record<string, unknown> = {}) {
    // Always track basic events for functionality, but only store/send detailed analytics for authorized user
    const shouldTrackDetailed = this.isAnalyticsEnabled();

    if (!this.isEnabled && !shouldTrackDetailed) {
      console.log("Analytics (Disabled):", event, properties);
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        sessionDuration: Date.now() - this.sessionStartTime.getTime(),
        isAuthorizedUser: this.isAuthorizedUser,
      },
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    // Always store events locally for functionality
    this.events.push(analyticsEvent);

    // Only send detailed analytics for authorized user
    if (shouldTrackDetailed) {
      this.sendToAnalyticsService(analyticsEvent);
      this.storeLocally(analyticsEvent);
      console.log("📊 Analytics (Authorized):", event, properties);
    } else {
      console.log("📊 Analytics (Basic):", event);
    }
  }

  private async sendToAnalyticsService(event: AnalyticsEvent) {
    // Only send analytics for authorized user
    if (!this.isAuthorizedUser) return;

    // Example implementations for different analytics services

    // Google Analytics 4
    if (window.gtag) {
      window.gtag("event", event.event, {
        custom_parameter_1: JSON.stringify(event.properties),
        session_id: event.sessionId,
        user_id: event.userId,
        authorized_user: this.isAuthorizedUser,
      });
    }

    // Mixpanel
    if (window.mixpanel) {
      window.mixpanel.track(event.event, {
        ...event.properties,
        $session_id: event.sessionId,
        $user_id: event.userId,
        authorized_user: this.isAuthorizedUser,
      });
    }

    // PostHog
    if (window.posthog) {
      window.posthog.capture(event.event, {
        ...event.properties,
        $session_id: event.sessionId,
        authorized_user: this.isAuthorizedUser,
      });
    }

    // Custom analytics endpoint
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...event,
          authorizedUser: this.isAuthorizedUser,
          userEmail: this.userEmail,
        }),
      });
    } catch (error) {
      console.warn("Failed to send analytics event:", error);
    }
  }

  private storeLocally(event: AnalyticsEvent) {
    // Only store detailed analytics for authorized user
    if (!this.isAuthorizedUser) return;

    const stored = JSON.parse(localStorage.getItem("samara_analytics") || "[]");
    stored.push(event);

    // Keep only last 100 events locally
    if (stored.length > 100) {
      stored.splice(0, stored.length - 100);
    }

    localStorage.setItem("samara_analytics", JSON.stringify(stored));
  }

  // User Journey Tracking
  trackUserJourney(step: string, metadata: Record<string, unknown> = {}) {
    this.track("user_journey", {
      step,
      ...metadata,
    });
  }

  // Authentication Events
  trackAuthentication(
    action: "login_attempt" | "login_success" | "login_failure" | "logout",
    metadata: Record<string, unknown> = {}
  ) {
    this.track(`auth_${action}`, {
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // AI Command Events
  trackAICommand(
    action:
      | "command_entered"
      | "command_executed"
      | "command_failed"
      | "command_blocked",
    metadata: Record<string, unknown> = {}
  ) {
    this.track(`ai_command_${action}`, {
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // App Connection Events
  trackAppConnection(
    action:
      | "connection_attempt"
      | "connection_success"
      | "connection_failure"
      | "disconnection",
    appId: string,
    metadata: Record<string, unknown> = {}
  ) {
    this.track(`app_${action}`, {
      appId,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // Document Events
  trackDocumentInteraction(
    action:
      | "document_viewed"
      | "document_edited"
      | "document_created"
      | "document_shared",
    metadata: Record<string, unknown> = {}
  ) {
    this.track(`document_${action}`, {
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // Feature Usage Events
  trackFeatureUsage(
    feature: string,
    action: string,
    metadata: Record<string, unknown> = {}
  ) {
    this.track("feature_usage", {
      feature,
      action,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // Performance Events
  trackPerformance(
    metric: string,
    value: number,
    metadata: Record<string, unknown> = {}
  ) {
    this.track("performance_metric", {
      metric,
      value,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // Error Events
  trackError(
    error: Error,
    context: string,
    metadata: Record<string, unknown> = {}
  ) {
    this.track("error_occurred", {
      errorMessage: error.message,
      errorStack: error.stack,
      context,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // Business Events
  trackBusinessEvent(
    event:
      | "demo_to_live_conversion"
      | "feature_discovery"
      | "user_retention"
      | "subscription_upgrade",
    metadata: Record<string, unknown> = {}
  ) {
    this.track(`business_${event}`, {
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // Session Management
  endSession() {
    const sessionDuration = Date.now() - this.sessionStartTime.getTime();
    this.track("session_ended", {
      duration: sessionDuration,
      eventsCount: this.events.length,
      isAuthorizedUser: this.isAuthorizedUser,
    });
  }

  // Get Analytics Summary
  getSessionSummary(): UserMetrics {
    const commandEvents = this.events.filter((e) =>
      e.event.startsWith("ai_command_")
    );
    // const connectionEvents = this.events.filter((e) =>
    //   e.event.startsWith("app_")
    // );
    const documentEvents = this.events.filter((e) =>
      e.event.startsWith("document_")
    );

    return {
      userId: this.userId || "anonymous",
      sessionId: this.sessionId,
      accountType: this.getAccountType(),
      connectedApps: this.getConnectedApps(),
      totalCommands: commandEvents.filter(
        (e) => e.event === "ai_command_executed"
      ).length,
      successfulCommands: commandEvents.filter(
        (e) =>
          e.event === "ai_command_executed" && e.properties.status === "success"
      ).length,
      failedCommands: commandEvents.filter(
        (e) => e.event === "ai_command_failed"
      ).length,
      averageSessionDuration: Date.now() - this.sessionStartTime.getTime(),
      documentsAccessed: documentEvents.length,
      featuresUsed: [...new Set(this.events.map((e) => e.event))],
    };
  }

  private getAccountType(): "personal" | "business" | "unknown" {
    const authEvents = this.events.filter((e) => e.event.startsWith("auth_"));
    const latestAuth = authEvents[authEvents.length - 1];
    return latestAuth?.properties?.accountType || "unknown";
  }

  private getConnectedApps(): string[] {
    const connectionEvents = this.events.filter(
      (e) => e.event === "app_connection_success"
    );
    return [...new Set(connectionEvents.map((e) => e.properties.appId))];
  }

  // Debug Methods
  getStoredEvents(): AnalyticsEvent[] {
    if (!this.isAuthorizedUser) {
      return [];
    }
    return JSON.parse(localStorage.getItem("samara_analytics") || "[]");
  }

  clearStoredEvents() {
    if (!this.isAuthorizedUser) {
      console.warn("Analytics data can only be cleared by authorized user");
      return;
    }
    localStorage.removeItem("samara_analytics");
    this.events = [];
  }

  enableDebugMode() {
    if (!this.isAuthorizedUser) {
      console.warn("Debug mode can only be enabled by authorized user");
      return;
    }
    localStorage.setItem("analytics-debug", "true");
    this.isEnabled = true;
  }

  disableDebugMode() {
    if (!this.isAuthorizedUser) {
      console.warn("Debug mode can only be disabled by authorized user");
      return;
    }
    localStorage.removeItem("analytics-debug");
    this.isEnabled = process.env.NODE_ENV === "production";
  }

  // Get authorization status
  getAuthorizationStatus() {
    return {
      isAuthorizedUser: this.isAuthorizedUser,
      userEmail: this.userEmail,
      canViewAnalytics: this.canViewAnalytics(),
      analyticsEnabled: this.isAnalyticsEnabled(),
    };
  }
}

// Global analytics instance
export const analytics = new AnalyticsService();

// Type declarations for external analytics services
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    mixpanel?: unknown;
    posthog?: unknown;
  }
}
