# Contributing to Samara

Thank you for your interest in contributing to Samara! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Types of Contributions

We welcome several types of contributions:

- **🐛 Bug Reports**: Help us identify and fix issues
- **✨ Feature Requests**: Suggest new functionality
- **📝 Documentation**: Improve or add documentation
- **🔧 Code Contributions**: Bug fixes, features, and improvements
- **🎨 Design Improvements**: UI/UX enhancements
- **🧪 Testing**: Add or improve test coverage

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/your-username/samara.git
cd samara

# Add the original repository as upstream
git remote add upstream https://github.com/original-owner/samara.git
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

### 3. Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

## 📋 Development Guidelines

### Code Style

We use ESLint and TypeScript for code quality and consistency.

#### TypeScript Guidelines

```typescript
// ✅ Good: Use explicit types
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// ✅ Good: Use proper function typing
const processDocument = async (doc: OfficeDocument): Promise<ProcessResult> => {
  // Implementation
};

// ❌ Avoid: Using 'any' type
const data: any = response.json();

// ✅ Better: Use proper typing
const data: GraphResponse = await response.json();
```

#### React Component Guidelines

```typescript
// ✅ Good: Functional components with proper props typing
interface AppWidgetProps {
  app: AppData;
  isMinimized: boolean;
  onToggleSize: () => void;
}

export const AppWidget: React.FC<AppWidgetProps> = ({
  app,
  isMinimized,
  onToggleSize,
}) => {
  // Component implementation
};

// ✅ Good: Use custom hooks for logic
const useDocumentData = (appType: string) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  // Hook logic
  return { documents, loading, error };
};
```

#### Styling Guidelines

```typescript
// ✅ Good: Use Fluent UI components
import { Button, Text, Card } from "@fluentui/react-components";

// ✅ Good: Consistent spacing using 8px grid
const styles = {
  padding: "16px", // 2 * 8px
  margin: "24px", // 3 * 8px
  gap: "8px", // 1 * 8px
};

// ✅ Good: Use semantic color tokens
const errorColor = "#D13438"; // Fluent UI error color
const primaryColor = "#0078D4"; // Fluent UI primary color
```

### File Organization

#### Component Structure

```
src/components/
├── ComponentName/
│   ├── ComponentName.tsx      # Main component
│   ├── ComponentName.test.tsx # Tests
│   ├── ComponentName.stories.tsx # Storybook stories (optional)
│   └── index.ts              # Export file
```

#### Naming Conventions

- **Components**: PascalCase (`AppWidget`, `AICommandInterface`)
- **Files**: PascalCase for components, camelCase for utilities
- **Variables**: camelCase (`connectedApps`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS`, `DEFAULT_TIMEOUT`)
- **Types/Interfaces**: PascalCase (`OfficeDocument`, `UserProfile`)

### Component Guidelines

#### 1. Keep Components Focused

```typescript
// ✅ Good: Single responsibility
const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  return (
    <Card>
      <DocumentIcon type={document.type} />
      <DocumentTitle>{document.name}</DocumentTitle>
      <DocumentMetadata document={document} />
    </Card>
  );
};

// ❌ Avoid: Multiple responsibilities
const DocumentCardWithEditingAndSharing = () => {
  // Too many concerns in one component
};
```

#### 2. Use Composition

```typescript
// ✅ Good: Composable components
<AppDashboard>
  <AppWidget app={excelApp} />
  <AppWidget app={wordApp} />
  <AppWidget app={powerpointApp} />
</AppDashboard>

// ✅ Good: Render props for flexibility
<DocumentList>
  {(documents) =>
    documents.map(doc => (
      <DocumentCard key={doc.id} document={doc} />
    ))
  }
</DocumentList>
```

#### 3. Handle Loading and Error States

```typescript
const DocumentViewer: React.FC<Props> = ({ documentId }) => {
  const { document, loading, error } = useDocument(documentId);

  if (loading) {
    return <Spinner label="Loading document..." />;
  }

  if (error) {
    return (
      <MessageBar intent="error">
        <MessageBarTitle>Failed to load document</MessageBarTitle>
        <MessageBarBody>{error.message}</MessageBarBody>
      </MessageBar>
    );
  }

  return <Document data={document} />;
};
```

### Testing Guidelines

#### Unit Tests

```typescript
// ComponentName.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { AppWidget } from "./AppWidget";

describe("AppWidget", () => {
  const mockApp = {
    id: "excel",
    name: "Excel",
    type: "excel" as const,
    isConnected: true,
  };

  it("renders app name correctly", () => {
    render(<AppWidget app={mockApp} isMinimized={false} />);
    expect(screen.getByText("Excel")).toBeInTheDocument();
  });

  it("calls onToggleSize when minimize button is clicked", () => {
    const mockToggle = jest.fn();
    render(
      <AppWidget app={mockApp} isMinimized={false} onToggleSize={mockToggle} />
    );

    fireEvent.click(screen.getByText("Minimize"));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});
```

#### Integration Tests

```typescript
// AICommandInterface.integration.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthenticatedApp } from "./AuthenticatedApp";

describe("AI Command Integration", () => {
  it("processes command and highlights apps", async () => {
    render(<AuthenticatedApp />);

    // Enter command
    const input = screen.getByPlaceholderText(/enter command/i);
    fireEvent.change(input, {
      value: "Extract data from Excel to Word",
    });

    // Submit command
    fireEvent.click(screen.getByText("Execute"));

    // Verify app highlighting
    await waitFor(() => {
      expect(screen.getByText("AI Processing Active")).toBeInTheDocument();
    });
  });
});
```

### Performance Guidelines

#### 1. Optimize Re-renders

```typescript
// ✅ Good: Memoize expensive computations
const ExpensiveComponent: React.FC<Props> = ({ data }) => {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data]);

  return <div>{processedData}</div>;
};

