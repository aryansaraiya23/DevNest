import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WorkspaceProject } from '../../types/project';
import { FileNode, OpenTab, EditorCursorPosition, FileSystemItemType } from '../../types/files';
import { BottomPanelTab } from '../../types/ide';
import { SupportedLanguage, ExecutionResult, BatchTestResult, TestCaseInput } from '@devnest/shared';
import {
  findNodeById,
  updateNodeContent,
  toggleFolderState,
  addNodeToTree,
  deleteNodeFromTree,
  renameNodeInTree,
  detectMonacoLanguage,
} from '../../services/mockProjectService';
import { projectApiService } from '../../services/projectApi';
import { executionApi } from '../../services/executionApi';
import { TopToolbar } from './TopToolbar';
import { Sidebar } from './Sidebar';
import { EditorTabs } from './EditorTabs';
import { MonacoEditorPane } from './MonacoEditorPane';
import { BottomPanel } from './BottomPanel';
import { StatusBar } from './StatusBar';
import { RunNoticeModal } from './RunNoticeModal';

interface WorkspacePageProps {
  projectId: string;
  onBackToDashboard: () => void;
  onShowToast: (title: string, description?: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  projectId,
  onBackToDashboard,
  onShowToast,
}) => {
  const [project, setProject] = useState<WorkspaceProject | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState<string>('');
  const [cursorPosition, setCursorPosition] = useState<EditorCursorPosition>({
    lineNumber: 1,
    column: 1,
  });

  // UI Panels state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [bottomTab, setBottomTab] = useState<BottomPanelTab>('output');
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  // M5: Execution Telemetry, Stdin & Multi-Test Runner State
  const [customStdin, setCustomStdin] = useState<string>('');
  const [testCases, setTestCases] = useState<TestCaseInput[]>([
    { id: '1', input: 'Hello\n', expectedOutput: 'Hello\n' },
    { id: '2', input: 'DevNest\n', expectedOutput: 'DevNest\n' },
  ]);
  const [latestResult, setLatestResult] = useState<ExecutionResult | null>(null);
  const [testResults, setTestResults] = useState<BatchTestResult | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const executionSeqRef = useRef<number>(0);


  // Load project on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    projectApiService.getProjectById(projectId).then((proj) => {
      if (!isMounted) return;
      if (!proj) {
        onShowToast('Project not found', 'Returning to dashboard', 'error');
        onBackToDashboard();
        return;
      }

      setProject(proj);
      setFiles(proj.rootFiles);

      // Find initial entry file or first file to open
      let initialFile: FileNode | null = null;
      const findFirstFile = (nodes: FileNode[]) => {
        for (const n of nodes) {
          if (n.type === 'file') {
            if (n.isEntry) {
              initialFile = n;
              return;
            }
            if (!initialFile) initialFile = n;
          }
          if (n.children) findFirstFile(n.children);
        }
      };
      findFirstFile(proj.rootFiles);

      if (initialFile) {
        const file = initialFile as FileNode;
        setTabs([
          {
            fileId: file.id,
            fileName: file.name,
            filePath: file.path,
            isDirty: false,
            language: detectMonacoLanguage(file.name),
          },
        ]);
        setActiveFileId(file.id);
        setActiveContent(file.content || '');
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Current active tab object
  const activeTab = tabs.find((t) => t.fileId === activeFileId);
  const isDirty = activeTab ? activeTab.isDirty : false;

  // Handle saving the current active file
  const handleSave = useCallback(async () => {
    if (!activeFileId || !project) return;

    // Update in-memory file tree
    const updatedFiles = updateNodeContent(files, activeFileId, activeContent);
    setFiles(updatedFiles);

    // Mark tab as clean
    setTabs((prev) =>
      prev.map((t) => (t.fileId === activeFileId ? { ...t, isDirty: false } : t))
    );

    // Persist to real API
    await projectApiService.updateProjectFiles(project.id, updatedFiles);
    onShowToast('Saved', `Saved ${activeTab?.fileName || 'file'}.`, 'success');
  }, [activeFileId, project, files, activeContent, activeTab, onShowToast]);

  // Keyboard shortcut listener for Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Handle file selection from Explorer
  const handleSelectFile = (file: FileNode) => {
    if (file.type !== 'file') return;

    // Check if tab already exists
    const existing = tabs.find((t) => t.fileId === file.id);
    if (existing) {
      setActiveFileId(file.id);
      // Read latest content from file node or memory
      const node = findNodeById(files, file.id);
      setActiveContent(node?.content || '');
    } else {
      // Add new tab
      const newTab: OpenTab = {
        fileId: file.id,
        fileName: file.name,
        filePath: file.path,
        isDirty: false,
        language: detectMonacoLanguage(file.name),
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveFileId(file.id);
      setActiveContent(file.content || '');
    }
  };

  // Tab switching
  const handleSelectTab = (fileId: string) => {
    setActiveFileId(fileId);
    const node = findNodeById(files, fileId);
    setActiveContent(node?.content || '');
  };

  // Closing a tab
  const handleCloseTab = (fileId: string, _force = false) => {
    const closingIndex = tabs.findIndex((t) => t.fileId === fileId);
    if (closingIndex === -1) return;

    const newTabs = tabs.filter((t) => t.fileId !== fileId);
    setTabs(newTabs);

    if (activeFileId === fileId) {
      if (newTabs.length > 0) {
        // Switch to adjacent tab
        const nextIndex = Math.min(closingIndex, newTabs.length - 1);
        const nextTab = newTabs[nextIndex];
        setActiveFileId(nextTab.fileId);
        const nextNode = findNodeById(files, nextTab.fileId);
        setActiveContent(nextNode?.content || '');
      } else {
        setActiveFileId(null);
        setActiveContent('');
      }
    }
  };

  // Editor content change
  const handleChangeContent = (newContent: string) => {
    setActiveContent(newContent);
    // Mark active tab dirty if content changed
    setTabs((prev) =>
      prev.map((t) => (t.fileId === activeFileId ? { ...t, isDirty: true } : t))
    );
  };

  // Explorer folder toggle
  const handleToggleFolder = (folderId: string) => {
    setFiles((prev) => toggleFolderState(prev, folderId));
  };

  // File/Folder creation
  const handleCreateItem = async (
    name: string,
    type: FileSystemItemType,
    parentFolderId: string | null
  ) => {
    if (!project) return;

    const parentNode = parentFolderId ? findNodeById(files, parentFolderId) : null;
    const parentPath = parentNode ? parentNode.path : '';
    const itemPath = parentPath ? `${parentPath}/${name}` : name;

    const newItem: FileNode = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      path: itemPath,
      type,
      isOpen: type === 'folder' ? true : undefined,
      children: type === 'folder' ? [] : undefined,
      content:
        type === 'file'
          ? `// DevNest File: ${name}\n`
          : undefined,
    };

    const updated = addNodeToTree(files, parentFolderId, newItem);
    setFiles(updated);
    await projectApiService.updateProjectFiles(project.id, updated);

    // If file, open it in tabs immediately
    if (type === 'file') {
      handleSelectFile(newItem);
    }

    onShowToast(
      `${type === 'file' ? 'File' : 'Folder'} Created`,
      `"${name}" added to project.`,
      'success'
    );
  };

  // Delete node
  const handleDeleteNode = async (nodeId: string) => {
    if (!project) return;
    const node = findNodeById(files, nodeId);
    if (!node) return;

    const updated = deleteNodeFromTree(files, nodeId);
    setFiles(updated);
    await projectApiService.updateProjectFiles(project.id, updated);

    // If active tab or open tab was deleted, remove from tabs
    handleCloseTab(nodeId, true);
    onShowToast('Removed', `"${node.name}" removed from project.`, 'warning');
  };

  // Rename node
  const handleRenameNode = async (nodeId: string, newName: string) => {
    if (!project) return;
    const updated = renameNodeInTree(files, nodeId, newName);
    setFiles(updated);
    await projectApiService.updateProjectFiles(project.id, updated);

    // Update tab name if open
    setTabs((prev) =>
      prev.map((t) =>
        t.fileId === nodeId
          ? {
              ...t,
              fileName: newName,
              language: detectMonacoLanguage(newName),
            }
          : t
      )
    );

    onShowToast('Renamed', `Item renamed to "${newName}".`, 'info');
  };

  // Change primary language
  const handleLanguageChange = async (lang: SupportedLanguage) => {
    if (!project) return;
    await projectApiService.updateProjectLanguage(project.id, lang);
    setProject((prev) => (prev ? { ...prev, language: lang } : null));
    onShowToast('Language Updated', `Project environment set to ${lang.toUpperCase()}.`, 'info');
  };

  // Run button handler — executes code via OnlineCompiler.io backend proxy
  const handleRun = async () => {
    if (!project || isExecuting || isRunningTests) return;

    setIsBottomPanelOpen(true);
    setBottomTab('output');

    // Get source code to run: prioritize active file content or project entry file
    let codeToRun = activeContent;
    if (!codeToRun || !activeFileId) {
      const entryNode =
        files.find((f) => f.isEntry && f.type === 'file') ||
        files.find((f) => f.type === 'file');
      if (entryNode && entryNode.content) {
        codeToRun = entryNode.content;
      }
    }

    if (!codeToRun || !codeToRun.trim()) {
      onShowToast('Empty Code', 'Please open a file with code before running.', 'warning');
      return;
    }

    // Auto-save active file if dirty so persistence stays in sync
    if (activeFileId && isDirty) {
      handleSave();
    }

    const currentSeq = ++executionSeqRef.current;
    setIsExecuting(true);
    const timestamp = new Date().toLocaleTimeString();
    const startMsg = `[${timestamp}] [DevNest Engine] Running ${project.title} (${project.language.toUpperCase()})...`;
    setOutputLogs((prev) => [...prev, startMsg]);

    try {
      const result = await executionApi.executeCode({
        language: project.language,
        sourceCode: codeToRun,
        stdin: customStdin,
        projectId: project.id,
      });

      // Discard stale response if a newer execution occurred
      if (executionSeqRef.current !== currentSeq) {
        return;
      }

      setLatestResult(result);

      const lines: string[] = [];

      if (result.stdout) {
        lines.push(result.stdout);
      }

      if (result.compileOutput) {
        lines.push(`[Compile Error]\n${result.compileOutput}`);
      } else if (result.stderr) {
        lines.push(`[Error]\n${result.stderr}`);
      }

      const { telemetry } = result;
      const timeDisplay = telemetry.timeMs != null ? `${telemetry.timeMs}ms` : 'N/A';
      const memDisplay = telemetry.memoryKb != null ? `${telemetry.memoryKb}KB` : 'N/A';
      const exitDisplay = telemetry.exitCode != null ? telemetry.exitCode : 'N/A';

      lines.push(
        `[Finished in ${timeDisplay} | Memory: ${memDisplay} | Exit Code: ${exitDisplay} | Status: ${telemetry.statusDescription}]`
      );

      setOutputLogs((prev) => [...prev, ...lines]);

      if (telemetry.status === 'success') {
        onShowToast('Execution Succeeded', `Process finished with exit code ${telemetry.exitCode}.`, 'success');
      } else {
        onShowToast('Execution Notice', telemetry.statusDescription, 'warning');
      }
    } catch (err: unknown) {
      if (executionSeqRef.current !== currentSeq) return;
      const message = err instanceof Error ? err.message : 'Execution failed';
      setOutputLogs((prev) => [...prev, `[Error] ${message}`]);
      onShowToast('Execution Error', message, 'error');
    } finally {
      if (executionSeqRef.current === currentSeq) {
        setIsExecuting(false);
      }
    }
  };

  // Run Tests button handler — executes test suite via OnlineCompiler.io test runner
  const handleRunTests = async () => {
    if (!project || isExecuting || isRunningTests) return;

    if (testCases.length === 0) {
      onShowToast('No Test Cases', 'Please add at least one test case before running tests.', 'warning');
      return;
    }

    setIsBottomPanelOpen(true);
    setBottomTab('tests');

    let codeToRun = activeContent;
    if (!codeToRun || !activeFileId) {
      const entryNode =
        files.find((f) => f.isEntry && f.type === 'file') ||
        files.find((f) => f.type === 'file');
      if (entryNode && entryNode.content) {
        codeToRun = entryNode.content;
      }
    }

    if (!codeToRun || !codeToRun.trim()) {
      onShowToast('Empty Code', 'Please open a file with code before running tests.', 'warning');
      return;
    }

    if (activeFileId && isDirty) {
      handleSave();
    }

    const currentSeq = ++executionSeqRef.current;
    setIsRunningTests(true);

    try {
      const result = await executionApi.runTests({
        language: project.language,
        sourceCode: codeToRun,
        tests: testCases,
        projectId: project.id,
      });

      if (executionSeqRef.current !== currentSeq) {
        return;
      }

      setTestResults(result);

      if (result.verdict === 'accepted') {
        onShowToast(
          'All Tests Passed',
          `100% score — all ${result.passedCount} test cases passed successfully!`,
          'success'
        );
      } else if (result.verdict === 'compilation_error') {
        onShowToast('Compilation Error', 'Code failed to compile for the test suite.', 'error');
      } else {
        onShowToast(
          'Tests Completed',
          `Verdict: ${result.verdict.toUpperCase().replace(/_/g, ' ')} (${result.passedCount}/${result.totalCount} passed)`,
          'warning'
        );
      }
    } catch (err: unknown) {
      if (executionSeqRef.current !== currentSeq) return;
      const message = err instanceof Error ? err.message : 'Test runner failed';
      onShowToast('Test Runner Error', message, 'error');
    } finally {
      if (executionSeqRef.current === currentSeq) {
        setIsRunningTests(false);
      }
    }
  };


  if (isLoading || !project) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <svg className="animate-spin h-8 w-8 text-brand-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-xs">Loading Cloud Workspace...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Toolbar */}
      <TopToolbar
        projectName={project.title}
        language={project.language}
        isDirty={isDirty}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        onSave={handleSave}
        onBackToDashboard={onBackToDashboard}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenHelp={() => setIsRunModalOpen(true)}
        isSidebarOpen={isSidebarOpen}
        isRunning={isExecuting || isRunningTests}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Explorer Sidebar */}
        <Sidebar
          files={files}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
          onToggleFolder={handleToggleFolder}
          onDeleteNode={handleDeleteNode}
          onRenameNode={handleRenameNode}
          onCreateItem={handleCreateItem}
          isOpen={isSidebarOpen}
        />

        {/* Center: Tabs + Monaco Editor + Bottom Panel */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          {/* Tab Bar */}
          <EditorTabs
            tabs={tabs}
            activeTabId={activeFileId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
          />

          {/* Monaco Editor Pane */}
          <MonacoEditorPane
            fileName={activeTab?.fileName || null}
            content={activeContent}
            onChangeContent={handleChangeContent}
            onCursorChange={setCursorPosition}
            onSaveShortcut={handleSave}
          />

          {/* Bottom Panel (Execution Console, Stdin, Test Cases, Problems, Terminal) */}
          <BottomPanel
            activeTab={bottomTab}
            onTabChange={setBottomTab}
            isOpen={isBottomPanelOpen}
            onToggleOpen={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
            outputLog={outputLogs}
            onClearOutput={() => setOutputLogs([])}
            latestResult={latestResult}
            isExecuting={isExecuting}
            stdin={customStdin}
            onStdinChange={setCustomStdin}
            testCases={testCases}
            onTestCasesChange={setTestCases}
            testResults={testResults}
            isRunningTests={isRunningTests}
            onRunTests={handleRunTests}
            onRunCode={handleRun}
          />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        activeFileName={activeTab?.fileName || null}
        cursorPosition={cursorPosition}
        isDirty={isDirty}
      />

      {/* Milestone 1 Run Notification Modal */}
      <RunNoticeModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        projectName={project.title}
        language={project.language}
      />
    </div>
  );
};
