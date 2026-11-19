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
