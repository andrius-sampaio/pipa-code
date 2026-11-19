# MiniCode — IDE Educacional Web Offline

IDE web leve, offline e em português para estudantes aprenderem a programar em celulares modestos, tablets e computadores simples.

## Status
Fase 0 (fundação) concluída. Layout e funcionalidades chegam nas próximas fases.

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

## Como testar offline
1. Rode `npm run build` e `npm run preview`.
2. Abra o app no navegador, aguarde carregar.
3. Desligue o Wi-Fi e recarregue a página: deve continuar funcionando.

## Instalação no celular (PWA)
Abra o site publicado no Chrome, toque em "Adicionar à tela inicial" (ou "Instalar app").

## Modo arquivo único (plano B)
Será adicionado em fase posterior (vite-plugin-singlefile). Por enquanto, use o modo PWA.

## Licença
MIT.