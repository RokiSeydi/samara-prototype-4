# Samara Analytics Guide

This guide explains the comprehensive analytics system implemented in Samara and the key metrics you should track for your MVP.

## 📊 Key Metrics to Track

### 1. **User Engagement Metrics**

#### **Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)**

- **What it measures**: Unique users who interact with Samara
- **Why it matters**: Core indicator of product adoption and stickiness
- **Target**:
  - DAU: 50+ users (early MVP)
  - WAU: 200+ users
  - MAU: 500+ users

#### **Session Duration**

- **What it measures**: Average time users spend in the app
- **Why it matters**: Indicates engagement depth and feature utility
- **Target**: 8-15 minutes average session
- **Tracked events**: `session_started`, `session_ended`, `session_hidden`

#### **Bounce Rate**

- **What it measures**: Users who leave without meaningful interaction
- **Why it matters**: Indicates onboarding effectiveness
- **Target**: <30% bounce rate
- **Calculation**: Users who leave within 30 seconds without performing actions

#### **Return User Rate**

- **What it measures**: Percentage of users who return after first visit
- **Why it matters**: Product-market fit indicator
- **Target**: >40% return within 7 days

### 2. **Feature Adoption Metrics**

#### **Priority Dashboard Usage** ⭐ NEW!

- **Daily Priority Views**: How often users check their priority dashboard
- **Priority Completion Rate**: Percentage of priorities marked as complete
- **Collaboration Actions**: Frequency of team communication from priorities
- **Filter Usage**: Which priority filters are most popular
- **File Opening Rate**: How often users open files from priority items

```typescript
// Example tracking
trackFeatureUsage("priority_dashboard", "priority_completed", {
  priorityType: "high",
  appSource: "outlook",
  collaborationLevel: "team",
  timeToCompletion: 1800000, // 30 minutes
});
```

#### **AI Command Usage**

- **Commands per session**: Average AI commands executed per user session
- **Command success rate**: Percentage of commands that complete successfully
- **Most popular commands**: Which AI workflows are most used
- **Command complexity**: Length and complexity of user commands

```typescript
// Example tracking
trackAICommand("command_executed", {
  command: "Extract budget data from Excel",
  appsInvolved: ["excel", "word"],
  commandLength: 32,
  success: true,
  executionTime: 2300,
});
```

#### **App Connection Rate**

- **What it measures**: Percentage of users who connect Microsoft 365 apps
- **Why it matters**: Core feature adoption indicator
- **Target**: >60% of users connect at least 2 apps
- **Tracked events**: `app_connection_attempt`, `app_connection_success`

#### **Document Interaction Rate**

- **What it measures**: Users who view/edit documents within Samara
- **Why it matters**: Indicates value delivery of embedded editing
- **Target**: >30% of users interact with documents
- **Tracked events**: `document_viewed`, `document_edited`

### 3. **Collaboration Metrics** ⭐ NEW!

#### **Team Communication Frequency**

- **What it measures**: How often users communicate with team members through Samara
- **Why it matters**: Indicates collaborative value and team adoption
- **Target**: >50% of users engage in team communication weekly
- **Tracked events**: `teams_chat_started`, `notification_sent`, `collaborator_mentioned`

#### **Shared Priority Management**

- **What it measures**: Usage of collaborative priority features
- **Why it matters**: Shows value of team coordination capabilities
- **Target**: >25% of priorities involve multiple team members
- **Calculation**: Shared priorities / Total priorities

```typescript
// Tracked automatically for collaborative items
trackCollaboration("shared_priority_action", {
  action: "task_assigned",
  participantCount: 3,
  appSource: "planner",
  notificationMethod: "teams",
});
```

#### **Cross-App Workflow Adoption**

- **What it measures**: Users who execute workflows spanning multiple Microsoft 365 apps
- **Why it matters**: Core value proposition of integrated productivity
- **Target**: >40% of active users use cross-app workflows
- **Tracked events**: `cross_app_workflow_executed`, `multi_app_command`

### 4. **Business Metrics**

#### **Demo to Live Conversion Rate**

- **What it measures**: Users who transition from demo mode to real Microsoft 365 data
- **Why it matters**: Revenue potential and product value validation
- **Target**: >25% conversion rate
- **Calculation**: Users with real documents / Total users

```typescript
// Tracked automatically when real documents load
trackBusinessEvent("demo_to_live_conversion", {
  accountType: "business",
  documentsCount: 12,
  timeToConversion: 1800000, // 30 minutes
  connectedApps: ["outlook", "teams", "excel"],
});
```

#### **Priority Dashboard ROI** ⭐ NEW!

- **What it measures**: Time saved through priority management features
- **Why it matters**: Quantifiable productivity improvement
- **Target**: Average 30 minutes saved per user per day
- **Calculation**: (Tasks completed via dashboard × Average task time) - Dashboard usage time

#### **Feature Discovery Rate**

- **What it measures**: How users discover and adopt new features
- **Why it matters**: Product education and UX effectiveness
- **Tracked events**: `feature_usage` with feature names

#### **User Retention Cohorts**

