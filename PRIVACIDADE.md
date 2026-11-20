# PRIVACIDADE

O Pipa Code não tem telemetria, rastreadores, contas nem login. Todo o código do aluno fica no próprio aparelho (IndexedDB). Nenhum dado é enviado para servidores. O código roda em ambiente isolado (iframe sandbox). Sem anúncios e sem links externos escondidos.

## Observações sobre o preview

- O preview roda em um iframe com sandbox (sem acesso ao app).
- Arquivos locais do projeto (HTML, CSS, JS) são embutidos no preview; nada é enviado para fora.
- Se o aluno escrever referências a recursos externos (ex.: `https://...` ou imagens remotas), o navegador pode buscá-las quando estiver online. Para uso totalmente offline, mantenha as referências apenas a arquivos do projeto.
- O app só escuta mensagens do iframe do próprio preview (verificação de origem).