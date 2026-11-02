import React, { useState } from 'react';
import { ExecutionResult, BatchTestResult, TestCaseInput, TestVerdict } from '@devnest/shared';
import { BottomPanelTab } from '../../types/ide';
import {
  Terminal as TerminalIcon,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Cpu,
  Sparkles,
  Play,
  Plus,
  Trash2,
  Copy,
  Check,
  ArrowDownToLine,
  ListChecks,
} from 'lucide-react';

interface BottomPanelProps {
  activeTab: BottomPanelTab;
  onTabChange: (tab: BottomPanelTab) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  outputLog?: string[];
  onClearOutput?: () => void;
  latestResult?: ExecutionResult | null;
  isExecuting?: boolean;
  stdin: string;
  onStdinChange: (val: string) => void;
  testCases: TestCaseInput[];
  onTestCasesChange: (cases: TestCaseInput[]) => void;
  testResults: BatchTestResult | null;
  isRunningTests?: boolean;
  onRunTests: () => void;
  onRunCode?: () => void;
}

export function formatTime(timeMs: number | null): string {
  if (timeMs === null || timeMs === undefined || isNaN(timeMs)) return 'N/A';
  if (timeMs < 1000) return `${timeMs}ms`;
  return `${(timeMs / 1000).toFixed(2)}s`;
}

export function formatMemory(memoryKb: number | null): string {
  if (memoryKb === null || memoryKb === undefined || isNaN(memoryKb)) return 'N/A';
  if (memoryKb < 1024) return `${memoryKb} KB`;
  return `${(memoryKb / 1024).toFixed(1)} MB (${memoryKb.toLocaleString()} KB)`;
}

