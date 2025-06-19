import type { OfficeDocument } from "../types";

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

export class DemoAICommandProcessor {
  private documents: OfficeDocument[];

  constructor(documents: OfficeDocument[]) {
    this.documents = documents;
  }

  async processCommand({
    command,
    apps,
    connectedApps,
  }: DemoCommandContext): Promise<DemoCommandResult> {
    // Simulate processing time
    await new Promise((resolve) =>
      setTimeout(resolve, 2000 + Math.random() * 2000)
    );

    const lowerCommand = command.toLowerCase();

    // Get relevant documents for the command
    const relevantDocs = this.getRelevantDocuments(lowerCommand, apps);

    // Excel to Word operations
    if (apps.includes("excel") && apps.includes("word")) {
      if (
        lowerCommand.includes("extract") ||
        lowerCommand.includes("budget") ||
        lowerCommand.includes("data")
      ) {
        return this.processExcelToWordExtraction(relevantDocs, lowerCommand);
      }
      if (lowerCommand.includes("combine") || lowerCommand.includes("merge")) {
        return this.processDocumentCombination(relevantDocs, lowerCommand);
      }
      if (
        lowerCommand.includes("summary") ||
        lowerCommand.includes("summarize")
      ) {
        return this.processDocumentSummary(relevantDocs, lowerCommand);
      }
    }

    // Excel/Word to PowerPoint operations
    if (
      apps.includes("powerpoint") &&
      (apps.includes("excel") || apps.includes("word"))
    ) {
      return this.processPresentationCreation(relevantDocs, lowerCommand);
    }

    // OneNote operations
    if (apps.includes("onenote")) {
      return this.processNoteCreation(relevantDocs, lowerCommand);
    }

    // Teams operations
    if (apps.includes("teams")) {
      return this.processTeamsIntegration(relevantDocs, lowerCommand);
    }

    // Outlook operations
    if (apps.includes("outlook")) {
      return this.processEmailOperations(relevantDocs, lowerCommand);
    }

    // Generic multi-app operations
    return this.processGenericOperation(relevantDocs, lowerCommand, apps);
  }

  private getRelevantDocuments(
    command: string,
    apps: string[]
  ): OfficeDocument[] {
    const relevant: OfficeDocument[] = [];

    // Add documents based on app types
    apps.forEach((app) => {
      const appDocs = this.documents.filter((doc) => doc.type === app);
      relevant.push(...appDocs.slice(0, 2)); // Take up to 2 docs per app
    });

    // Add documents based on keywords in command
    if (command.includes("budget") || command.includes("financial")) {
      const budgetDocs = this.documents.filter(
        (doc) =>
          doc.name.toLowerCase().includes("budget") ||
          doc.name.toLowerCase().includes("financial") ||
          doc.name.toLowerCase().includes("sales")
      );
      relevant.push(...budgetDocs);
    }

    if (command.includes("report") || command.includes("status")) {
      const reportDocs = this.documents.filter(
        (doc) =>
          doc.name.toLowerCase().includes("report") ||
          doc.name.toLowerCase().includes("status")
      );
      relevant.push(...reportDocs);
    }

    if (command.includes("presentation") || command.includes("slide")) {
      const presentationDocs = this.documents.filter(
        (doc) =>
          doc.name.toLowerCase().includes("presentation") ||
          doc.type === "powerpoint"
      );
      relevant.push(...presentationDocs);
    }

    // Remove duplicates and return
    return Array.from(new Set(relevant));
  }

