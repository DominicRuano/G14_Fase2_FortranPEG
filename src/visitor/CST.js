import Node from './Node.js';

export class Producciones extends Node {
    constructor(id, expr, alias) {
        super();
        this.id = id;
		this.expr = expr;
		this.alias = alias;
    }

    accept(visitor) {
        return visitor.visitProducciones(this);
    }
}
    
export class Opciones extends Node {
    constructor(exprs) {
        super();
        this.exprs = exprs;
    }

    accept(visitor, alias) {
        return visitor.visitOpciones(this, alias);
    }
}
    
export class Union extends Node {
    constructor(exprs) {
        super();
        this.exprs = exprs;
    }

    accept(visitor, alias) {
        return visitor.visitUnion(this, alias);
    }
}
    
export class Expresion extends Node {
    constructor(expr, label, quantifier) {
        super();
        this.expr = expr;
		this.label = label;
		this.quantifier = quantifier;
    }

    accept(visitor, alias) {
        return visitor.visitExpresion(this, alias);
    }
}
    
export class String extends Node {
    constructor(val, isCase) {
        super();
        this.val = val;
		this.isCase = isCase;
    }

    accept(visitor, alias) {
        return visitor.visitString(this, alias);
    }
}
    
export class Rango extends Node {
    constructor(inicio, fin) {
        super();
        this.inicio = inicio;
		this.fin = fin;
    }

    accept(visitor, alias, isCase) {
        return visitor.visitRango(this, alias, isCase);
    }
}
    
export class Clase extends Node {
    constructor(chars, isCase) {
        super();
        this.chars = chars;
		this.isCase = isCase;
    }

    accept(visitor, alias) {
        return visitor.visitClase(this, alias);
    }
}
    
export class Identificador extends Node {
    constructor(id) {
        super();
        this.id = id;
    }

    accept(visitor) {
        return visitor.visitIdentificador(this);
    }
}
    
export class Punto extends Node {
    constructor() {
        super();
        
    }

    accept(visitor) {
        return visitor.visitPunto(this);
    }
}
    
export class Fin extends Node {
    constructor() {
        super();
        
    }

    accept(visitor) {
        return visitor.visitFin(this);
    }
}
    