export function getVerdictBadgeClass(verdict: TestVerdict): string {
  switch (verdict) {
    case 'accepted':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'wrong_answer':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'time_limit_exceeded':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'memory_limit_exceeded':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'compilation_error':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    case 'runtime_error':
    case 'error':
    default:
      return 'bg-red-500/15 text-red-400 border-red-500/30';
  }
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onToggleOpen,
  outputLog = [],
  onClearOutput,
  latestResult,
  isExecuting = false,
  stdin,
  onStdinChange,
  testCases,
  onTestCasesChange,
  testResults,
  isRunningTests = false,
  onRunTests,
  onRunCode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddTestCase = () => {
    if (testCases.length >= 10) return;
    const newCase: TestCaseInput = {
      id: `${Date.now()}`,
      input: '',
      expectedOutput: '',
    };
    const updated = [...testCases, newCase];
    onTestCasesChange(updated);
    setSelectedCaseIndex(updated.length - 1);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length <= 1) return;
    const updated = testCases.filter((_, i) => i !== index);
    onTestCasesChange(updated);
    setSelectedCaseIndex(Math.min(selectedCaseIndex, updated.length - 1));
  };

  const handleUpdateTestCase = (index: number, field: 'input' | 'expectedOutput', val: string) => {
    const updated = testCases.map((tc, i) => (i === index ? { ...tc, [field]: val } : tc));
    onTestCasesChange(updated);
  };

  if (!isOpen) {
    return (
      <div className="h-7 bg-slate-950 border-t border-slate-800 px-3 flex items-center justify-between select-none">
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={onToggleOpen}
            className="flex items-center space-x-1.5 text-slate-400 hover:text-slate-200 transition-colors py-0.5"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px] uppercase tracking-wider">Show Execution Console</span>
          </button>
        </div>
      </div>
    );
  }

  const activeTestCase = testCases[selectedCaseIndex] || testCases[0];
  const activeCaseResult = testResults?.tests?.[selectedCaseIndex];

  return (
    <div
      className={`border-t border-slate-800 bg-slate-950 flex flex-col transition-all duration-200 select-none ${
        isExpanded ? 'h-80 sm:h-96' : 'h-52 sm:h-60'
      }`}
    >
      {/* Panel header bar */}
      <div className="h-9 border-b border-slate-800 px-2 flex items-center justify-between shrink-0 bg-slate-950">
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
          {/* Output Tab */}
          <button
            onClick={() => onTabChange('output')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
              activeTab === 'output'
                ? 'bg-slate-850 text-brand-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Output</span>
            {isExecuting && (
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
            )}
          </button>

          {/* Standard Input Tab */}
          <button
            onClick={() => onTabChange('input')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
              activeTab === 'input'
                ? 'bg-slate-850 text-brand-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Input (stdin)</span>
            {stdin.trim().length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            )}
          </button>

          {/* Test Cases Tab */}
          <button
            onClick={() => onTabChange('tests')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
              activeTab === 'tests'
                ? 'bg-slate-850 text-brand-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Test Cases</span>
            {testResults && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                  testResults.verdict === 'accepted'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {testResults.passedCount}/{testResults.totalCount}
              </span>
            )}
          </button>

          {/* Problems Tab */}
          <button
            onClick={() => onTabChange('problems')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
              activeTab === 'problems'
                ? 'bg-slate-850 text-brand-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Problems</span>
            {latestResult?.telemetry.status === 'compilation_error' && (
              <span className="text-[10px] px-1.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">1</span>
            )}
          </button>

          {/* Terminal Tab */}
          <button
            onClick={() => onTabChange('terminal')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs transition-colors shrink-0 ${
              activeTab === 'terminal'
                ? 'bg-slate-850 text-brand-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Terminal</span>
            <span className="text-[9px] uppercase px-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Planned
            </span>
          </button>
        </div>

        {/* Panel controls */}
        <div className="flex items-center space-x-1 text-slate-400 shrink-0">
          {activeTab === 'output' && outputLog.length > 0 && onClearOutput && (
            <button
              onClick={onClearOutput}
              title="Clear output console"
              className="text-[11px] px-2 py-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors"
            >
              Clear
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Restore Size' : 'Maximize Panel'}
            className="p-1 rounded hover:bg-slate-850 hover:text-slate-200 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggleOpen}
            title="Collapse Panel"
            className="p-1 rounded hover:bg-slate-850 hover:text-slate-200 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Panel tab content */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-slate-300 bg-slate-950/95">
        {/* ================= OUTPUT TAB ================= */}
        {activeTab === 'output' && (
          <div className="space-y-3 select-text">
            {/* Loading / Execution State */}
            {isExecuting && (
              <div className="p-3 bg-brand-950/30 border border-brand-500/30 rounded-xl flex items-center space-x-3 text-brand-300 font-sans">
                <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold">Executing program...</span>
                  <span className="text-brand-400/80 ml-1.5">Running in isolated sandboxed worker.</span>
                </div>
              </div>
            )}

            {/* Telemetry Bar when latest result is present */}
            {latestResult && !isExecuting && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-sans space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  {/* Status Badge */}
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        latestResult.telemetry.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : latestResult.telemetry.status === 'compilation_error'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : latestResult.telemetry.status === 'time_limit_exceeded'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : latestResult.telemetry.status === 'memory_limit_exceeded'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {latestResult.telemetry.status === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      <span>{latestResult.telemetry.statusDescription}</span>
                    </span>

                    {latestResult.telemetry.exitCode !== null && (
                      <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-mono">
                        Exit code: {latestResult.telemetry.exitCode}
                      </span>
                    )}
                  </div>

                  {/* Telemetry Metrics */}
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <div className="flex items-center space-x-1" title="Execution Time">
                      <Clock className="w-3.5 h-3.5 text-brand-400" />
                      <span>Time:</span>
                      <span className="font-semibold text-slate-200">
                        {formatTime(latestResult.telemetry.timeMs)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1" title="Memory Consumption">
                      <Cpu className="w-3.5 h-3.5 text-brand-400" />
                      <span>Memory:</span>
                      <span className="font-semibold text-slate-200">
                        {formatMemory(latestResult.telemetry.memoryKb)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compilation Error Block */}
                {latestResult.compileOutput && (
                  <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-rose-400 text-xs font-semibold font-sans">
                      <div className="flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Compilation Error</span>
                      </div>
                      <button
                        onClick={() => handleCopy(latestResult.compileOutput || '', 'compile')}
                        className="text-[11px] text-rose-300 hover:text-white flex items-center space-x-1"
                      >
                        {copiedField === 'compile' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'compile' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-rose-200/90 whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                      {latestResult.compileOutput}
                    </pre>
                  </div>
                )}

                {/* Standard Error / Runtime Error Block */}
                {latestResult.stderr && !latestResult.compileOutput && (
                  <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-red-400 text-xs font-semibold font-sans">
                      <div className="flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Standard Error</span>
                      </div>
                      <button
                        onClick={() => handleCopy(latestResult.stderr || '', 'stderr')}
                        className="text-[11px] text-red-300 hover:text-white flex items-center space-x-1"
                      >
                        {copiedField === 'stderr' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'stderr' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="text-red-200/90 whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                      {latestResult.stderr}
                    </pre>
                  </div>
                )}

                {/* Standard Output Block */}
                {latestResult.stdout && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-sans">
                      <span className="font-semibold text-slate-300">Standard Output</span>
                      <button
                        onClick={() => handleCopy(latestResult.stdout || '', 'stdout')}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                      >
                        {copiedField === 'stdout' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'stdout' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-emerald-300 whitespace-pre-wrap font-mono text-xs leading-relaxed overflow-x-auto">
                      {latestResult.stdout}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Introductory card when no run has occurred yet */}
            {!latestResult && !isExecuting && outputLog.length === 0 && (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 font-sans">
                <div className="flex items-center space-x-2 text-brand-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>DevNest Execution Console & Telemetry</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Click <strong className="text-brand-300">Run</strong> in the toolbar to execute your active code on an isolated runner. Execution telemetry, stdout, stderr, and compiler diagnostics will appear here.
                </p>
                <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800/80 flex items-center space-x-2">
                  <span>Standard input is available under the <strong>Input (stdin)</strong> tab.</span>
                </div>
              </div>
            )}

            {/* Session log lines */}
            {outputLog.length > 0 && (
              <div className="pt-1 space-y-0.5">
                <div className="text-[11px] text-slate-500 font-sans pb-1">Session Stream</div>
                {outputLog.map((line, idx) => {
                  const isError = line.startsWith('[Error]') || line.includes('Error:') || line.startsWith('[Compile Error]');
                  const isTelemetry = line.startsWith('[Finished') || line.startsWith('[DevNest Engine]');
                  const textColor = isError
                    ? 'text-red-400'
                    : isTelemetry
                    ? 'text-brand-300'
                    : 'text-slate-200';

                  return (
                    <div key={idx} className={`${textColor} py-0.5 whitespace-pre-wrap font-mono leading-relaxed`}>
                      {line}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= INPUT (STDIN) TAB ================= */}
        {activeTab === 'input' && (
          <div className="h-full flex flex-col space-y-2 select-text font-sans">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-1.5">
                <ArrowDownToLine className="w-3.5 h-3.5 text-brand-400" />
                <span className="font-semibold text-slate-200">Standard Input (stdin)</span>
                <span className="text-[11px] text-slate-500">
                  — fed into your program during execution and preserved across runs
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {stdin && (
                  <button
                    onClick={() => onStdinChange('')}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                  >
                    Clear Input
                  </button>
                )}
                {onRunCode && (
                  <button
                    onClick={onRunCode}
                    disabled={isExecuting || isRunningTests}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-slate-950" />
                    <span>Run with Stdin</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder="Enter standard input here (e.g. arguments or test inputs fed to your program on stdin)..."
              className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/80 resize-none transition-colors"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Characters: {stdin.length}</span>
              <span>Lines: {stdin ? stdin.split('\n').length : 0}</span>
            </div>
          </div>
        )}

        {/* ================= TEST CASES TAB ================= */}
        {activeTab === 'tests' && (
          <div className="space-y-3 font-sans select-text">
            {/* Top controls & Aggregate Verdict Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                {/* Aggregate Verdict */}
                {testResults ? (
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getVerdictBadgeClass(
                        testResults.verdict
                      )}`}
                    >
                      {testResults.verdict === 'accepted' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span className="uppercase tracking-wider">
                        {testResults.verdict.replace(/_/g, ' ')}
                      </span>
                    </span>

                    <span className="text-xs text-slate-300 font-semibold">
                      Passed: {testResults.passedCount} / {testResults.totalCount} ({Math.round(testResults.score ?? 0)}%)
                    </span>

                    {testResults.telemetry.totalTimeMs !== null && (
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-brand-400" />
                        <span>{formatTime(testResults.telemetry.totalTimeMs)}</span>
                      </span>
                    )}

                    {testResults.telemetry.peakMemoryKb !== null && (
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Cpu className="w-3 h-3 text-brand-400" />
                        <span>Peak: {formatMemory(testResults.telemetry.peakMemoryKb)}</span>
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <ListChecks className="w-4 h-4 text-brand-400" />
                    <span className="font-semibold text-slate-200">Test Cases Suite</span>
                    <span className="text-slate-500">({testCases.length} configured)</span>
                  </div>
                )}
              </div>

              {/* Actions: Run Tests and Add Test */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAddTestCase}
                  disabled={testCases.length >= 10 || isRunningTests}
                  className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors disabled:opacity-40"
                  title="Add another test case (max 10)"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Case</span>
                </button>

                <button
                  onClick={onRunTests}
                  disabled={isRunningTests || isExecuting}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                >
                  {isRunningTests ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Running Tests...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-slate-950" />
                      <span>Run All Tests</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test Case Selectors */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
              {testCases.map((tc, idx) => {
                const caseRes = testResults?.tests?.[idx];
                const isSelected = selectedCaseIndex === idx;

                return (
                  <button
                    key={tc.id || idx}
                    onClick={() => setSelectedCaseIndex(idx)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-slate-800 text-brand-300 border border-brand-500/30'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
                    }`}
                  >
                    {caseRes && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          caseRes.verdict === 'accepted' ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                      />
                    )}
                    <span>Case {idx + 1}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Test Case Detail */}
            {activeTestCase && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-3 font-sans">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200">Case {selectedCaseIndex + 1}</span>
                    {activeCaseResult && (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${getVerdictBadgeClass(
                          activeCaseResult.verdict
                        )}`}
                      >
                        {activeCaseResult.verdict.replace(/_/g, ' ')}
                      </span>
                    )}
                    {activeCaseResult?.timeMs !== null && activeCaseResult?.timeMs !== undefined && (
                      <span className="text-[11px] text-slate-400">
                        {formatTime(activeCaseResult.timeMs)}
                      </span>
                    )}
                    {activeCaseResult?.memoryKb !== null && activeCaseResult?.memoryKb !== undefined && (
                      <span className="text-[11px] text-slate-400">
                        {formatMemory(activeCaseResult.memoryKb)}
                      </span>
                    )}
                  </div>

                  {testCases.length > 1 && (
                    <button
                      onClick={() => handleRemoveTestCase(selectedCaseIndex)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Remove test case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Input field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Input (stdin):</label>
                    <textarea
                      value={activeTestCase.input}
                      onChange={(e) => handleUpdateTestCase(selectedCaseIndex, 'input', e.target.value)}
                      placeholder="Input for this test case..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/80 resize-none"
                    />
                  </div>

                  {/* Expected Output field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Expected Output:</label>
                    <textarea
                      value={activeTestCase.expectedOutput ?? ''}
                      onChange={(e) => handleUpdateTestCase(selectedCaseIndex, 'expectedOutput', e.target.value)}
                      placeholder="Expected output to match..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/80 resize-none"
                    />
                  </div>
                </div>

                {/* Actual Output if executed */}
                {activeCaseResult && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <span>Actual Output:</span>
                      <button
                        onClick={() => handleCopy(activeCaseResult.actualOutput || '', 'caseOutput')}
                        className="text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                      >
                        {copiedField === 'caseOutput' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'caseOutput' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre
                      className={`p-2.5 rounded-lg border font-mono text-xs whitespace-pre-wrap ${
                        activeCaseResult.verdict === 'accepted'
                          ? 'bg-slate-950 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-950 border-red-500/30 text-red-300'
                      }`}
                    >
                      {activeCaseResult.actualOutput || (activeCaseResult.error ? `Error: ${activeCaseResult.error}` : '(empty output)')}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= PROBLEMS TAB ================= */}
        {activeTab === 'problems' && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 font-sans p-4">
            {latestResult?.compileOutput ? (
              <div className="w-full max-w-2xl bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 text-left space-y-2">
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Compilation Problem Detected</span>
                </div>
                <pre className="font-mono text-xs text-rose-300/90 whitespace-pre-wrap overflow-x-auto">
                  {latestResult.compileOutput}
                </pre>
              </div>
            ) : (
              <div className="text-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-400/80 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-300">No problems detected</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Compilation and syntax errors will be highlighted here when detected.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= TERMINAL TAB ================= */}
        {activeTab === 'terminal' && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 font-sans p-4">
            <TerminalIcon className="w-8 h-8 text-slate-600 mb-2" />
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-300">Container Terminal</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                Scheduled Feature
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm text-center leading-relaxed">
              Interactive terminal access to an isolated container runner is scheduled for a future milestone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
