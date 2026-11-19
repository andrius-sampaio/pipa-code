// Palavras-chave por linguagem para autocompletar (Camada A).

export const KEYWORDS: Record<string, string[]> = {
  javascript: ['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','new','this','class','extends','import','export','default','async','await','try','catch','finally','throw','typeof','instanceof','true','false','null','undefined'],
  typescript: ['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','new','this','class','extends','import','export','default','async','await','try','catch','finally','throw','typeof','instanceof','interface','type','enum','namespace','public','private','protected','readonly'],
  python: ['def','return','if','elif','else','for','while','break','continue','class','import','from','as','try','except','finally','raise','with','lambda','True','False','None','and','or','not','in','is','pass','yield'],
  html: ['html','head','body','title','meta','link','script','style','div','span','p','a','img','ul','ol','li','table','tr','td','th','form','input','button','label','header','footer','nav','main','section','article','aside'],
  css: ['color','background','margin','padding','font-size','display','flex','grid','width','height','border','border-radius','text-align','position','top','left','right','bottom','opacity','transform','transition'],
  json: [],
  markdown: [],
}

export const SNIPPETS: Record<string, { label: string; snippet: string }[]> = {
  javascript: [
    { label: 'for', snippet: 'for (let i = 0; i < ${1:n}; i++) {\n\t${2}\n}' },
    { label: 'if', snippet: 'if (${1:condicao}) {\n\t${2}\n}' },
    { label: 'function', snippet: 'function ${1:nome}(${2}) {\n\t${3}\n}' },
    { label: 'arrow', snippet: 'const ${1:nome} = (${2}) => {\n\t${3}\n}' },
  ],
  python: [
    { label: 'for', snippet: 'for i in range(${1:n}):\n    ${2}' },
    { label: 'if', snippet: 'if ${1:condicao}:\n    ${2}' },
    { label: 'def', snippet: 'def ${1:nome}(${2}):\n    ${3}' },
  ],
  html: [
    { label: 'html5', snippet: '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${1:Titulo}</title>\n</head>\n<body>\n  ${2}\n</body>\n</html>' },
  ],
}