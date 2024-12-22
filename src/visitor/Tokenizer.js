import Visitor from './Visitor.js';

var lista = [];
var generados = [];

export default class Tokenizer extends Visitor {
    generateTokenizer(grammar) {
        lista = [...grammar];
        return `
module tokenizer
implicit none

contains
function nextSym(input, cursor) result(lexeme)
    character(len=*), intent(in) :: input
    integer, intent(inout) :: cursor
    character(len=:), allocatable :: lexeme

    if (cursor > len(input)) then
        allocate( character(len=3) :: lexeme )
        lexeme = "EOF"
        return
    end if

    ${grammar[0].accept(this)}

    print *, "error lexico en col ", cursor, ', "'//input(cursor:cursor)//'"'
    lexeme = "ERROR"
end function nextSym
end module tokenizer 
        `;
    }

    visitProducciones(node) {
        return node.expr.accept(this);
    }
    visitOpciones(node) {
        return node.exprs.map((node) => node.accept(this)).join('\n');
    }
    visitUnion(node) {
        return node.exprs
            .map((node) => node.accept(this))
            .filter(line => line !== undefined) // Filtra las líneas vacías
            .join('\n');
    }    
    visitExpresion(node) {
        // esto sirve para poder concatenar ids de producciones
        if ( typeof node.expr === 'string') { 
            // si find encuentra algo, returna el resultado de la produccion
            var id = lista.find(prod => prod.id === node.expr);
            if  (!generados.includes(id)) {
                generados.push(id);
                return id.expr.accept(this);
            }
            return;
        }
        // si no es un id de produccion es un string y va por aqui.
        return node.expr.accept(this);
    }
    visitString(node) {
        return `
    if ("${node.val}" == input(cursor:cursor + ${
            node.val.length - 1
        })) then !${node.val}
        allocate( character(len=${node.val.length}) :: lexeme)
        lexeme = input(cursor:cursor + ${node.val.length - 1})
        cursor = cursor + ${node.val.length}
        return
    end if
    `;
    }
}