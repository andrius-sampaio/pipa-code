# CHANGELOG

## [0.0.1] - Fase 0 (fundação)
- Projeto criado com Vite + Preact + TypeScript.
- Estrutura de pastas conforme especificação.
- PWA básico: manifest, Service Worker com cache versionado, página offline.
- Script `npm run check:size` para orçamento de desempenho.
- Arquivos vivos: README, DECISOES, CHANGELOG, IDEIAS_FUTURAS, PRIVACIDADE, LICENSE.
## [0.1.0] - Fase 1 (layout e modos)
- Layout completo (desktop e toque).
- Botão Modo Desktop (tela cheia + tentativa de travar horizontal + aviso de rotação).
- Detecção de teclado/mouse com sugestão (não impositiva).
- Adaptação a telas pequenas na horizontal, zoom da interface (Ctrl+/Ctrl-/Ctrl+0), temas claro/escuro/alto contraste.

## [0.2.0] - Fase 2 (armazenamento e explorador)
- IndexedDB (projetos e arquivos), persistência solicitada.
- Tela inicial com projetos recentes, modelos prontos.
- Criar/renomear/duplicar/excluir arquivos e pastas; importar arquivos e .zip; exportar .zip.
- Menu de contexto (clique direito / toque longo).

## [0.3.0] - Fase 3 (editor com abas)
- CodeMirror 6 integrado com abas (abrir/fechar), salvamento automático com debounce.
- Detecção de linguagem pela extensão, carregamento lazy por linguagem.
- Atalhos: Ctrl+S salvar. Tab indenta.
- Barra de símbolos permanece no modo Toque.

## [0.4.0] - Fase 4 (preview e execução)
- Preview HTML/CSS/JS em iframe sandbox com resolução de arquivos do projeto.
- Captura de console e erros via postMessage.
- Botões Executar/Parar e atualização automática (desligável).
- Execução de JS puro em Web Worker com botão Parar.

## [0.5.0] - Fase 5 (diagnósticos)
- Diagnósticos de sintaxe via parser Lezer + regras extras (HTML, CSS, JS, JSON, Python).
- Painel Problemas clicável e contadores na barra de status.
- Linter integrado ao CodeMirror (sublinhado ondulado).
