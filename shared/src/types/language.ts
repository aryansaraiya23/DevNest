export type SupportedLanguage = 'javascript' | 'python' | 'cpp' | 'java';

export interface LanguageConfig {
  id: SupportedLanguage;
  name: string;
  extension: string;
  monacoLanguage: string;
  judge0LanguageId: number;
  defaultFileName: string;
  boilerplate: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  javascript: {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    extension: 'js',
    monacoLanguage: 'javascript',
    judge0LanguageId: 63, // JavaScript (Node.js 12.14.0 or modern equivalent)
    defaultFileName: 'index.js',
    boilerplate: `// DevNest JavaScript Environment\nconsole.log("Hello from DevNest!");\n`,
  },
  python: {
    id: 'python',
    name: 'Python 3',
    extension: 'py',
    monacoLanguage: 'python',
    judge0LanguageId: 71, // Python (3.8.1 or modern equivalent)
    defaultFileName: 'main.py',
    boilerplate: `# DevNest Python Environment\nprint("Hello from DevNest!")\n`,
  },
  cpp: {
    id: 'cpp',
    name: 'C++ (GCC)',
    extension: 'cpp',
    monacoLanguage: 'cpp',
    judge0LanguageId: 54, // C++ (GCC 9.2.0)
    defaultFileName: 'main.cpp',
    boilerplate: `#include <iostream>\n\nint main() {\n    std::cout << "Hello from DevNest!" << std::endl;\n    return 0;\n}\n`,
  },
  java: {
    id: 'java',
    name: 'Java (OpenJDK)',
    extension: 'java',
    monacoLanguage: 'java',
    judge0LanguageId: 62, // Java (OpenJDK 13.0.1)
    defaultFileName: 'Main.java',
    boilerplate: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from DevNest!");\n    }\n}\n`,
  },
};
