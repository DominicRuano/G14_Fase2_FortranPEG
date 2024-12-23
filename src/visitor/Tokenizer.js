import Visitor from './Visitor.js';
import { Rango } from './CST.js';

export default class Tokenizer extends Visitor {
    constructor() {
        super();
        this.lista = []; 
        this.generados = []; 
    }

    generateTokenizer(grammar) {
        this.lista = [...grammar];
        return `
module parser
implicit none

contains

subroutine parse(input)
    character(len=:), allocatable :: lexeme, input
    integer :: cursor = 1
    do while (lexeme /= "EOF" .and. lexeme /= "ERROR")
        lexeme = nextSym(input, cursor)
        print *, lexeme
    end do
end subroutine parse

function nextSym(input, cursor) result(lexeme)
    character(len=*), intent(in) :: input
    integer, intent(inout) :: cursor
    character(len=:), allocatable :: lexeme
    integer :: i

    if (cursor > len(input)) then
        allocate( character(len=3) :: lexeme )
        lexeme = "EOF"
        return
    end if

    ${grammar[0].accept(this)}

    print *, "error lexico en col ", cursor, ', "'//input(cursor:cursor)//'"'
    lexeme = "ERROR"
end function nextSym

end module parser 
        `;
    }

    visitProducciones(node) {
        return node.expr.accept(this);
    }

    visitOpciones(node) {
        return node.exprs
            .map((expr) => expr.accept(this))
            .filter((str) => str) 
            .join('\n');
    }

    visitUnion(node) {
        return node.exprs
            .map((expr) => expr.accept(this))
            .filter((str) => str)
            .join('\n');
    }

    visitExpresion(node) {
        if (typeof node.expr === 'string') {
            const id = this.lista.find((prod) => prod.id === node.expr);
            if (id && !this.generados.includes(id)) {
                this.generados.push(id);
                return id.expr.accept(this);
            }
            return ''; 
        }
        return node.expr.accept(this); 
    }

    visitString(node) {
        return `
    if ("${node.val}" == input(cursor:cursor + ${node.val.length - 1})) then
        allocate( character(len=${node.val.length}) :: lexeme)
        lexeme = input(cursor:cursor + ${node.val.length - 1})
        cursor = cursor + ${node.val.length}
        return
    end if
        `;
    }

    visitClase(node) {
        return `
    i = cursor
    ${this.generateCaracteres(node.chars.filter((char) => typeof char === 'string'))}
    ${node.chars
        .filter((char) => char instanceof Rango)
        .map((range) => range.accept(this))
        .join('\n')}
        `;
    }

    visitRango(node) {
        console.log(node);
        return `
    if (input(i:i) >= "${node.inicio}" .and. input(i:i) <= "${node.fin}") then
        lexeme = input(cursor:i)
        cursor = i + 1
        return
    end if
        `;
    }

    visitIdentificador(node) {
        return ''; 
    }

    visitPunto(node) {
        return ''; 
    }

    visitFin(node) {
        return ''; 
    }

    generateCaracteres(chars) {
        if (chars.length === 0) return '';
        return `
    if (findloc([${chars.map((char) => `"${char}"`).join(', ')}], input(i:i), 1) > 0) then
        lexeme = input(cursor:i)
        cursor = i + 1
        return
    end if
        `;
    }
}