// ✅ Good: Memoize callbacks
const ParentComponent: React.FC = () => {
  const handleClick = useCallback((id: string) => {
    // Handle click
  }, []);

  return <ChildComponent onClick={handleClick} />;
};
```

#### 2. Lazy Load Components

```typescript
// ✅ Good: Lazy load heavy components
const SettingsPanel = lazy(() => import("./SettingsPanel"));

const App: React.FC = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <SettingsPanel />
    </Suspense>
  );
};
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- AppWidget.test.tsx
```

### Test Coverage Requirements

- **Minimum coverage**: 80% for new code
- **Critical paths**: 95% coverage required
- **Components**: Test all props and user interactions
- **Hooks**: Test all return values and side effects

### Writing Good Tests

#### 1. Test Behavior, Not Implementation

```typescript
// ✅ Good: Test user behavior
it("shows error message when login fails", async () => {
  mockLoginFailure();

  fireEvent.click(screen.getByText("Sign In"));

  await waitFor(() => {
    expect(screen.getByText(/login failed/i)).toBeInTheDocument();
  });
});

// ❌ Avoid: Testing implementation details
it("calls setError with correct message", () => {
  // Testing internal state changes
});
```

#### 2. Use Descriptive Test Names

```typescript
// ✅ Good: Descriptive test names
describe("AICommandInterface", () => {
  it("disables submit button when no command is entered", () => {});
  it("shows validation error for disconnected apps", () => {});
  it("highlights relevant apps during command execution", () => {});
});
```

## 📝 Documentation

### Code Documentation

#### 1. Component Documentation

````typescript
/**
 * AppWidget displays an individual Microsoft 365 app with live data and controls.
 *
 * @param app - The app configuration and data
 * @param isMinimized - Whether the widget should show in compact mode
 * @param onToggleSize - Callback when user toggles widget size
 * @param isHighlighted - Whether to show visual highlighting (during AI operations)
 *
 * @example
 * ```tsx
 * <AppWidget
 *   app={excelApp}
 *   isMinimized={false}
 *   onToggleSize={() => setMinimized(!minimized)}
 *   isHighlighted={isProcessingCommand}
 * />
 * ```
 */
export const AppWidget: React.FC<AppWidgetProps> = ({ ... }) => {
  // Implementation
};
````

#### 2. Complex Function Documentation

```typescript
/**
 * Processes AI commands and coordinates actions across Microsoft 365 apps.
 *
 * This function:
 * 1. Parses the natural language command
 * 2. Identifies required Microsoft 365 apps
 * 3. Validates app connections
 * 4. Executes the command using appropriate APIs
 *
 * @param command - Natural language command from user
 * @param connectedApps - List of currently connected app IDs
 * @returns Promise resolving to command execution result
 *
 * @throws {ValidationError} When required apps are not connected
 * @throws {APIError} When Microsoft Graph API calls fail
 */
const processAICommand = async (
  command: string,
  connectedApps: string[]
): Promise<CommandResult> => {
  // Implementation
};
```

### README Updates

When adding new features, update the README.md:

1. **Features section**: Add new capabilities
2. **Usage examples**: Show how to use new features
3. **Configuration**: Document new settings
4. **Troubleshooting**: Add common issues and solutions

## 🐛 Bug Reports

### Bug Report Template

When reporting bugs, please include:

```markdown
## Bug Description

A clear description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Environment

- OS: [e.g. Windows 11, macOS 12]
- Browser: [e.g. Chrome 96, Firefox 95]
- Samara Version: [e.g. 1.0.0]
- Microsoft 365 Account Type: [Personal/Business]

## Additional Context

Add any other context about the problem here.

## Screenshots

If applicable, add screenshots to help explain your problem.
```

## ✨ Feature Requests

### Feature Request Template

```markdown
## Feature Description

A clear description of the feature you'd like to see.

## Problem Statement

What problem does this feature solve?

## Proposed Solution

How would you like this feature to work?

## Alternative Solutions

Any alternative approaches you've considered.

## Additional Context

Any other context or screenshots about the feature request.

## Implementation Notes

If you have ideas about how this could be implemented.
```

## 🔄 Pull Request Process

### 1. Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Accessibility guidelines followed

### 2. Pull Request Template

```markdown
## Description

Brief description of changes made.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Accessibility testing completed

## Screenshots

If applicable, add screenshots of the changes.

## Checklist

- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### 3. Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: Maintainers review code for quality and consistency
3. **Testing**: Manual testing of new features
4. **Documentation**: Verify documentation is updated
5. **Merge**: Approved PRs are merged to main branch

## 🏷️ Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version number bumped
- [ ] Release notes prepared
- [ ] Demo environment tested

## 🤔 Questions?

If you have questions about contributing:

1. Check existing [Issues](https://github.com/owner/samara/issues)
2. Create a new issue with the "question" label
3. Join our community discussions
4. Review this contributing guide

## 🙏 Recognition

Contributors will be recognized in:

- **README.md**: Contributors section
- **Release Notes**: Feature attribution
- **GitHub**: Contributor graphs and statistics

Thank you for helping make Samara better! 🚀
