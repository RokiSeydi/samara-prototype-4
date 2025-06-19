import { useEffect, useCallback } from "react";
import { analytics } from "../services/analytics";

export const useAnalytics = () => {
  // Track page views
  useEffect(() => {
    analytics.track("page_view", {
      path: window.location.pathname,
      title: document.title,
    });
  }, []);

  // Memoized tracking functions
  const trackEvent = useCallback(
    (event: string, properties?: Record<string, any>) => {
      analytics.track(event, properties);
    },
    []
  );

  const trackUserJourney = useCallback(
    (step: string, metadata?: Record<string, any>) => {
      analytics.trackUserJourney(step, metadata);
    },
    []
  );

  const trackAuthentication = useCallback(
    (
      action: "login_attempt" | "login_success" | "login_failure" | "logout",
      metadata?: Record<string, any>
    ) => {
      analytics.trackAuthentication(action, metadata);
    },
    []
  );

  const trackAICommand = useCallback(
    (
      action:
        | "command_entered"
        | "command_executed"
        | "command_failed"
        | "command_blocked",
      metadata?: Record<string, any>
    ) => {
      analytics.trackAICommand(action, metadata);
    },
    []
  );

  const trackAppConnection = useCallback(
    (
      action:
        | "connection_attempt"
        | "connection_success"
        | "connection_failure"
        | "disconnection",
      appId: string,
      metadata?: Record<string, any>
    ) => {
      analytics.trackAppConnection(action, appId, metadata);
    },
    []
  );

  const trackDocumentInteraction = useCallback(
    (
      action:
        | "document_viewed"
        | "document_edited"
        | "document_created"
        | "document_shared",
      metadata?: Record<string, any>
    ) => {
      analytics.trackDocumentInteraction(action, metadata);
    },
    []
  );

  const trackFeatureUsage = useCallback(
    (feature: string, action: string, metadata?: Record<string, any>) => {
      analytics.trackFeatureUsage(feature, action, metadata);
    },
    []
  );

  const trackPerformance = useCallback(
    (metric: string, value: number, metadata?: Record<string, any>) => {
      analytics.trackPerformance(metric, value, metadata);
    },
    []
  );

  const trackError = useCallback(
    (error: Error, context: string, metadata?: Record<string, any>) => {
      analytics.trackError(error, context, metadata);
    },
    []
  );

  const trackBusinessEvent = useCallback(
    (
      event:
        | "demo_to_live_conversion"
        | "feature_discovery"
        | "user_retention"
        | "subscription_upgrade",
      metadata?: Record<string, any>
    ) => {
      analytics.trackBusinessEvent(event, metadata);
    },
    []
  );

  return {
    trackEvent,
    trackUserJourney,
    trackAuthentication,
    trackAICommand,
    trackAppConnection,
    trackDocumentInteraction,
    trackFeatureUsage,
    trackPerformance,
    trackError,
    trackBusinessEvent,
    getSessionSummary: analytics.getSessionSummary.bind(analytics),
  };
};

// Performance tracking hook
export const usePerformanceTracking = () => {
  const { trackPerformance } = useAnalytics();

  useEffect(() => {
    // Track Core Web Vitals
    if ("web-vitals" in window || typeof window !== "undefined") {
      import("web-vitals").then(
        ({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS((metric) =>
            trackPerformance("CLS", metric.value, { rating: metric.rating })
          );
          getFID((metric) =>
            trackPerformance("FID", metric.value, { rating: metric.rating })
          );
          getFCP((metric) =>
            trackPerformance("FCP", metric.value, { rating: metric.rating })
          );
          getLCP((metric) =>
            trackPerformance("LCP", metric.value, { rating: metric.rating })
          );
          getTTFB((metric) =>
            trackPerformance("TTFB", metric.value, { rating: metric.rating })
          );
        }
      );
    }

    // Track custom performance metrics
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "navigation") {
          const navEntry = entry as PerformanceNavigationTiming;
          trackPerformance(
            "page_load_time",
            navEntry.loadEventEnd - navEntry.loadEventStart
          );
          trackPerformance(
            "dom_content_loaded",
            navEntry.domContentLoadedEventEnd -
              navEntry.domContentLoadedEventStart
          );
        }
      }
    });

    observer.observe({ entryTypes: ["navigation"] });

    return () => observer.disconnect();
  }, [trackPerformance]);
};

// Error tracking hook
export const useErrorTracking = () => {
  const { trackError } = useAnalytics();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), "global_error", {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      trackError(new Error(event.reason), "unhandled_promise_rejection");
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, [trackError]);
};
