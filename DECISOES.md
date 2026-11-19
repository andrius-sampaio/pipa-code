# DECISOES.md — Decisões técnicas do Pipa Code

Este arquivo registra decisões importantes e o motivo. Formato: data, decisão, motivo.

## 2026-11-19 — Fase 0

### 1. Interface: Preact (em vez de JavaScript puro)
- **Decisão:** usar Preact (3 KB) para a interface.
- **Motivo:** componentes reutilizáveis, ergonomia, ainda muito leve; evita código imperativo difícil de manter. React completo foi descartado por tamanho.

### 2. Linguagem: TypeScript (modo estrito)
- **Decisão:** TypeScript em vez de JavaScript puro com JSDoc.
- **Motivo:** autocompletar e segurança de tipos ajudam a manter o projeto; a complexidade é aceitável. O professor pode editar arquivos .ts simples.

### 3. Nome do projeto: Pipa Code
- **Decisão:** manter "Pipa Code" até validação com a turma.

### 4. PWA: vite-plugin-pwa
- **Decisão:** usar vite-plugin-pwa (workbox) para Service Worker e manifest.
- **Motivo:** gera cache versionado e limpeza de versões antigas sem código manual; é devDependency, não afeta o bundle do app.

### 5. Vulnerabilidades moderadas em devDependencies
- **Decisão:** manter versões atuais de vite-plugin-pwa (1.2.x). As 4 vulnerabilidades moderadas estão em `glob`/`minimatch` via `workbox-build` (dev only) e não afetam o app publicado. Corrigir forçaria downgrade para 1.1.0.
- **Reavaliar:** quando houver versão corrigida sem downgrade.

### 6. Tema padrão: escuro
- **Decisão:** tema escuro por padrão (conforme spec).

### 7. Fonte monoespaçada: do sistema
- **Decisão:** usar fonte monoespaçada do sistema (sem download externo), conforme restrição offline.
## 2026-11-19 - Fase 7

### 8. Python: Pyodide (escolhido) vs Skulpt (alternativa)
- Comparacao: Pyodide (Python 3, ~14 MB, WASM, mais compativel) vs Skulpt (Python 2, ~1-2 MB, JS puro, menos compativel).
- Decisao: usar Pyodide como padrao, carregado sob demanda com aviso de tamanho e cache offline. Skulpt fica como alternativa futura.
- Implementacao: arquivos em public/pyodide/, cache-first no Service Worker, botao Parar recarrega instancia, tempo maximo padrao 10s.
