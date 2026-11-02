export type SupportedLanguage = 'javascript' | 'python' | 'cpp' | 'java';

export interface LanguageConfig {
  id: SupportedLanguage;
  name: string;
  extension: string;
  monacoLanguage: string;
  compilerId: string;
  judge0LanguageId?: number;
  defaultFileName: string;
  boilerplate: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  javascript: {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    extension: 'js',
    monacoLanguage: 'javascript',
    compilerId: 'nodejs-24',
    judge0LanguageId: 63,
    defaultFileName: 'index.js',
    boilerplate: `// DevNest JavaScript Environment\nconsole.log("Hello from DevNest!");\n`,
  },
  python: {
    id: 'python',
    name: 'Python 3',
    extension: 'py',
    monacoLanguage: 'python',
    compilerId: 'python-3.14',
    judge0LanguageId: 71,
    defaultFileName: 'main.py',
    boilerplate: `# DevNest Python Environment\nprint("Hello from DevNest!")\n`,
  },
  cpp: {
    id: 'cpp',
    name: 'C++ (GCC)',
    extension: 'cpp',
    monacoLanguage: 'cpp',
    compilerId: 'g++-15',
    judge0LanguageId: 54,
    defaultFileName: 'main.cpp',
    boilerplate: `#include <iostream>\n\nint main() {\n    std::cout << "Hello from DevNest!" << std::endl;\n    return 0;\n}\n`,
  },
  java: {
    id: 'java',
    name: 'Java (OpenJDK)',
    extension: 'java',
    monacoLanguage: 'java',
    compilerId: 'openjdk-25',
    judge0LanguageId: 62,
    defaultFileName: 'Main.java',
    boilerplate: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from DevNest!");\n    }\n}\n`,
  },
};
