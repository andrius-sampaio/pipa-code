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

## [0.6.0] - Fase 6 (tutor e autocompletar)
- Motor de tutor por regras, dicas em português, detecção de nível, modo Aprendizado/Produtividade.
- Heurística de estrutura + botão "Separar para mim".
- Autocompletar camada A (palavras-chave, snippets, símbolos) com Tab.
- Painel Tutor com silenciar.

## [0.7.0] - Fase 7 (Python opcional)
- Pyodide carregado sob demanda com aviso de tamanho e cache offline.
- print/input, botao Parar, tempo maximo.
- Arquivos Pyodide em public/pyodide/ (sem CDN).

## [0.8.0] - Fase 8 (polimento e distribuicao)
- Modo arquivo unico via vite-plugin-singlefile.
- Testes unitarios (Vitest) para nivel, regras, estrutura, zip.
- GUIA_HARDWARE.md e ALUNO.md.
- README atualizado com passo a passo.

## [0.9.0] - Melhorias de UI e redimensionamento
- Painéis redimensionáveis no Modo Desktop (arrastar divisores).
- Botões da barra de atividades funcionais (Arquivos, Tutor/Painel, Preview).
- UI polida com estilo iOS (cores, blur, bordas arredondadas, sombras).

## [0.9.1] - Correções de auditoria
- PWA: `start_url`, `scope`, `id`, fallback offline e cache do Pyodide agora respeitam a base `/pipa-code/` (funciona em GitHub Pages).
- Editor: troca de linguagem via `Compartment` — não perde mais linter, autocompletar e atalhos.
- Python: `stop()` e timeout invalidam a execução anterior (sem callbacks duplicados); instância é recarregada após timeout.
- Preview: só aceita mensagens do próprio iframe; referências relativas resolvidas a partir da pasta do HTML.
- Tutor "Separar para mim": cria os arquivos e atualiza explorador/preview automaticamente.
- Explorador: menu de contexto fecha com Escape/clique fora; "novo aqui" usa a pasta do item; nomes/caminhos validados.
- Painel inferior redimensiona na direção correta; Painel Problemas pula para o erro no editor; barra de símbolos funcional (Tab, pares, Undo/Redo).
- Projeto aberto atualiza "recentes"; importação com relatório de falhas; favicon via `%BASE_URL%`.
- Linguagens legacy (Java, C/C++, C#, Kotlin, etc.) com import correto para produção (antes quebrava silenciosamente).
- TypeScript modo estrito; barrels reais no lugar de placeholders; orçamento de tamanho cobre CSS.
- Testes: preview, regras HTML, normalização de caminhos (24 testes).

## [0.9.2] - Seleção e edição no celular (UX mobile)
- Barra de ações de seleção no editor: Copiar, Recortar, Colar, Selecionar tudo, Indentar, Desindentar e limpar seleção, com feedback ("Copiado!").
- Recortar apaga imediatamente (sem esperar a área de transferência).
- Fonte do editor >= 16px no modo Toque (evita zoom automático do iOS ao focar).
- `touch-action: manipulation` e remoção do highlight de toque no editor.
- Botão "Colar" na barra de símbolos do modo Toque (colar sem seleção).
- Colar com aviso honesto quando a área de transferência não está disponível.

## [0.9.3] - Troca rápida de arquivos
- Seletor rápido de arquivos (estilo Ctrl+P): overlay com filtro, navegação por setas/Enter, arquivo ativo primeiro.
- Atalhos de teclado: `Ctrl+P` (seletor), `Ctrl+Tab`/`Ctrl+Shift+Tab` (alternar abas).
- No modo Toque: botão 📂 na fileira de abas e "fling" horizontal sobre as abas para alternar arquivos.
- Lugar vazio do editor agora oferece "Escolher arquivo…" direto.

## [0.9.4] - Ícones SVG e compactação da interface
- Conjunto de ícones SVG inline (sem emojis, consistente entre Android/iOS), offline.
- Topbar com ícone + rótulo; em telas estreitas (≤640px) mostra só ícones (com tooltip).
- Navegação do modo Toque com ícones (Arquivos, Código, Resultado, Tutor).
- Explorador: árvore e toolbar com ícones SVG; Preview/Python com ícones executar/parar.
- Statusbar: em telas estreitas mostra só arquivo atual e problemas.

## [0.9.5] - Digitação e atalhos
- Barra de símbolos contextual por linguagem (HTML: `<div>`, `<p>`, `<!-- -->`; CSS: `display:`…; JS/TS: `console.log(`, `function `, `=>`; Python: `print(`, `def `, `for `).
- Botão "Ver resultado" (▶) na fileira de abas do modo Toque: um toque leva ao preview.
- Snippets novos no autocompletar: `while`, `console.log` (JS/TS), `while`, `print` (Python), `a` e `img` (HTML).
