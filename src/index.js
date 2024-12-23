import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/+esm';
import { parse } from '../src/parser/gramatica.js';
import Tokenizer from '../src/visitor/Tokenizer.js';

export let ids = [];
export let usos = [];
export let errores = [];

// Crear el editor principal
const editor = monaco.editor.create(document.getElementById('editor'), {
    value: '',
    language: 'java',
    theme: 'tema',
    automaticLayout: true,
});

// Crear el editor para la salida
const salida = monaco.editor.create(document.getElementById('salida'), {
    value: '',
    language: 'java',
    automaticLayout: true,
});

let decorations = [];

// Analizar contenido del editor
const analizar = () => {
    const entrada = editor.getValue();
    ids.length = 0;
    usos.length = 0;
    errores.length = 0;

    const mensaje = document.getElementById('mensaje');

    try {
        const cst = parse(entrada);

        if (errores.length > 0) {
            mensaje.textContent = `Error: ${errores[0].message}`;
            mensaje.className = 'bg-red-500 text-white text-lg font-semibold mt-4 inline-block px-4 py-2 rounded';
        } else {
            mensaje.textContent = 'Parser built successfully.';
            mensaje.className = 'bg-green-500 text-white text-lg font-semibold mt-4 inline-block px-4 py-2 rounded';
        }

        // Generar archivo Fortran si el análisis es exitoso
        const tokenizer = new Tokenizer();
        const fileContents = tokenizer.generateTokenizer(cst);
        const blob = new Blob([fileContents], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const button = document.getElementById('BotonDescarga');
        button.href = url;

    } catch (e) {
        mensaje.textContent = `Error: ${e.message}`;
        mensaje.className = 'bg-red-500 text-white text-lg font-semibold mt-4 inline-block px-4 py-2 rounded';
    }
};


// Escuchar cambios en el contenido del editor
editor.onDidChangeModelContent(() => {
    analizar();
});

// CSS personalizado para resaltar el error y agregar un warning
const style = document.createElement('style');
style.innerHTML = `
    .errorHighlight {
        color: red !important;
        font-weight: bold;
    }
    .warningGlyph {
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="orange" d="M8 1l7 14H1L8 1z"/></svg>') no-repeat center center;
        background-size: contain;
    }
`;
document.head.appendChild(style);