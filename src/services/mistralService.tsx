interface ColumnMapping {
  leftColumn: string;
  rightColumn: string;
  confidence: number;
  reasoning: string;
}

interface MergeAnalysis {
  mappings: ColumnMapping[];
  unmatchedLeft: string[];
  unmatchedRight: string[];
  suggestions: string[];
  mergeStrategy: "inner" | "left" | "right" | "outer";
}

class MistralService {
  private apiKey: string;
  private baseUrl: string = "https://api.mistral.ai/v1";

  constructor() {
    this.apiKey = import.meta.env.VITE_MISTRAL_API_KEY || "demo-key";
  }

  async analyzeColumnMapping(
    leftHeaders: string[],
    rightHeaders: string[],
    leftSampleData: any[][],
    rightSampleData: any[][]
  ): Promise<MergeAnalysis> {
    // For demo purposes, we'll simulate Mistral AI analysis
    // In production, this would make actual API calls to Mistral

    if (this.apiKey === "demo-key") {
      return this.simulateMistralAnalysis(
        leftHeaders,
        rightHeaders,
        leftSampleData,
        rightSampleData
      );
    }

    try {
      const prompt = this.buildAnalysisPrompt(
        leftHeaders,
        rightHeaders,
        leftSampleData,
        rightSampleData
      );

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [
            {
              role: "system",
              content:
                "You are an expert data analyst specializing in Excel file merging and column mapping. Analyze the provided data and return a JSON response with column mappings.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.statusText}`);
      }

      //   const responseText = await response.text();
      //   let data: MergeAnalysis;

      //   data = JSON.parse(responseText);

      const responseText = await response.text();
      const match = responseText.match(/```json\s*([\s\S]*?)```/i);

      if (match && match[1]) {
        let jsonString = match[1].trim();
        // If the string starts and ends with quotes, remove them
        if (
          (jsonString.startsWith('"') && jsonString.endsWith('"')) ||
          (jsonString.startsWith("'") && jsonString.endsWith("'"))
        ) {
          jsonString = jsonString.slice(1, -1);
        }

        // Replace escaped newlines and quotes
        jsonString = jsonString.replace(/\\n/g, "\n").replace(/\\"/g, '"');

        // Now parse
        let data: MergeAnalysis = JSON.parse(jsonString);
        // console.log("Extracted JSON string:", JSON.stringify(jsonString));
        data = JSON.parse(jsonString);

        data.mappings = Array.isArray(data.mappings) ? data.mappings : [];
        data.unmatchedLeft = Array.isArray(data.unmatchedLeft)
          ? data.unmatchedLeft
          : [];
        data.unmatchedRight = Array.isArray(data.unmatchedRight)
          ? data.unmatchedRight
          : [];
        data.suggestions = Array.isArray(data.suggestions)
          ? data.suggestions
          : [];
        data.mergeStrategy =
          data.mergeStrategy === "inner" ||
          data.mergeStrategy === "left" ||
          data.mergeStrategy === "right" ||
          data.mergeStrategy === "outer"
            ? data.mergeStrategy
            : "outer";

        return data;
      } else {
        throw new Error("No JSON code block found in API response");
      }
    } catch (error: any) {
      // Fallback in case of network or other errors
      return {
        mappings: [],
        unmatchedLeft: leftHeaders,
        unmatchedRight: rightHeaders,
        suggestions: [
          "Error communicating with Mistral API.",
          error?.message || String(error),
        ],
        mergeStrategy: "outer",
      };
    }
  }

  private buildAnalysisPrompt(
    leftHeaders: string[],
    rightHeaders: string[],
    leftSampleData: any[][],
    rightSampleData: any[][]
  ): string {
    return `
  Analyze these two Excel files and suggest column mappings for merging:
  
  LEFT FILE COLUMNS: ${leftHeaders.join(", ")}
  RIGHT FILE COLUMNS: ${rightHeaders.join(", ")}
  
  SAMPLE DATA FROM LEFT FILE (first 3 rows):
  ${leftSampleData
    .slice(0, 3)
    .map((row) => leftHeaders.map((_, i) => row[i] || "").join(" | "))
    .join("\n")}
  
  SAMPLE DATA FROM RIGHT FILE (first 3 rows):
  ${rightSampleData
    .slice(0, 3)
    .map((row) => rightHeaders.map((_, i) => row[i] || "").join(" | "))
    .join("\n")}
  
  Please analyze the column names and sample data to suggest mappings. Return a JSON object with this structure:
  {
    "mappings": [
      {
        "leftColumn": "column name from left file",
        "rightColumn": "column name from right file", 
        "confidence": 0.95,
        "reasoning": "explanation of why these columns match"
      }
    ],
    "unmatchedLeft": ["columns from left file with no match"],
    "unmatchedRight": ["columns from right file with no match"],
    "suggestions": ["suggestions for improving the merge"],
    "mergeStrategy": "inner|left|right|outer"
  }
  
  Consider:
  - Exact name matches (highest confidence)
  - Similar names (e.g., "Name" vs "Full Name")
  - Data type compatibility
  - Sample data patterns
  - Common business terminology
  `;
  }

  private simulateMistralAnalysis(
    leftHeaders: string[],
    rightHeaders: string[],
    leftSampleData: any[][],
    rightSampleData: any[][]
  ): MergeAnalysis {
    const mappings: ColumnMapping[] = [];
    const unmatchedLeft: string[] = [];
    const unmatchedRight: string[] = [...rightHeaders];

    // Simulate intelligent column matching
    leftHeaders.forEach((leftCol) => {
      const leftLower = leftCol.toLowerCase().trim();
      let bestMatch: {
        column: string;
        confidence: number;
        reasoning: string;
      } | null = null;

      rightHeaders.forEach((rightCol) => {
        const rightLower = rightCol.toLowerCase().trim();

        // Exact match
        if (leftLower === rightLower) {
          bestMatch = {
            column: rightCol,
            confidence: 1.0,
            reasoning: "Exact column name match",
          };
        }
        // Similar names
        else if (
          !bestMatch &&
          this.calculateSimilarity(leftLower, rightLower) > 0.7
        ) {
          bestMatch = {
            column: rightCol,
            confidence: 0.85,
            reasoning: "Similar column names detected",
          };
        }
        // Common patterns
        else if (
          !bestMatch &&
          this.matchesCommonPatterns(leftLower, rightLower)
        ) {
          bestMatch = {
            column: rightCol,
            confidence: 0.75,
            reasoning: "Common business terminology pattern match",
          };
        }
      });

      if (bestMatch && bestMatch.confidence > 0.6) {
        mappings.push({
          leftColumn: leftCol,
          rightColumn: bestMatch.column,
          confidence: bestMatch.confidence,
          reasoning: bestMatch.reasoning,
        });

        // Remove from unmatched
        const index = unmatchedRight.indexOf(bestMatch.column);
        if (index > -1) {
          unmatchedRight.splice(index, 1);
        }
      } else {
        unmatchedLeft.push(leftCol);
      }
    });

    const suggestions = this.generateMergeSuggestions(
      mappings,
      unmatchedLeft,
      unmatchedRight
    );
    const mergeStrategy = this.determineMergeStrategy(
      mappings,
      leftHeaders,
      rightHeaders
    );

    return {
      mappings,
      unmatchedLeft,
      unmatchedRight,
      suggestions,
      mergeStrategy,
    };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private matchesCommonPatterns(left: string, right: string): boolean {
    const patterns = [
      ["name", "full name", "customer name", "client name"],
      ["id", "identifier", "key", "reference"],
      ["email", "e-mail", "email address", "mail"],
      ["phone", "telephone", "mobile", "contact"],
      ["date", "created", "modified", "timestamp"],
      ["amount", "value", "price", "cost", "total"],
      ["status", "state", "condition"],
      ["address", "location", "street"],
      ["company", "organization", "business"],
      ["description", "notes", "comments", "details"],
    ];

    return patterns.some(
      (pattern) => pattern.includes(left) && pattern.includes(right)
    );
  }

  private generateMergeSuggestions(
    mappings: ColumnMapping[],
    unmatchedLeft: string[],
    unmatchedRight: string[]
  ): string[] {
    const suggestions: string[] = [];

    if (mappings.length === 0) {
      suggestions.push(
        "No automatic column matches found. Consider manual mapping."
      );
    }

    if (unmatchedLeft.length > 0) {
      suggestions.push(
        `${unmatchedLeft.length} columns from the left file will be preserved in the merge.`
      );
    }

    if (unmatchedRight.length > 0) {
      suggestions.push(
        `${unmatchedRight.length} columns from the right file will be added to the merge.`
      );
    }

    const lowConfidenceMatches = mappings.filter((m) => m.confidence < 0.8);
    if (lowConfidenceMatches.length > 0) {
      suggestions.push(
        `${lowConfidenceMatches.length} column matches have low confidence. Review before merging.`
      );
    }

    if (mappings.length > 0) {
      suggestions.push(
        "Merge will combine matching columns and preserve unique columns from both files."
      );
    }

    return suggestions;
  }

  private determineMergeStrategy(
    mappings: ColumnMapping[],
    leftHeaders: string[],
    rightHeaders: string[]
  ): "inner" | "left" | "right" | "outer" {
    const matchRatio =
      mappings.length / Math.max(leftHeaders.length, rightHeaders.length);

    if (matchRatio > 0.8) return "inner";
    if (leftHeaders.length > rightHeaders.length) return "left";
    if (rightHeaders.length > leftHeaders.length) return "right";
    return "outer";
  }

  async generateMergedData(
    leftData: any[][],
    rightData: any[][],
    leftHeaders: string[],
    rightHeaders: string[],
    analysis: MergeAnalysis
  ): Promise<{ headers: string[]; data: any[][] }> {
    // Create merged headers
    const mergedHeaders: string[] = [];
    const leftColumnMap: { [key: string]: number } = {};
    const rightColumnMap: { [key: string]: number } = {};

    // Build column maps
    leftHeaders.forEach((header, index) => {
      leftColumnMap[header] = index;
    });
    rightHeaders.forEach((header, index) => {
      rightColumnMap[header] = index;
    });

    // Add mapped columns (using left file names as primary)
    analysis.mappings.forEach((mapping) => {
      mergedHeaders.push(mapping.leftColumn);
    });

    // Add unmatched left columns
    analysis.unmatchedLeft.forEach((column) => {
      mergedHeaders.push(column);
    });

    // Add unmatched right columns
    analysis.unmatchedRight.forEach((column) => {
      mergedHeaders.push(`${column} (Right)`);
    });

    // Generate merged data
    const mergedData: any[][] = [];
    const maxRows = Math.max(leftData.length, rightData.length);

    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
      const mergedRow: any[] = [];

      // Add mapped column data
      analysis.mappings.forEach((mapping) => {
        const leftValue =
          leftData[rowIndex]?.[leftColumnMap[mapping.leftColumn]] || "";
        const rightValue =
          rightData[rowIndex]?.[rightColumnMap[mapping.rightColumn]] || "";

        // Combine values if both exist and are different
        if (leftValue && rightValue && leftValue !== rightValue) {
          mergedRow.push(`${leftValue} | ${rightValue}`);
        } else {
          mergedRow.push(leftValue || rightValue || "");
        }
      });

      // Add unmatched left column data
      analysis.unmatchedLeft.forEach((column) => {
        const value = leftData[rowIndex]?.[leftColumnMap[column]] || "";
        mergedRow.push(value);
      });

      // Add unmatched right column data
      analysis.unmatchedRight.forEach((column) => {
        const value = rightData[rowIndex]?.[rightColumnMap[column]] || "";
        mergedRow.push(value);
      });

      mergedData.push(mergedRow);
    }
    console.log("Merged data:", mergedData);
    return {
      headers: mergedHeaders,
      data: mergedData,
    };
  }
}

export const mistralService = new MistralService();
