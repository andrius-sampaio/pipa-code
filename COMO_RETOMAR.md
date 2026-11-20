# Como retomar o trabalho no Pipa Code

Guia rápido para continuar desenvolvendo o projeto com o agente (IA).

## 1. Onde o código está

- **Local (onde você trabalha):** `/home/andrius/Projetos/pipa-code`
- **Cópia pública/backup:** https://github.com/andrius-sampaio/pipa-code
- **App publicado (PWA):** https://andrius-sampaio.github.io/pipa-code/

> O código vive no seu computador. O GitHub é o backup público. Você **não** precisa "baixar" nada para continuar.

## 2. Como abrir um novo chat

Abra o agente (OpenCode) **no diretório do projeto**:

```
/home/andrius/Projetos/pipa-code
```

E comece com uma mensagem assim:

> "Trabalhe no projeto Pipa Code em /home/andrius/Projetos/pipa-code. O código está no GitHub em andrius-sampaio/pipa-code (branch main). Vamos continuar a partir de [descreva a tarefa]."

## 3. Comandos úteis

No terminal, dentro de `/home/andrius/Projetos/pipa-code`:

| O que fazer | Comando |
| --- | --- |
| Rodar em desenvolvimento | `npm run dev` |
| Gerar a versão publicável (PWA) | `npm run build` |
| Verificar tamanho (orçamento) | `npm run check:size` |
| Rodar os testes | `npm test` |
| Gerar arquivo único (plano B) | `npm run build:singlefile` |
| Enviar mudanças para o GitHub | `git add -A && git commit -m "mensagem" && git push` |
| Trazer mudanças de outra máquina | `git pull` |

## 4. Regras de ouro

- Sempre trabalhe em `/home/andrius/Projetos/pipa-code` (não na pasta do Google Drive).
- Após cada tarefa, rode `npm run build && npm run check:size` para garantir que nada quebrou.
- Envie para o GitHub com `git push` ao final de cada etapa.
- O GitHub Pages atualiza sozinho alguns minutos após o `git push` para `main`.

## 5. Documentação do projeto

- `README.md` — visão geral, instalação e publicação.
- `DECISOES.md` — decisões técnicas e motivos.
- `CHANGELOG.md` — histórico por fase.
- `IDEIAS_FUTURAS.md` — fora do escopo da v1.
- `PRIVACIDADE.md` — privacidade e segurança.
- `GUIA_HARDWARE.md` — guia de hardware para o professor.
- `ALUNO.md` — guia rápido do aluno.
