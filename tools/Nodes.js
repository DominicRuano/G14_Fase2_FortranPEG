const nodes = {
    Producciones: ['id', 'expr', 'alias'],
    Opciones: ['exprs'],
    Union: ['exprs'],
    Expresion: ['expr', 'label', 'quantifier'],
    String: ['val', 'isCase'],
    Rango: ['inicio', 'fin'],
    Clase: ['chars', 'isCase'],
    Identificador: ['id'],
    Punto: [],
    Fin: []
};

export default nodes;