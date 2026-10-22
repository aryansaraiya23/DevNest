import { User } from '../types/auth';
import { WorkspaceProject } from '../types/project';
import { FileNode } from '../types/files';

export const DEMO_USER: User = {
  id: 'usr_demo_42',
  name: 'Alex Chen',
  email: 'demo@devnest.io',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  createdAt: '2026-09-15T10:00:00.000Z',
};

export const INITIAL_WORKSPACE_FILES: FileNode[] = [
  {
    id: 'folder_src',
    name: 'src',
    path: 'src',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'file_main_cpp',
        name: 'main.cpp',
        path: 'src/main.cpp',
        type: 'file',
        isEntry: true,
        content: `// ==============================================================================
// DevNest Cloud IDE — Multi-File C++ Example
// Project: Graph Traversal & Matrix Operations
// ==============================================================================

#include <iostream>
#include <vector>
#include <string>
#include "utils.h"

int main() {
    std::cout << "========================================" << std::endl;
    std::cout << "  Welcome to DevNest Cloud IDE (C++ 20) " << std::endl;
    std::cout << "========================================" << std::endl;

    std::vector<int> numbers = {14, 28, 56, 112, 224};
    std::cout << "Calculating statistics for dataset..." << std::endl;
    
    double avg = computeAverage(numbers);
    int maxVal = findMaximum(numbers);

    printReport("Cluster Alpha", avg, maxVal);

    std::cout << "\\n[System] Workspace initialized successfully." << std::endl;
    return 0;
}
`,
      },
      {
        id: 'file_utils_cpp',
        name: 'utils.cpp',
        path: 'src/utils.cpp',
        type: 'file',
        content: `// ==============================================================================
// Implementation: Statistical Utility Functions
// ==============================================================================

#include "utils.h"
#include <iostream>
#include <numeric>
#include <algorithm>

double computeAverage(const std::vector<int>& data) {
    if (data.empty()) return 0.0;
    double sum = std::accumulate(data.begin(), data.end(), 0.0);
    return sum / data.size();
}

int findMaximum(const std::vector<int>& data) {
    if (data.empty()) return 0;
    return *std::max_element(data.begin(), data.end());
}

void printReport(const std::string& title, double average, int maxVal) {
    std::cout << "----------------------------------------" << std::endl;
    std::cout << "Report: " << title << std::endl;
    std::cout << "  Average Value: " << average << std::endl;
    std::cout << "  Peak Value   : " << maxVal << std::endl;
    std::cout << "----------------------------------------" << std::endl;
}
`,
      },
    ],
  },
  {
    id: 'folder_include',
    name: 'include',
    path: 'include',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'file_utils_h',
        name: 'utils.h',
        path: 'include/utils.h',
        type: 'file',
        content: `// ==============================================================================
// Header: Statistical Utility Declarations
// ==============================================================================

#pragma once

#include <vector>
#include <string>

double computeAverage(const std::vector<int>& data);
int findMaximum(const std::vector<int>& data);
void printReport(const std::string& title, double average, int maxVal);
`,
      },
    ],
  },
  {
    id: 'folder_scripts',
    name: 'scripts',
    path: 'scripts',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'file_script_py',
        name: 'script.py',
        path: 'scripts/script.py',
        type: 'file',
        content: `#!/usr/bin/env python3
"""
DevNest Data Verification Utility
Simulates pipeline telemetry validation and data benchmarking.
"""

import time
import math

def run_simulation(cycles: int = 5):
    print(f"[Python Runner] Launching telemetry simulation for {cycles} cycles...")
    for step in range(1, cycles + 1):
        load = math.sin(step) * 50 + 50
        print(f"  Cycle {step:02d}: System Load = {load:.2f}% | Latency = {step * 4.2:.1f}ms")
        time.sleep(0.05)
    print("[Python Runner] Simulation finished with zero anomalies.")

if __name__ == "__main__":
    run_simulation()
`,
      },
    ],
  },
  {
    id: 'file_readme_md',
    name: 'README.md',
    path: 'README.md',
    type: 'file',
    content: `# DevNest Workspace — Multi-Language Sandbox

Welcome to your in-browser cloud workspace.

## Project Structure
- \`src/main.cpp\`: Primary application entry point.
- \`src/utils.cpp\`: Mathematical computation and helper routines.
- \`include/utils.h\`: Shared function declarations.
- \`scripts/script.py\`: Automated telemetry benchmark runner.

## Editing & Shortcuts
- **Switch files:** Click any file in the Explorer on the left or click open tabs.
- **Save file:** Press \`Ctrl + S\` (\`Cmd + S\` on macOS) or click the Save icon.
- **Run preview:** Click the **Run** button on the top toolbar.

*Note: Sandboxed remote code execution will be connected in Milestone 3.*
`,
  },
];

export const INITIAL_MOCK_PROJECTS: WorkspaceProject[] = [
  {
    id: 'proj_cpp_algorithms',
    title: 'C++ Systems & Graph Engine',
    description: 'High-performance multi-file C++ project with custom statistics and graph utilities.',
    language: 'cpp',
    ownerId: 'usr_demo_42',
    ownerName: 'Alex Chen',
    createdAt: '2026-10-18T14:30:00.000Z',
    updatedAt: '2026-10-22T08:15:00.000Z',
    rootFiles: INITIAL_WORKSPACE_FILES,
  },
  {
    id: 'proj_python_analyzer',
    title: 'Python Telemetry & Math Pipeline',
    description: 'Data analytics service computing numerical simulation benchmarks and latency statistics.',
    language: 'python',
    ownerId: 'usr_demo_42',
    ownerName: 'Alex Chen',
    createdAt: '2026-10-19T09:00:00.000Z',
    updatedAt: '2026-10-21T18:40:00.000Z',
    rootFiles: [
      {
        id: 'py_main',
        name: 'main.py',
        path: 'main.py',
        type: 'file',
        isEntry: true,
        content: `"""
DevNest Python Data Pipeline
"""
import sys

def main():
    print("DevNest Python Environment running on Python 3.12")
    data = [12, 45, 68, 92, 105]
    print(f"Data elements: {data}")
    print(f"Sum: {sum(data)} | Min: {min(data)} | Max: {max(data)}")

if __name__ == '__main__':
    main()
`,
      },
      {
        id: 'py_readme',
        name: 'README.md',
        path: 'README.md',
        type: 'file',
        content: `# Python Pipeline Project\n\nRun \`main.py\` to compute statistics.`,
      },
    ],
  },
  {
    id: 'proj_node_service',
    title: 'Express Microservice Prototype',
    description: 'REST API service scaffold using JavaScript/Node.js with structured route handlers.',
    language: 'javascript',
    ownerId: 'usr_demo_42',
    ownerName: 'Alex Chen',
    createdAt: '2026-10-20T11:20:00.000Z',
    updatedAt: '2026-10-20T16:05:00.000Z',
    rootFiles: [
      {
        id: 'js_index',
        name: 'index.js',
        path: 'index.js',
        type: 'file',
        isEntry: true,
        content: `// DevNest JavaScript Service
console.log("DevNest JavaScript Engine active.");
const serverPort = 8080;
console.log(\`Mock microservice listening on port \${serverPort}\`);
`,
      },
    ],
  },
];