  private processExcelToWordExtraction(
    docs: OfficeDocument[],
    command: string
  ): DemoCommandResult {
    const excelDocs = docs.filter((doc) => doc.type === "excel");
    const wordDocs = docs.filter((doc) => doc.type === "word");

    const sourceDoc = excelDocs[0] || {
      name: "Q4 Budget Analysis.xlsx",
      type: "excel",
    };
    const targetDoc = wordDocs[0] || {
      name: "Project Status Report.docx",
      type: "word",
    };

    if (command.includes("budget") || command.includes("financial")) {
      return {
        message: `Successfully extracted budget data from "${sourceDoc.name}" and created a comprehensive financial summary in "${targetDoc.name}". Added 3 charts, 15 key metrics, and variance analysis with actionable insights.`,
        documentsUsed: [
          { name: sourceDoc.name, type: "excel", action: "data extraction" },
          { name: targetDoc.name, type: "word", action: "content generation" },
        ],
        outputFiles: [
          { name: "Budget Summary Report.docx", type: "word", size: "2.1 MB" },
        ],
      };
    }

    if (command.includes("sales") || command.includes("data")) {
      return {
        message: `Analyzed sales data from "${sourceDoc.name}" and generated detailed insights in "${targetDoc.name}". Created performance summaries for 5 regions, identified top 10 opportunities, and included trend analysis with recommendations.`,
        documentsUsed: [
          { name: sourceDoc.name, type: "excel", action: "data analysis" },
          { name: targetDoc.name, type: "word", action: "report generation" },
        ],
        outputFiles: [
          { name: "Sales Analysis Report.docx", type: "word", size: "1.8 MB" },
        ],
      };
    }

    return {
      message: `Extracted key data points from "${sourceDoc.name}" and created a structured summary in "${targetDoc.name}". Processed 127 data entries, generated 4 summary tables, and added executive overview with key findings.`,
      documentsUsed: [
        { name: sourceDoc.name, type: "excel", action: "data extraction" },
        { name: targetDoc.name, type: "word", action: "document creation" },
      ],
      outputFiles: [
        { name: "Data Summary.docx", type: "word", size: "1.5 MB" },
      ],
    };
  }

  private processDocumentCombination(
    docs: OfficeDocument[],
    command: string
  ): DemoCommandResult {
    const usedDocs = docs.slice(0, 3);

    return {
      message: `Successfully combined data from ${usedDocs.length} documents into a comprehensive master document. Merged project status from Word, financial data from Excel, and created unified reporting with cross-references and automated table of contents.`,
      documentsUsed: usedDocs.map((doc) => ({
        name: doc.name,
        type: doc.type,
        action: "content integration",
      })),
      outputFiles: [
        { name: "Master Project Report.docx", type: "word", size: "3.2 MB" },
        { name: "Executive Summary.pdf", type: "pdf", size: "856 KB" },
      ],
    };
  }

  private processDocumentSummary(
    docs: OfficeDocument[],
    command: string
  ): DemoCommandResult {
    const usedDocs = docs.slice(0, 4);

    return {
      message: `Generated comprehensive summary from ${usedDocs.length} documents. Extracted key insights, action items, and metrics. Created executive briefing with 12 key findings, 8 recommendations, and priority matrix for next steps.`,
      documentsUsed: usedDocs.map((doc) => ({
        name: doc.name,
        type: doc.type,
        action: "content analysis",
      })),
      outputFiles: [
        { name: "Executive Summary.docx", type: "word", size: "1.2 MB" },
        { name: "Key Metrics Dashboard.xlsx", type: "excel", size: "945 KB" },
      ],
    };
  }

  private processPresentationCreation(
    docs: OfficeDocument[],
    command: string
  ): DemoCommandResult {
    const sourceDocs = docs
      .filter((doc) => doc.type === "excel" || doc.type === "word")
      .slice(0, 2);

    if (command.includes("budget") || command.includes("financial")) {
      return {
        message: `Created professional presentation from financial data. Generated 12 slides with interactive charts, budget breakdowns, and variance analysis. Added speaker notes and executive summary slide with key recommendations.`,
        documentsUsed: sourceDocs.map((doc) => ({
          name: doc.name,
          type: doc.type,
          action: "data visualization",
        })),
        outputFiles: [
          {
            name: "Q4 Financial Presentation.pptx",
            type: "powerpoint",
            size: "4.7 MB",
          },
          { name: "Presentation Notes.docx", type: "word", size: "678 KB" },
        ],
      };
    }

    return {
      message: `Transformed data into compelling presentation with 15 slides. Created visual storytelling with charts, infographics, and key metrics. Added transition animations and formatted for executive audience with clear call-to-action slides.`,
      documentsUsed: sourceDocs.map((doc) => ({
        name: doc.name,
        type: doc.type,
        action: "presentation creation",
      })),
      outputFiles: [
        {
          name: "Project Presentation.pptx",
          type: "powerpoint",
          size: "5.2 MB",
        },
      ],
    };
  }

