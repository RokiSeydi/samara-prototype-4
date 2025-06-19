import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/msalConfig";
import type { OfficeDocument } from "../types";

export const useGraphData = () => {
  const { instance, accounts } = useMsal();
  const [documents, setDocuments] = useState<OfficeDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<
    "personal" | "business" | "unknown"
  >("unknown");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const callMsGraph = async (endpoint: string) => {
    const account = accounts[0];
    if (!account) throw new Error("No account found");

    const response = await instance.acquireTokenSilent({
      ...loginRequest,
      account: account,
    });

    const headers = new Headers();
    const bearer = `Bearer ${response.accessToken}`;
    headers.append("Authorization", bearer);

    const options = {
      method: "GET",
      headers: headers,
    };

    console.log("📡 Calling endpoint:", endpoint);
    const fetchResponse = await fetch(endpoint, options);

    console.log("📊 Response:", fetchResponse.status, fetchResponse.statusText);

    return fetchResponse;
  };

  // Enhanced endpoint testing specifically for Business Standard accounts
  const tryBusinessStandardEndpoints = async () => {
    console.log("🏢 Testing Business Standard account endpoints...");

    const businessEndpoints = [
      // Primary OneDrive access methods
      {
        name: "OneDrive Personal",
        endpoint:
          "https://graph.microsoft.com/v1.0/me/drive/root/children?$top=25",
        description: "Personal OneDrive files",
      },
      {
        name: "OneDrive Recent",
        endpoint: "https://graph.microsoft.com/v1.0/me/drive/recent?$top=25",
        description: "Recently accessed files",
      },
      // Alternative drive access
      {
        name: "All Drives",
        endpoint: "https://graph.microsoft.com/v1.0/me/drives",
        description: "Available drives",
      },
      // SharePoint integration
      {
        name: "SharePoint Root",
        endpoint: "https://graph.microsoft.com/v1.0/sites/root",
        description: "SharePoint root site",
      },
      {
        name: "SharePoint Sites",
        endpoint: "https://graph.microsoft.com/v1.0/sites?search=*",
        description: "SharePoint sites",
      },
      // Office 365 Groups and Teams
      {
        name: "Office 365 Groups",
        endpoint:
          "https://graph.microsoft.com/v1.0/me/memberOf/microsoft.graph.group",
        description: "Office 365 Groups",
      },
      // Insights API for recent Office files
      {
        name: "Office Insights Used",
        endpoint: "https://graph.microsoft.com/v1.0/me/insights/used?$top=25",
        description: "Recently used Office files",
      },
      {
        name: "Office Insights Trending",
        endpoint:
          "https://graph.microsoft.com/v1.0/me/insights/trending?$top=25",
        description: "Trending Office files",
      },
      // Alternative file access methods
      {
        name: "Shared Files",
        endpoint:
          "https://graph.microsoft.com/v1.0/me/drive/sharedWithMe?$top=25",
        description: "Files shared with me",
      },
    ];

    const results = {
      accessible: [],
      failed: [],
      fileData: null,
    };

    for (const endpoint of businessEndpoints) {
      try {
        console.log(`🔍 Testing: ${endpoint.name}`);
        const response = await callMsGraph(endpoint.endpoint);
        const data = await response.json();

        if (response.ok && !data.error) {
          const itemCount = data.value?.length || (data.id ? 1 : 0);
          console.log(
            `✅ ${endpoint.name}: SUCCESS - Found ${itemCount} items`
          );

          results.accessible.push({
            ...endpoint,
            data: data,
            itemCount,
            status: "success",
          });

          // Try to extract Office files from successful endpoints
          if (
            endpoint.name === "OneDrive Personal" ||
            endpoint.name === "OneDrive Recent"
          ) {
            if (data.value && data.value.length > 0) {
              console.log(
                `📁 Found ${data.value.length} files in ${endpoint.name}`
              );
              results.fileData = { data: data.value, source: endpoint.name };
            }
          }

          // Handle All Drives endpoint
          if (endpoint.name === "All Drives" && data.value) {
            for (const drive of data.value.slice(0, 3)) {
              // Try first 3 drives
              try {
                console.log(`💾 Checking drive: ${drive.name || drive.id}`);
                const driveFilesResponse = await callMsGraph(
                  `https://graph.microsoft.com/v1.0/drives/${drive.id}/root/children?$top=25`
                );
                const driveFilesData = await driveFilesResponse.json();

                if (
                  driveFilesResponse.ok &&
                  driveFilesData.value &&
                  driveFilesData.value.length > 0
                ) {
                  console.log(
                    `✅ Found ${driveFilesData.value.length} files in drive ${drive.name}`
                  );
                  results.fileData = {
                    data: driveFilesData.value,
                    source: `Drive: ${drive.name || drive.id}`,
                  };
                  break; // Use first successful drive
                }
              } catch (error) {
                console.log(`❌ Drive ${drive.name} failed:`, error.message);
              }
            }
          }

          // Handle SharePoint sites
          if (
            endpoint.name === "SharePoint Sites" &&
            data.value &&
            data.value.length > 0
          ) {
            for (const site of data.value.slice(0, 2)) {
              // Try first 2 sites
              try {
                console.log(`🏢 Checking SharePoint site: ${site.displayName}`);
                const siteDocsResponse = await callMsGraph(
                  `https://graph.microsoft.com/v1.0/sites/${site.id}/drive/root/children?$top=25`
                );
                const siteDocsData = await siteDocsResponse.json();

                if (
                  siteDocsResponse.ok &&
                  siteDocsData.value &&
                  siteDocsData.value.length > 0
                ) {
                  console.log(
                    `✅ Found ${siteDocsData.value.length} files in SharePoint site ${site.displayName}`
                  );
                  results.fileData = {
                    data: siteDocsData.value,
                    source: `SharePoint: ${site.displayName}`,
                  };
                  break; // Use first successful site
                }
              } catch (error) {
                console.log(
                  `❌ SharePoint site ${site.displayName} failed:`,
                  error.message
                );
              }
            }
          }

          // Handle Office Insights
          if (
            (endpoint.name === "Office Insights Used" ||
              endpoint.name === "Office Insights Trending") &&
            data.value &&
            data.value.length > 0
          ) {
            console.log(
              `✅ Found ${data.value.length} recent Office files via ${endpoint.name}`
            );
            const insightFiles = data.value
              .filter(
                (item) =>
                  item.resourceVisualization && item.resourceVisualization.type
              )
              .map((item) => ({
                id: item.id,
                name: item.resourceVisualization.title,
                lastModifiedDateTime:
                  item.lastUsed?.lastAccessedDateTime ||
                  new Date().toISOString(),
                size: 0, // Not available in insights
                webUrl: item.resourceReference?.webUrl || "#",
                file: { mimeType: item.resourceVisualization.type },
              }));

            if (insightFiles.length > 0 && !results.fileData) {
              results.fileData = {
                data: insightFiles,
                source: endpoint.name,
              };
            }
          }
        } else {
          console.log(
            `❌ ${endpoint.name}: FAILED - ${
              data.error?.message || response.statusText
            }`
          );
          results.failed.push({
            ...endpoint,
            error: data.error?.message || response.statusText,
            errorCode: data.error?.code || response.status,
            status: "failed",
          });
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: NETWORK ERROR`, error.message);
        results.failed.push({
          ...endpoint,
          error: error.message,
          errorCode: "NETWORK_ERROR",
          status: "error",
        });
      }
    }

    console.log("📊 BUSINESS STANDARD ACCOUNT SUMMARY:");
    console.log(`✅ Accessible endpoints: ${results.accessible.length}`);
    console.log(`❌ Failed endpoints: ${results.failed.length}`);
    console.log(`📁 File data found: ${results.fileData ? "Yes" : "No"}`);

    return results;
  };

  const diagnoseBusinessAccount = async () => {
    try {
      console.log("🔍 Diagnosing Business Standard account...");

      // First, verify basic access
      console.log("👤 Verifying basic account access...");
      const userResponse = await callMsGraph(
        "https://graph.microsoft.com/v1.0/me"
      );
      const userData = await userResponse.json();

      if (!userResponse.ok || userData.error) {
        console.log("❌ Basic user access failed:", userData.error);
        return { success: false, error: "Basic access denied" };
      }

      console.log("✅ Basic user access confirmed");
      console.log(
        "👤 User:",
        userData.displayName,
        userData.mail || userData.userPrincipalName
      );

      // Check subscription and license info
      console.log("📋 Checking subscription information...");
      try {
        const subscriptionResponse = await callMsGraph(
          "https://graph.microsoft.com/v1.0/me/licenseDetails"
        );
        const subscriptionData = await subscriptionResponse.json();

        if (subscriptionResponse.ok && subscriptionData.value) {
          console.log(
            "📋 License information:",
            subscriptionData.value.map((license) => license.skuPartNumber)
          );
        }
      } catch (error) {
        console.log(
          "⚠️ Could not retrieve license information:",
          error.message
        );
      }

      // Check what Microsoft 365 services are available
      console.log("🔍 Checking available Microsoft 365 services...");
      const serviceEndpoints = [
        {
          name: "Mail",
          endpoint: "https://graph.microsoft.com/v1.0/me/mailboxSettings",
        },
        {
          name: "Calendar",
          endpoint: "https://graph.microsoft.com/v1.0/me/calendar",
        },
        {
          name: "Contacts",
          endpoint: "https://graph.microsoft.com/v1.0/me/contacts?$top=1",
        },
        {
          name: "Tasks",
          endpoint: "https://graph.microsoft.com/v1.0/me/todo/lists?$top=1",
        },
        {
          name: "Planner",
          endpoint: "https://graph.microsoft.com/v1.0/me/planner/tasks?$top=1",
        },
      ];

      const availableServices = [];
      for (const service of serviceEndpoints) {
        try {
          const response = await callMsGraph(service.endpoint);
          const data = await response.json();
          if (response.ok && !data.error) {
            availableServices.push(service.name);
            console.log(`✅ ${service.name} service available`);
          } else {
            console.log(
              `❌ ${service.name} service unavailable: ${data.error?.message}`
            );
          }
        } catch (error) {
          console.log(`❌ ${service.name} service error:`, error.message);
        }
      }

      console.log("📊 Available services:", availableServices);

      // Try Business Standard file access methods
      const businessResults = await tryBusinessStandardEndpoints();

      if (businessResults.fileData) {
        console.log("🎉 SUCCESS: Found file access method!");
        return {
          success: true,
          fileResult: businessResults.fileData,
          userData,
          availableServices,
          accessibleEndpoints: businessResults.accessible,
          failedEndpoints: businessResults.failed,
          method: "business_standard_access",
        };
      }

      // Provide detailed diagnosis for Business Standard accounts
      console.log("📊 BUSINESS STANDARD DIAGNOSIS:");
      console.log(
        "❌ File access blocked - this is common for corporate accounts"
      );
      console.log("✅ Available services:", availableServices.join(", "));
      console.log("💡 BUSINESS STANDARD RECOMMENDATIONS:");
      console.log(
        "   1. Your IT admin may have restricted third-party app file access"
      );
      console.log(
        "   2. OneDrive for Business may require additional permissions"
      );
      console.log(
        "   3. SharePoint access might be limited by organizational policies"
      );
      console.log(
        "   4. Demo mode shows all features working with realistic data"
      );
      console.log(
        "   5. Priority Dashboard will work with available services (Mail, Calendar, Tasks)"
      );
      console.log(
        '   6. Contact IT to enable "Files.Read" and "Sites.Read.All" permissions'
      );

      return {
        success: false,
        userData,
        availableServices,
        accessibleEndpoints: businessResults.accessible,
        failedEndpoints: businessResults.failed,
        diagnosis: "business_standard_file_restrictions",
        recommendations: [
          "Contact IT admin to enable third-party app file access",
          'Request "Files.Read" and "Sites.Read.All" Microsoft Graph permissions',
          "Verify OneDrive for Business is enabled for your account",
          "Check if SharePoint Online access is restricted by policy",
          "Use demo mode to test all functionality with sample data",
          "Priority Dashboard works with Mail, Calendar, and Tasks regardless",
        ],
      };
    } catch (error) {
      console.error("🚨 Business Standard diagnosis failed:", error);
      return { success: false, error: error.message };
    }
  };

  const getDocumentType = (
    fileName: string,
    mimeType?: string
  ): OfficeDocument["type"] => {
    const extension = fileName.toLowerCase().split(".").pop();

    switch (extension) {
      case "xlsx":
      case "xls":
      case "xlsm":
        return "excel";
      case "docx":
      case "doc":
      case "docm":
        return "word";
      case "pptx":
      case "ppt":
      case "pptm":
        return "powerpoint";
      case "one":
      case "onetoc2":
        return "onenote";
      default:
        if (mimeType) {
          if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
            return "excel";
          if (mimeType.includes("document") || mimeType.includes("word"))
            return "word";
          if (
            mimeType.includes("presentation") ||
            mimeType.includes("powerpoint")
          )
            return "powerpoint";
          if (mimeType.includes("onenote")) return "onenote";
        }
        return "word";
    }
  };

  const generateDocumentSummary = (
    fileName: string,
    type: OfficeDocument["type"]
  ): string => {
    const name = fileName.toLowerCase();

    if (name.includes("budget") || name.includes("financial")) {
      return "Financial document with budget analysis, revenue projections, and expense tracking. Contains charts and financial metrics for stakeholder review.";
    }

    if (name.includes("report") || name.includes("analysis")) {
      return "Comprehensive report document with detailed analysis, key findings, and actionable insights. Includes data visualizations and recommendations.";
    }

    if (name.includes("proposal") || name.includes("plan")) {
      return "Strategic proposal document outlining objectives, timeline, budget requirements, and expected deliverables for project planning.";
    }

    if (name.includes("meeting") || name.includes("notes")) {
      return "Meeting notes and discussion points with action items, decisions made, and follow-up tasks organized by priority.";
    }

    if (name.includes("presentation") || name.includes("slide")) {
      return "Professional presentation with visual content, charts, and key messaging for stakeholder communication.";
    }

    if (name.includes("template") || name.includes("form")) {
      return "Standardized template document for consistent formatting and streamlined document creation processes.";
    }

    switch (type) {
      case "excel":
        return "Spreadsheet document with data analysis, calculations, and charts. Contains organized data for business insights and reporting.";
      case "word":
        return "Text document with formatted content, headings, and structured information for professional communication.";
      case "powerpoint":
        return "Presentation slides with visual content and key points for effective communication and stakeholder engagement.";
      case "onenote":
        return "Digital notebook with organized notes, research, and collaborative content for knowledge management.";
      default:
        return "Professional document containing important business information and structured content for team collaboration.";
    }
  };

  const createDemoDocuments = (): OfficeDocument[] => {
    return [
      {
        id: "demo-1",
        name: "Q4 Budget Analysis.xlsx",
        type: "excel",
        lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        size: 2048576,
        webUrl: "https://office.com/excel/demo1",
        summary:
          "Quarterly financial analysis with revenue projections, expense breakdowns, and profit margins. Includes interactive charts and budget forecasts for stakeholder presentations.",
      },
      {
        id: "demo-2",
        name: "Project Status Report.docx",
        type: "word",
        lastModified: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        size: 1024000,
        webUrl: "https://office.com/word/demo2",
        summary:
          "Comprehensive project status report with milestone tracking, risk assessment, and resource allocation. Contains detailed analysis and actionable recommendations.",
      },
      {
        id: "demo-3",
        name: "Team Presentation Q4.pptx",
        type: "powerpoint",
        lastModified: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        size: 5242880,
        webUrl: "https://office.com/powerpoint/demo3",
        summary:
          "Professional quarterly presentation with performance metrics, team achievements, and strategic roadmap. Features data visualizations and executive summary slides.",
      },
      {
        id: "demo-4",
        name: "Meeting Notes - Strategy Session.one",
        type: "onenote",
        lastModified: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        size: 512000,
        webUrl: "https://office.com/onenote/demo4",
        summary:
          "Strategic planning session notes with action items, decision points, and follow-up tasks. Organized by priority with assigned owners and deadlines.",
      },
      {
        id: "demo-5",
        name: "Sales Dashboard.xlsx",
        type: "excel",
        lastModified: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        size: 1536000,
        webUrl: "https://office.com/excel/demo5",
        summary:
          "Interactive sales performance dashboard with KPI tracking, regional analysis, and trend forecasting. Contains automated reporting and data visualization.",
      },
      {
        id: "demo-6",
        name: "Product Proposal.docx",
        type: "word",
        lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        size: 2560000,
        webUrl: "https://office.com/word/demo6",
        summary:
          "New product development proposal with market analysis, technical specifications, and implementation timeline. Includes competitive analysis and ROI projections.",
      },
    ];
  };

  const detectAccountType = async () => {
    try {
      const response = await callMsGraph("https://graph.microsoft.com/v1.0/me");
      const userData = await response.json();

      if (userData.error) {
        setAccountType("unknown");
        return;
      }

      const email = userData.mail || userData.userPrincipalName || "";
      const isPersonalDomain =
        email.includes("outlook.com") ||
        email.includes("hotmail.com") ||
        email.includes("live.com") ||
        email.includes("gmail.com");

      if (!isPersonalDomain && email.includes("@")) {
        setAccountType("business");
      } else {
        setAccountType("personal");
      }

      console.log("📊 Account type detected:", {
        type: isPersonalDomain ? "personal" : "business",
        email: email,
      });
    } catch (error) {
      console.error("❌ Account type detection failed:", error);
      setAccountType("unknown");
    }
  };

  const fetchDocuments = async () => {
    if (accounts.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      console.log("🚀 Starting Business Standard account document fetch...");

      // Step 1: Detect account type
      await detectAccountType();

      // Step 2: Run Business Standard diagnosis
      const debugResult = await diagnoseBusinessAccount();
      setDebugInfo(debugResult);

      if (
        debugResult.success &&
        debugResult.fileResult &&
        debugResult.fileResult.data
      ) {
        console.log(
          `✅ SUCCESS: Found files via ${debugResult.fileResult.source}`
        );

        const rawFiles = debugResult.fileResult.data;
        const officeDocuments: OfficeDocument[] = rawFiles
          .filter((item: any) => {
            const fileName =
              item.name || item.resourceVisualization?.title || "";
            if (!fileName) return false;

            // Skip folders
            if (item.folder) return false;

            const lowerName = fileName.toLowerCase();
            return (
              lowerName.endsWith(".xlsx") ||
              lowerName.endsWith(".xls") ||
              lowerName.endsWith(".docx") ||
              lowerName.endsWith(".doc") ||
              lowerName.endsWith(".pptx") ||
              lowerName.endsWith(".ppt") ||
              lowerName.endsWith(".one") ||
              lowerName.endsWith(".xlsm") ||
              lowerName.endsWith(".docm") ||
              lowerName.endsWith(".pptm")
            );
          })
          .map((item: any): OfficeDocument => {
            const fileName =
              item.name ||
              item.resourceVisualization?.title ||
              "Unknown Document";
            const docType = getDocumentType(fileName, item.file?.mimeType);

            return {
              id: item.id || Math.random().toString(),
              name: fileName,
              type: docType,
              lastModified:
                item.lastModifiedDateTime ||
                item.lastUsed?.lastAccessedDateTime ||
                new Date().toISOString(),
              size: item.size || 0,
              webUrl: item.webUrl || item.resourceReference?.webUrl || "#",
              summary: generateDocumentSummary(fileName, docType),
            };
          });

        console.log(`✅ Processed ${officeDocuments.length} Office documents`);
        setDocuments(officeDocuments);

        if (officeDocuments.length === 0) {
          console.log("ℹ️ No Office documents found in accessible files");
          setDocuments(createDemoDocuments());
          setError("NO_DOCUMENTS_FOUND");
        }
      } else {
        console.log(
          "ℹ️ Using demo documents - Business Standard account with file access restrictions"
        );
        setDocuments(createDemoDocuments());

        if (debugResult.diagnosis === "business_standard_file_restrictions") {
          setError("BUSINESS_STANDARD_RESTRICTED");
        } else {
          setError("API_ERROR");
        }
      }
    } catch (err) {
      console.error("🚨 Error in fetchDocuments:", err);
      setDocuments(createDemoDocuments());
      setError("BUSINESS_STANDARD_RESTRICTED");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accounts.length > 0) {
      fetchDocuments();
    }
  }, [accounts.length]);

  return {
    documents,
    loading,
    error,
    accountType,
    debugInfo,
    refetch: fetchDocuments,
  };
};
