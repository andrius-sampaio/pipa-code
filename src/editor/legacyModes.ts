// Modos legacy (CodeMirror 5) carregados em um único chunk sob demanda.
// Importações estáticas com especificador literal: import dinâmico com variável
// não é suportado pelo bundler em produção.
import { StreamLanguage } from '@codemirror/language'
import { c, cpp, java, csharp, kotlin } from '@codemirror/legacy-modes/mode/clike'
import { go } from '@codemirror/legacy-modes/mode/go'
import { rust } from '@codemirror/legacy-modes/mode/rust'
import { ruby } from '@codemirror/legacy-modes/mode/ruby'
import { lua } from '@codemirror/legacy-modes/mode/lua'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { swift } from '@codemirror/legacy-modes/mode/swift'
import { xml } from '@codemirror/legacy-modes/mode/xml'
import { yaml } from '@codemirror/legacy-modes/mode/yaml'
import { standardSQL } from '@codemirror/legacy-modes/mode/sql'

export const LEGACY_MODES: Record<string, any> = {
  java: StreamLanguage.define(java),
  c: StreamLanguage.define(c),
  cpp: StreamLanguage.define(cpp),
  csharp: StreamLanguage.define(csharp),
  kotlin: StreamLanguage.define(kotlin),
  go: StreamLanguage.define(go),
  rust: StreamLanguage.define(rust),
  ruby: StreamLanguage.define(ruby),
  lua: StreamLanguage.define(lua),
  shell: StreamLanguage.define(shell),
  swift: StreamLanguage.define(swift),
  xml: StreamLanguage.define(xml),
  yaml: StreamLanguage.define(yaml),
  sql: StreamLanguage.define(standardSQL),
}
