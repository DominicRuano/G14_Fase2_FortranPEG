import Visitor from './Visitor.js';
import { Rango } from './CST.js';

export default class Tokenizer extends Visitor {
    constructor() {
        super();
        this.lista = []; 
        this.generados = []; 
        
        // Se usa si de declara un "{.}" en la gramática en distintas producciones
        this.STRgenerados = []; 
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

function toLowerCase(input) result(lowercase)
    character(len=*), intent(in) :: input
    character(len=len(input)) :: lowercase
    integer :: i, ascii

    ! Itera sobre cada carácter del string
    do i = 1, len(input)
        ascii = iachar(input(i:i)) ! Obtiene el código ASCII del carácter
        if (ascii >= iachar('A') .and. ascii <= iachar('Z')) then
            ! Convierte a minúscula si está en rango de letras mayúsculas
            lowercase(i:i) = achar(ascii + 32)
        else
            ! Copia el carácter tal cual si no es mayúscula
            lowercase(i:i) = input(i:i)
        end if
    end do
end function toLowerCase

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
        return node.expr.accept(this, node.alias);
    }

    visitOpciones(node, alias) {
        return node.exprs
            .map((expr) => expr.accept(this, alias))
            .filter((str) => str) 
            .join('\n');
    }

    visitUnion(node, alias) {
        // loop para unir las expresiones
        node.exprs.forEach((Statement, index) => {
            if (Statement.expr.constructor.name === "String" && typeof Statement.expr === 'object' &&  index < node.exprs.length - 1 &&
                typeof node.exprs[index + 1].expr === 'object' && node.exprs[index + 1].expr.constructor.name === "String") {
                    Statement.expr.val += node.exprs[index + 1].expr.val;
                    Statement.expr.isCase = node.exprs[index + 1].expr.isCase || node.exprs[index].expr.isCase ? 
                        (node.exprs[index + 1].expr.isCase || node.exprs[index].expr.isCase) : null;
                    node.exprs.splice(index + 1, 1);
                };
            });

        return node.exprs
        .map((expr) => expr.accept(this, alias))
        .filter((str) => str)
        .join('\n');
    }
    
    visitExpresion(node, alias) {
        if (typeof node.expr === 'string') {
            const id = this.lista.find((prod) => prod.id === node.expr);
            if (id && !this.generados.includes(id)) {
                this.generados.push(id);
                return id.expr.accept(this, id.alias);
            }
            return ''; 
        }

        if ( node.expr.constructor.name === "String" && 
                this.STRgenerados.includes(node.expr.val) ) return '';

        return node.expr.accept(this, alias);
    }
    
    visitString(node, alias) {
        this.STRgenerados.push(node.val);

        if (node.isCase) {
            return `
    if (toLowerCase("${node.val}") == toLowerCase(input(cursor:cursor + ${node.val.length - 1}))) then
        allocate( character(len=${node.val.length}) :: lexeme)
        lexeme = input(cursor:cursor + ${node.val.length - 1}) ${ alias ? `// " - ${alias}"` : '' }
        cursor = cursor + ${node.val.length}
        return
    end if
`;
        }

        return `
    if ("${node.val}" == input(cursor:cursor + ${node.val.length - 1})) then
        allocate( character(len=${node.val.length}) :: lexeme)
        lexeme = input(cursor:cursor + ${node.val.length - 1}) ${ alias ? `// " - ${alias}"` : '' }
        cursor = cursor + ${node.val.length}
        return
    end if
`;
    }
    
    visitClase(node, alias) {
        return `
        i = cursor
        ${this.generateCaracteres(node.chars.filter((char) => typeof char === 'string'), alias)}
        ${node.chars
            .filter((char) => char instanceof Rango)
            .map((range) => range.accept(this, alias))
            .join('\n')}`;
}

    visitRango(node, alias) {
        return `
    if (input(i:i) >= "${node.inicio}" .and. input(i:i) <= "${node.fin}") then
        lexeme = input(cursor:i) ${ alias ? `// " - ${alias}"` : '' }
        cursor = i + 1
        return
    end if`;
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
    
    generateCaracteres(chars, alias) {
        if (chars.length === 0) return '';
        
        // No mover, luego no sabemos que hace una funcion, luego se refactoriza
        // Mapeo de caracteres especiales a representaciones en Fortran
        const specialCharMap = {
            '\\t': 'char(9)',  // Tabulación
            '\\n': 'char(10)', // Salto de línea
            '\\r': 'char(13)', // Retorno de carro
            ' ': 'char(32)'   // Espacio
        };
    
        const fortranChars = chars.map((char) => {
            // Sustituye por la representación en Fortran si existe en el mapa
            return specialCharMap[char] || `"${char}"`; // Si no está en el mapa, usa el carácter como cadena
        });
    
        return `
    if (findloc([character(len=1) :: ${fortranChars.join(', ')}], input(i:i), 1) > 0) then
        lexeme = input(cursor:i) ${ alias ? `// " - ${alias}"` : '' }
        cursor = i + 1
        return
    end if
        `;
    }
    
    
}