  private processNoteCreation(
    docs: OfficeDocument[],
    command: string
  ): DemoCommandResult {
    const sourceDocs = docs.slice(0, 2);

    return {
      message: `Created organized notes in OneNote from source documents. Structured content into sections with tags, added cross-references, and created searchable knowledge base with 23 linked topics and action item tracking.`,
      documentsUsed: sourceDocs.map((doc) => ({
        name: doc.name,
        type: doc.type,
        action: "note extraction",
      })),
      outputFiles: [
        { name: "Project Knowledge Base.one", type: "onenote", size: "1.1 MB" },
        { name: "Action Items Tracker.one", type: "onenote", size: "456 KB" },
      ],
    };
  }

  private processTeamsIntegration(
    docs: OfficeDocument[],
    command: string
  ): DemoCommandResult {
    const sourceDocs = docs.slice(0, 2);

    if (command.includes("meeting") || command.includes("schedule")) {
      return {
        message: `Scheduled Teams meeting based on document analysis. Created meeting agenda from project documents, invited 8 stakeholders, and prepared shared materials. Set up collaborative workspace with document access.`,
        documentsUsed: sourceDocs.map((doc) => ({
          name: doc.name,
          type: doc.type,
          action: "meeting preparation",
        })),
        outputFiles: [
          { name: "Meeting Agenda.docx", type: "word", size: "234 KB" },
          { name: "Shared Materials Folder", type: "folder", size: "12.3 MB" },
        ],
      };
    }

    return {
      message: `Created Teams collaboration space with document integration. Set up channels for different workstreams, shared relevant documents, and configured automated notifications for document updates.`,
      documentsUsed: sourceDocs.map((doc) => ({
        name: doc.name,
        type: doc.type,
        action: "collaboration setup",
      })),
      outputFiles: [{ name: "Team Workspace", type: "teams", size: "N/A" }],
    };
  }

  private processEmailOperations(
    docs: OfficeDocument[],
    command: string
  ): DemoCommandResult {
    const sourceDocs = docs.slice(0, 2);

    return {
      message: `Generated personalized email communications based on document content. Created 5 stakeholder-specific emails with relevant attachments, scheduled delivery, and set up follow-up reminders with tracking.`,
      documentsUsed: sourceDocs.map((doc) => ({
        name: doc.name,
        type: doc.type,
        action: "content extraction",
      })),
      outputFiles: [
        { name: "Stakeholder Update Email.msg", type: "email", size: "145 KB" },
        { name: "Executive Brief.pdf", type: "pdf", size: "892 KB" },
      ],
    };
  }

  private processGenericOperation(
    docs: OfficeDocument[],
    command: string,
    apps: string[]
  ): DemoCommandResult {
    const usedDocs = docs.slice(0, Math.min(3, docs.length));
    const appNames = apps
      .map((app) => app.charAt(0).toUpperCase() + app.slice(1))
      .join(", ");

    return {
      message: `Successfully executed cross-application workflow using ${appNames}. Processed ${usedDocs.length} documents, synchronized data across platforms, and created unified output with automated formatting and cross-references.`,
      documentsUsed: usedDocs.map((doc) => ({
        name: doc.name,
        type: doc.type,
        action: "data processing",
      })),
      outputFiles: [
        { name: "Workflow Output.docx", type: "word", size: "2.3 MB" },
        { name: "Process Summary.xlsx", type: "excel", size: "1.1 MB" },
      ],
    };
  }
}
