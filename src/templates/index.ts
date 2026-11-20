export interface TemplateFile {
  path: string
  content: string
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  files: TemplateFile[]
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'html-basic',
    name: 'Página web',
    description: 'HTML, CSS e JS separados — bom para começar.',
    files: [
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meu projeto</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Olá, mundo!</h1>
  <p>Edite este arquivo para começar.</p>
  <button id="btn">Clique aqui</button>
  <script src="script.js"></script>
</body>
</html>
`,
      },
      {
        path: 'style.css',
        content: `/* Estilos da página */
body {
  font-family: system-ui, sans-serif;
  max-width: 600px;
  margin: 2rem auto;
  padding: 0 1rem;
  line-height: 1.6;
}
h1 { color: #1e66f5; }
button { padding: .5rem 1rem; cursor: pointer; }
`,
      },
      {
        path: 'script.js',
        content: `// JavaScript da página
const btn = document.getElementById('btn');
btn.addEventListener('click', () => {
  alert('Você clicou no botão!');
});
`,
      },
    ],
  },
  {
    id: 'js-basic',
    name: 'Programa JavaScript',
    description: 'Código que roda e mostra resultados no console.',
    files: [
      {
        path: 'main.js',
        content: `// JavaScript básico - Pipa Code
// Variáveis
const nome = 'Ana';
let idade = 15;

// Função
function saudacao(pessoa) {
  return 'Olá, ' + pessoa + '!';
}

console.log(saudacao(nome));
console.log('Idade:', idade);

// Laço
for (let i = 1; i <= 5; i++) {
  console.log('Contando:', i);
}
`,
      },
    ],
  },
  {
    id: 'python-basic',
    name: 'Programa Python',
    description: 'Código que roda e mostra resultados com print.',
    files: [
      {
        path: 'main.py',
        content: `# Python básico - Pipa Code
# Variáveis
nome = "Ana"
idade = 15

# Função
def saudacao(pessoa):
    return "Olá, " + pessoa + "!"

print(saudacao(nome))
print("Idade:", idade)

# Laço
for i in range(1, 6):
    print("Contando:", i)
`,
      },
    ],
  },
  {
    id: 'calculator',
    name: 'Calculadora',
    description: 'Projeto pronto de calculadora para você testar e modificar (cores, botões, lógica).',
    files: [
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calculadora</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="calc">
    <input id="display" type="text" readonly>
    <div class="buttons">
      <button>7</button><button>8</button><button>9</button><button>/</button>
      <button>4</button><button>5</button><button>6</button><button>*</button>
      <button>1</button><button>2</button><button>3</button><button>-</button>
      <button>0</button><button>.</button><button>=</button><button>+</button>
      <button class="clear">C</button>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>
`,
      },
      {
        path: 'style.css',
        content: `body { display:flex; justify-content:center; margin-top:2rem; font-family:system-ui,sans-serif; }
.calc { width:260px; }
#display { width:100%; font-size:1.5rem; padding:.5rem; margin-bottom:.5rem; text-align:right; }
.buttons { display:grid; grid-template-columns:repeat(4,1fr); gap:.3rem; }
button { padding:.8rem; font-size:1.1rem; cursor:pointer; }
.clear { grid-column:1/-1; background:#f38ba8; }
`,
      },
      {
        path: 'script.js',
        content: `const display = document.getElementById('display');
const buttons = document.querySelectorAll('.buttons button');
let expr = '';
buttons.forEach((b) => {
  b.addEventListener('click', () => {
    const v = b.textContent;
    if (v === 'C') { expr = ''; display.value = ''; return; }
    if (v === '=') { try { display.value = eval(expr); expr = display.value; } catch { display.value = 'Erro'; expr = ''; } return; }
    expr += v;
    display.value = expr;
  });
});
`,
      },
    ],
  },
  {
    id: 'blank',
    name: 'Vazio',
    description: 'Sem arquivos — para quem já sabe por onde começar.',
    files: [],
  },
]