- **Day 1 Retention**: Users who return the next day
- **Day 7 Retention**: Users who return within a week
- **Day 30 Retention**: Users who return within a month
- **Target**: 70% / 40% / 20% respectively

### 5. **Performance Metrics**

#### **Core Web Vitals**

- **Largest Contentful Paint (LCP)**: <2.5 seconds
- **First Input Delay (FID)**: <100 milliseconds
- **Cumulative Layout Shift (CLS)**: <0.1
- **First Contentful Paint (FCP)**: <1.5 seconds

```typescript
// Automatically tracked with usePerformanceTracking hook
trackPerformance("LCP", 1.8, { rating: "good" });
```

#### **API Response Times**

- **Microsoft Graph API calls**: Average response time
- **Authentication flow**: Time to complete login
- **Document loading**: Time to fetch and display documents
- **Priority data aggregation**: Time to collect cross-app priorities

#### **Error Rates**

- **JavaScript errors**: Client-side error frequency
- **API failures**: Microsoft Graph API error rate
- **Authentication failures**: Login/token refresh failures
- **Priority loading errors**: Failed priority data collection

### 6. **User Journey Metrics**

#### **Onboarding Completion Rate**

- **What it measures**: Users who complete the welcome flow
- **Why it matters**: First impression and setup success
- **Target**: >80% completion rate

#### **Time to First Value**

- **What it measures**: Time from signup to first successful priority view or AI command
- **Why it matters**: Product value realization speed
- **Target**: <3 minutes for priority dashboard, <5 minutes for AI commands

#### **Feature Adoption Funnel** ⭐ UPDATED!

1. **App Connection**: % who connect first app
2. **Priority Dashboard**: % who view priority dashboard
3. **First Action**: % who complete first priority action or AI command
4. **Collaboration**: % who engage in team communication
5. **Advanced Features**: % who use settings, analytics, etc.

## 🔧 Implementation Details

### Analytics Service Architecture

```typescript
// Core analytics service with enhanced collaboration tracking
class AnalyticsService {
  // Tracks all user interactions
  track(event: string, properties: Record<string, any>);

  // Specialized tracking methods
  trackUserJourney(step: string, metadata: object);
  trackAICommand(action: string, metadata: object);
  trackAppConnection(action: string, appId: string, metadata: object);
  trackPriorityAction(action: string, metadata: object); // ⭐ NEW!
  trackCollaboration(action: string, metadata: object); // ⭐ NEW!
  trackPerformance(metric: string, value: number, metadata: object);
  trackError(error: Error, context: string, metadata: object);
  trackBusinessEvent(event: string, metadata: object);
}
```

### Event Categories

#### **Priority Dashboard Events** ⭐ NEW!

- `priority_dashboard_viewed`
- `priority_item_opened`
- `priority_completed`
- `priority_filter_applied`
- `priority_notification_sent`

#### **Collaboration Events** ⭐ NEW!

- `teams_chat_started`
- `collaborator_notified`
- `shared_document_accessed`
- `task_assigned`
- `meeting_scheduled_from_priority`

#### **Authentication Events**

- `auth_login_attempt`
- `auth_login_success`
- `auth_login_failure`
- `auth_logout`

#### **AI Command Events**

- `ai_command_entered`
- `ai_command_executed`
- `ai_command_failed`
- `ai_command_blocked`

#### **App Connection Events**

- `app_connection_attempt`
- `app_connection_success`
- `app_connection_failure`
- `app_disconnection`

#### **Document Events**

- `document_viewed`
- `document_edited`
- `document_created`
- `document_shared`

#### **Feature Usage Events**

- `feature_usage` (with feature and action properties)

#### **Performance Events**

- `performance_metric` (with metric name and value)

#### **Business Events**

- `business_demo_to_live_conversion`
- `business_feature_discovery`
- `business_user_retention`
- `business_collaboration_value` ⭐ NEW!

### Data Collection

#### **Automatic Tracking**

- Page views and navigation
- Priority dashboard interactions
- Performance metrics (Core Web Vitals)
- JavaScript errors
- Session duration
- User agent and device info
- Collaboration activities

#### **Manual Tracking**

- Feature interactions
- AI command execution
- App connections
- Document operations
- Business events
- Team communication actions

### Privacy & Compliance

#### **Enhanced Privacy Controls** ⭐ UPDATED!

- **Authorized User System**: Analytics dashboard only available to authorized users
- **Data Minimization**: Only collect necessary data for product improvement
- **No PII**: Personal information excluded from analytics
- **User IDs**: Hashed/anonymized for privacy protection
- **Collaboration Privacy**: Team data aggregated without individual identification

#### **User Consent**

- Clear analytics disclosure in privacy policy
- Option to opt-out of analytics
- Debug mode for development/testing
- Granular consent for different types of tracking

#### **Data Retention**

- Local storage: 100 most recent events
- Production analytics: 90 days retention
- Aggregated metrics: 2 years retention
- Collaboration data: Anonymized after 30 days

## 📈 Analytics Dashboard

### Real-Time Metrics

