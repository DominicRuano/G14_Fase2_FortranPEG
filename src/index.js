import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/+esm';
import { parse } from './parser/gramatica.js';
import { generateTokenizer } from './visitor/utils.js';

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
    readOnly: true,
    automaticLayout: true,
});

let decorations = [];

// Analizar contenido del editor
let cst;
const analizar = () => {
    const entrada = editor.getValue();
    ids.length = 0;
    usos.length = 0;
    errores.length = 0;
    try {
        cst = parse(entrada);

        if (errores.length > 0) {
            salida.setValue(`Error: ${errores[0].message}`);
            cst = null;
            return;
        } else {
            salida.setValue('Análisis Exitoso');
        }

        // salida.setValue("Análisis Exitoso");
        // Limpiar decoraciones previas si la validación es exitosa
        decorations = editor.deltaDecorations(decorations, []);
    } catch (e) {
        cst = null;
        if (e.location === undefined) {
            salida.setValue(`Error: ${e.message}`);
        } else {
            // Mostrar mensaje de error en el editor de salida
            salida.setValue(
                `Error: ${e.message}\nEn línea ${e.location.start.line} columna ${e.location.start.column}`
            );

            // Resaltar el error en el editor de entrada
            decorations = editor.deltaDecorations(decorations, [
                {
                    range: new monaco.Range(
                        e.location.start.line,
                        e.location.start.column,
                        e.location.start.line,
                        e.location.start.column + 1
                    ),
                    options: {
                        inlineClassName: 'errorHighlight', // Clase CSS personalizada para cambiar color de letra
                    },
                },
                {
                    range: new monaco.Range(
                        e.location.start.line,
                        e.location.start.column,
                        e.location.start.line,
                        e.location.start.column
                    ),
                    options: {
                        glyphMarginClassName: 'warningGlyph', // Clase CSS para mostrar un warning en el margen
                    },
                },
            ]);
        }
    }
};

// Escuchar cambios en el contenido del editor
editor.onDidChangeModelContent(() => {
    analizar();
});

let downloadHappening = false;
const button = document.getElementById('BotonDescarga');

button.addEventListener('click', (event) => {
    event.preventDefault(); // Evita que el navegador intente usar el href del botón

    if (downloadHappening) return; // Evita múltiples descargas simultáneas
    console.log('Descargando');
    downloadHappening = true;

    if (!cst) {
        alert('Escribe una gramática válida');
        downloadHappening = false;
        return;
    }

    let url;
    generateTokenizer(cst)
        .then((fileContents) => {
            if (!fileContents) {
                throw new Error("El contenido del archivo es vacío.");
            }

            // Crear un Blob con el contenido generado
            const blob = new Blob([fileContents], { type: 'text/plain' });
            url = URL.createObjectURL(blob);

            // Crear un enlace temporal para descargar el archivo
            const tempLink = document.createElement('a');
            tempLink.href = url;
            tempLink.download = 'tokenizer.f90'; // Nombre del archivo descargado
            document.body.appendChild(tempLink);
            tempLink.click(); // Forzar la descarga
            document.body.removeChild(tempLink); // Limpia el enlace temporal

            // Liberar la URL después de la descarga
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        })
        .catch((error) => {
            console.error("Error al generar el archivo:", error);
        })
        .finally(() => {
            downloadHappening = false; // Marcar que terminó el proceso
        });
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