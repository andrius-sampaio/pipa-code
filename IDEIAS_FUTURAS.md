# IDEIAS FUTURAS (fora do escopo da v1)

## Funcionalidades maiores
- SQLite/Lua em WASM.
- IA local opcional para aparelhos potentes.
- Exercícios guiados com verificação automática.
- Modo "desafio".
- Painel do professor offline (exportação de relatórios).
- Traduções para outros idiomas.
- Lições passo a passo integradas ao Tutor (pasta `src/tutor/licoes` reservada).
- Progresso/badges do aluno (metas por lição).

## UX mobile (da conversa com o Gustavo)
- Barra de símbolos configurável por lição/linguagem (ou pelo próprio aluno).
- Split-view editor + preview em paisagem no celular.
- Mais atalhos de teclado físico: `Ctrl+Enter` executar, `Ctrl+W` fechar aba, `Ctrl+N` novo arquivo.
- Gestos: swipe para fechar aba; ajuste fino das alças de seleção no CodeMirror.
- Detecção automática de teclado físico sem banner; tema automático pelo sistema.
- Console interativo no preview (JS) e `input()` no Python.

## Técnico
- Python em Web Worker (Parar interrompe de verdade, sem travar a thread).
- Indicador visual de "salvando/salvo" no autosave.
- Fontes Inter com subset pt-BR (menos peso) e lazy-load de painéis.
- Migração versionada do IndexedDB (compatibilidade entre versões).
- Testes E2E com Playwright para fluxos críticos (criar projeto, editar, rodar, separar).