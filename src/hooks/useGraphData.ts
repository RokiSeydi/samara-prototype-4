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
  const [debugInfo, setDebugInfo] = useState<unknown>(null);

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

  // Try the most promising endpoints first
  const tryPriorityEndpoints = async () => {
    console.log("🎯 Trying priority file endpoints...");

    const priorityEndpoints = [
      // Most likely to work for business accounts
      {
        name: "Drive Root Children",
        endpoint: "https://graph.microsoft.com/v1.0/me/drive/root/children",
        description: "Standard OneDrive files",
      },
      {
        name: "Drive Recent",
        endpoint: "https://graph.microsoft.com/v1.0/me/drive/recent",
        description: "Recently accessed files",
      },
      {
        name: "Search Office Files",
        endpoint:
          "https://graph.microsoft.com/v1.0/me/drive/root/search(q='.docx OR .xlsx OR .pptx')?$top=25",
        description: "Search for Office documents",
      },
      {
        name: "Insights Used",
        endpoint: "https://graph.microsoft.com/v1.0/me/insights/used?$top=25",
        description: "Recently used documents",
      },
      {
        name: "Insights Trending",
        endpoint:
          "https://graph.microsoft.com/v1.0/me/insights/trending?$top=25",
        description: "Trending documents",
      },
    ];

    for (const endpoint of priorityEndpoints) {
      try {
        console.log(`🎯 Testing: ${endpoint.name} (${endpoint.description})`);
        const response = await callMsGraph(endpoint.endpoint);
        const data = await response.json();

        if (response.ok && !data.error) {
          const itemCount = data.value?.length || 0;
          console.log(
            `✅ ${endpoint.name}: SUCCESS - Found ${itemCount} items`
          );

          if (itemCount > 0) {
            console.log(
              "📄 Sample items:",
              data.value
                .slice(0, 3)
                .map(
                  (f: {
                    name: unknown;
                    resourceVisualization: { title: unknown };
                  }) => f.name || f.resourceVisualization?.title
                )
            );
            return {
              success: true,
              data: data.value,
              source: endpoint.name,
              endpoint: endpoint.endpoint,
            };
          }
        } else {
          console.log(
            `❌ ${endpoint.name}: FAILED - ${
              data.error?.message || response.statusText
            }`
          );

          // Log specific error details for debugging
          if (data.error) {
            console.log(`   Error Code: ${data.error.code}`);
            console.log(`   Error Message: ${data.error.message}`);
            if (data.error.innerError) {
              console.log(
                `   Inner Error: ${JSON.stringify(data.error.innerError)}`
              );
            }
          }
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: NETWORK ERROR`, error.message);
      }
    }

    return { success: false };
  };

  // Try SharePoint and Teams as backup
  const tryCollaborationEndpoints = async () => {
    console.log("🤝 Trying collaboration endpoints...");

    const collabEndpoints = [
      {
        name: "SharePoint Sites",
        endpoint: "https://graph.microsoft.com/v1.0/sites?search=*&$top=10",
        description: "SharePoint sites you have access to",
      },
      {
        name: "Joined Teams",
        endpoint: "https://graph.microsoft.com/v1.0/me/joinedTeams",
        description: "Teams you are a member of",
      },
      {
        name: "Group Memberships",
        endpoint: "https://graph.microsoft.com/v1.0/me/memberOf?$top=10",
        description: "Groups and teams you belong to",
      },
    ];

    for (const endpoint of collabEndpoints) {
      try {
        console.log(`🤝 Testing: ${endpoint.name}`);
        const response = await callMsGraph(endpoint.endpoint);
        const data = await response.json();

        if (response.ok && !data.error && data.value && data.value.length > 0) {
          console.log(
            `✅ ${endpoint.name}: SUCCESS - Found ${data.value.length} items`
          );

          // Try to get files from these sources
          if (endpoint.name === "SharePoint Sites") {
            for (const site of data.value.slice(0, 2)) {
              try {
                console.log(
                  `   🔍 Checking site: ${site.displayName || site.name}`
                );
                const siteFilesResponse = await callMsGraph(
                  `https://graph.microsoft.com/v1.0/sites/${site.id}/drive/root/children?$top=25`
                );
                const siteFilesData = await siteFilesResponse.json();

                if (
                  siteFilesResponse.ok &&
                  siteFilesData.value &&
                  siteFilesData.value.length > 0
                ) {
                  console.log(
                    `   ✅ Found ${siteFilesData.value.length} files in ${site.displayName}`
                  );
                  return {
                    success: true,
                    data: siteFilesData.value,
                    source: `SharePoint: ${site.displayName}`,
                  };
                }
              } catch (error) {
                console.log(
                  `   ❌ Site ${site.displayName} failed:`,
                  error.message
                );
              }
            }
          }

          if (endpoint.name === "Joined Teams") {
            for (const team of data.value.slice(0, 2)) {
              try {
                console.log(`   🔍 Checking team: ${team.displayName}`);
                const teamFilesResponse = await callMsGraph(
                  `https://graph.microsoft.com/v1.0/teams/${team.id}/channels?$expand=filesFolder`
                );
                const teamFilesData = await teamFilesResponse.json();

                if (teamFilesResponse.ok && teamFilesData.value) {
                  console.log(
                    `   ✅ Found team channels for ${team.displayName}`
                  );
                  // Could explore team files further here
                }
              } catch (error) {
                console.log(
                  `   ❌ Team ${team.displayName} failed:`,
                  error.message
                );
              }
            }
          }

          if (endpoint.name === "Group Memberships") {
            for (const group of data.value.slice(0, 2)) {
              if (group["@odata.type"] === "#microsoft.graph.group") {
                try {
                  console.log(`   🔍 Checking group: ${group.displayName}`);
                  const groupFilesResponse = await callMsGraph(
                    `https://graph.microsoft.com/v1.0/groups/${group.id}/drive/root/children?$top=25`
                  );
                  const groupFilesData = await groupFilesResponse.json();

                  if (
                    groupFilesResponse.ok &&
                    groupFilesData.value &&
                    groupFilesData.value.length > 0
                  ) {
                    console.log(
                      `   ✅ Found ${groupFilesData.value.length} files in group ${group.displayName}`
                    );
                    return {
                      success: true,
                      data: groupFilesData.value,
                      source: `Group: ${group.displayName}`,
                    };
                  }
                } catch (error) {
                  console.log(
                    `   ❌ Group ${group.displayName} failed:`,
                    error.message
                  );
                }
              }
            }
          }
        } else {
          console.log(
            `❌ ${endpoint.name}: FAILED - ${data.error?.message || "No data"}`
          );
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ERROR`, error.message);
      }
    }

    return { success: false };
  };

  const debugAccountAndPermissions = async () => {
    try {
      console.log("🔍 Starting targeted file access debugging...");

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

      // Try priority endpoints first
      const priorityResult = await tryPriorityEndpoints();

      if (priorityResult.success) {
        return {
          success: true,
          fileResult: priorityResult,
          userData,
          method: "priority_endpoints",
        };
      }

      // If priority endpoints fail, try collaboration endpoints
      console.log(
        "🔄 Priority endpoints failed, trying collaboration sources..."
      );
      const collabResult = await tryCollaborationEndpoints();

      if (collabResult.success) {
        return {
          success: true,
          fileResult: collabResult,
          userData,
          method: "collaboration_endpoints",
        };
      }

      // If everything fails, provide detailed diagnosis
      console.log("📊 DIAGNOSIS: No file access found through any method");
      console.log("💡 This could mean:");
      console.log("   1. Your account has no Office documents");
      console.log("   2. OneDrive is not enabled for your account");
      console.log("   3. Additional permissions are needed");
      console.log("   4. Files are stored in a location we haven't checked");

      return {
        success: false,
        userData,
        diagnosis: "no_file_access",
        suggestions: [
          "Try creating a test document in OneDrive",
          "Check if OneDrive is enabled for your account",
          "Verify you have the necessary licenses",
        ],
      };
    } catch (error) {
      console.error("🚨 Debug failed:", error);
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
      console.log("🚀 Starting targeted document fetch...");

      // Step 1: Detect account type
      await detectAccountType();

      // Step 2: Run targeted debugging
      const debugResult = await debugAccountAndPermissions();
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
        console.log("ℹ️ No file access found - using demo documents");
        setDocuments(createDemoDocuments());

        if (debugResult.diagnosis === "no_file_access") {
          setError("NO_FILE_ACCESS");
        } else {
          setError("API_ERROR");
        }
      }
    } catch (err) {
      console.error("🚨 Error in fetchDocuments:", err);
      setDocuments(createDemoDocuments());
      setError("API_ERROR");
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