- Current active users
- Priority actions completed (last hour)
- Commands executed (last hour)
- Collaboration events (last hour)
- Error rate (last hour)
- Performance scores

### Session Analytics

- Session duration
- Priority dashboard usage
- Commands per session
- Apps connected
- Features used
- Documents accessed
- Collaboration activities

### Collaboration Analytics ⭐ NEW!

- Team communication frequency
- Shared priority completion rates
- Cross-app workflow usage
- Meeting scheduling from priorities
- Notification effectiveness
- Collaboration ROI metrics

### Historical Trends

- Daily/weekly/monthly active users
- Feature adoption over time
- Collaboration growth trends
- Performance trends
- Error rate trends
- Business metric evolution

## 🎯 Success Criteria for MVP

### **Month 1 Targets**

- [ ] 100+ total users
- [ ] 60% app connection rate
- [ ] 70% priority dashboard adoption ⭐ NEW!
- [ ] 40% AI command usage rate
- [ ] 25% collaboration feature usage ⭐ NEW!
- [ ] <5% error rate
- [ ] > 80% onboarding completion

### **Month 3 Targets**

- [ ] 500+ monthly active users
- [ ] 25% demo-to-live conversion
- [ ] 40% day-7 retention rate
- [ ] 50% users engage in team collaboration ⭐ NEW!
- [ ] 3+ priority actions per session ⭐ NEW!
- [ ] 3+ commands per session average
- [ ] <2.5s average load time

### **Month 6 Targets**

- [ ] 1000+ monthly active users
- [ ] 35% demo-to-live conversion
- [ ] 20% day-30 retention rate
- [ ] 70% feature adoption rate
- [ ] 60% collaboration feature adoption ⭐ NEW!
- [ ] Net Promoter Score >50
- [ ] 30+ minutes saved per user per day ⭐ NEW!

## 🔍 Analytics Tools Integration

### **Google Analytics 4**

```typescript
// Enhanced integration with collaboration events
if (window.gtag) {
  window.gtag("event", event.event, {
    custom_parameter_1: JSON.stringify(event.properties),
    session_id: event.sessionId,
    user_id: event.userId,
    collaboration_level: event.properties.collaborationLevel,
    feature_category: event.properties.featureCategory,
  });
}
```

### **Mixpanel**

```typescript
// Event tracking with collaboration properties
if (window.mixpanel) {
  window.mixpanel.track(event.event, {
    ...event.properties,
    $session_id: event.sessionId,
    collaboration_score: event.properties.collaborationScore,
    team_size: event.properties.teamSize,
  });
}
```

### **PostHog**

```typescript
// Product analytics with enhanced collaboration tracking
if (window.posthog) {
  window.posthog.capture(event.event, {
    ...event.properties,
    $session_id: event.sessionId,
    collaboration_features_used: event.properties.collaborationFeatures,
    priority_completion_rate: event.properties.completionRate,
  });
}
```

### **Custom Analytics Endpoint**

```typescript
// Send to your own analytics service with collaboration data
await fetch("/api/analytics", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ...event,
    collaborationMetrics: {
      teamInteractions: event.properties.teamInteractions,
      sharedPriorities: event.properties.sharedPriorities,
      communicationFrequency: event.properties.communicationFrequency,
    },
  }),
});
```

## 🚀 Getting Started

### 1. **Enable Analytics**

```typescript
// In production with enhanced collaboration tracking
const analytics = new AnalyticsService();

// For debugging
analytics.enableDebugMode();

// Track collaboration events
analytics.trackCollaboration("team_communication", {
  method: "teams_chat",
  participants: 3,
  context: "priority_item",
});
```

### 2. **View Analytics Dashboard**

- Click "Analytics" button in the header (authorized users only)
- View real-time session metrics
- Monitor collaboration effectiveness
- Track priority dashboard usage
- Toggle debug mode for development

### 3. **Export Data**

```typescript
// Get enhanced session summary with collaboration metrics
const summary = analytics.getSessionSummary();

// Get stored events including collaboration data
const events = analytics.getStoredEvents();

// Get collaboration-specific metrics
const collaborationMetrics = analytics.getCollaborationMetrics();
```

## 📊 Collaboration-Specific Analytics

### **Team Effectiveness Metrics**

- **Communication Response Time**: How quickly team members respond to notifications
- **Task Completion Velocity**: Speed of collaborative task completion
- **Knowledge Sharing Rate**: Frequency of document and information sharing
- **Meeting Efficiency**: Ratio of action items to meeting time
- **Cross-App Workflow Success**: Completion rate of multi-app collaborative processes

### **Organizational Impact**

- **Productivity Gains**: Measurable time savings from collaboration features
- **Adoption Patterns**: How collaboration features spread through organizations
- **ROI Calculation**: Financial impact of improved team coordination
- **User Satisfaction**: Feedback on collaboration experience quality
- **Scalability Metrics**: How collaboration effectiveness changes with team size

This comprehensive analytics system provides deep insights into both individual productivity and team collaboration effectiveness, enabling data-driven decisions for product development and organizational optimization.
