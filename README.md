# Pipa Code — IDE Educacional Web Offline

IDE web leve, offline e em português para estudantes aprenderem a programar em celulares modestos, tablets e computadores simples.

## Status
Fases 0 a 8 concluídas (fundação, layout/modos, armazenamento, editor, preview/execução, diagnósticos, tutor/autocompletar, Python opcional, polimento/testes/distribuição).

## Requisitos para desenvolver/publicar
- Node.js 20 ou superior
- npm 10 ou superior

## Como rodar em desenvolvimento
```bash
npm install
npm run dev
```
Abra o endereço mostrado no terminal (geralmente http://localhost:5173).

## Como gerar a versão publicável (PWA)
```bash
npm run build
npm run check:size
```
A pasta `dist/` contém o app pronto para publicar (ex.: GitHub Pages). O script `check:size` falha se o orçamento de desempenho for ultrapassado.

## Modo arquivo único (plano B)
```bash
npm run build:singlefile
```
Gera `dist-single/index.html` com tudo embutido, que abre de um pen drive ou do celular sem servidor. Nesse modo o Python opcional fica indisponível (aviso exibido).

## Como testar offline (PWA)
1. Rode `npm run build` e `npm run preview`.
2. Abra o app no navegador, aguarde carregar.
3. Desligue o Wi-Fi e recarregue a página: deve continuar funcionando.

## Instalação no celular (PWA)
Abra o site publicado no Chrome, toque em "Adicionar à tela inicial" (ou "Instalar app").

## Testes
```bash
npm test
```

## Publicação no GitHub Pages
O repositório inclui workflow em `.github/workflows/deploy.yml` que faz build e deploy automático ao enviar para `main`.

## Documentação
- `DECISOES.md`: decisões técnicas e motivos.
- `CHANGELOG.md`: histórico por fase.
- `IDEIAS_FUTURAS.md`: fora do escopo da v1.
- `PRIVACIDADE.md`: privacidade e segurança.
- `GUIA_HARDWARE.md`: guia de hardware para o professor.
- `ALUNO.md`: guia rápido do aluno (1 página).

## Limitações conhecidas (v1)
- **Preview**: embute HTML/CSS/JS do projeto; referências a imagens/fontes externas ou `url(...)` em CSS ainda não são resolvidas (use arquivos simples).
- **Python**: roda na thread principal (Pyodide); "Parar" invalida a execução e recarrega a instância na próxima execução — código em loop infinito demora até o tempo máximo (10 s) para ser abandonado.
- **Destaque de sintaxe**: PHP ainda sem destaque (modo legacy indisponível); demais linguagens têm destaque básico.
- **i18n**: o app é todo em português (pt-BR); estrutura de i18n reservada para o futuro.

## Licença
MIT.