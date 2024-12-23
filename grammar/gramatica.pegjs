{{
    
    // let identificadores = []

    // import { identificadores } from '../index.js'

    import { ids, usos} from '../index.js'
    import { ErrorReglas } from './error.js';
    import { errores } from '../index.js'
    import * as n from '../visitor/CST.js';
}}

gramatica = _ prod:producciones+ _ {

    let duplicados = ids.filter((item, index) => ids.indexOf(item) !== index);
    if (duplicados.length > 0) {
        errores.push(new ErrorReglas("Regla duplicada: " + duplicados[0]));
    }

    // Validar que todos los usos están en ids
    let noEncontrados = usos.filter(item => !ids.includes(item));
    if (noEncontrados.length > 0) {
        errores.push(new ErrorReglas("Regla/s no encontrada/s: " + noEncontrados.join(", ")));
    }
    return prod
}

producciones 
    = _ id:identificador _ alias:(literales)? _ "=" _ expr:opciones (_";")? 
        { 
            ids.push(id);
            return new n.Producciones(id,expr, alias?.map(a => a[1]).join('') || '');   
        }

opciones 
    = exprs:union rest:(_ "/" _ @union)*
    { return new n.Opciones([exprs, ...rest]); }

union 
    = exprs:expresion rest:(_ @expresion !(_ literales? _ "=") )*
    { return new n.Union([exprs, ...rest]); }

expresion  
    = ("@")? _ id:(identificador _ ":")? _ varios? _ expr:expresiones _ quantifier:$([?+*]/conteo)?
        {return new n.Expresion(expr,id,quantifier); }

varios 
    = ("!"/"&"/"$")

expresiones  =  id:identificador { usos.push(id); return id; }
    / val:$literales isCase:"i"?
    {return new n.String(val.replace(/['"]/g, ''), isCase);}
    / "(" _ @opciones _ ")" 
    / chars:clase isCase:"i"?   {return new n.Clase(chars,isCase)}
    / "."   {return new n.Punto()}
    / "!."  {return new n.Fin()}

// conteo = "|" parteconteo _ (_ delimitador )? _ "|"

conteo = "|" _ (numero / id:identificador) _ "|"
    / "|" _ (numero / id:identificador)? _ ".." _ (numero / id2:identificador)? _ "|"
    / "|" _ (numero / id:identificador)? _ "," _ opciones _ "|"
    / "|" _ (numero / id:identificador)? _ ".." _ (numero / id2:identificador)? _ "," _ opciones _ "|"

// parteconteo = identificador
//             / [0-9]? _ ".." _ [0-9]?
// 			/ [0-9]

// delimitador =  "," _ expresion

// Regla principal que analiza corchetes con contenido
clase 
    = "[" @contenidoClase+ "]"

contenidoClase
    = bottom:$caracter "-" top:$caracter    {return new n.Rango(bottom,top)}
    / $caracter

corchetes
    = "[" contenido:(rango / texto)+ "]" {
        return `Entrada válida: [${input}]`;
    }

// Regla para validar un rango como [A-Z]
rango
    = inicio:caracter "-" fin:caracter {
        if (inicio.charCodeAt(0) > fin.charCodeAt(0)) {
            throw new Error(`Rango inválido: [${inicio}-${fin}]`);

        }
        return `${inicio}-${fin}`;
    }

// Regla para caracteres individuales
caracter
    = [^\[\]\\]
    / "\\" .

// Coincide con cualquier contenido que no incluya "]"
contenido
    = (corchete / texto)+

corchete
    = "[" contenido "]"

texto
    = [^\[\]]

literales 
    = '"' @stringDobleComilla* '"'
    / "'" @stringSimpleComilla* "'"


stringDobleComilla 
    = !('"' / "\\" / finLinea) .
    / "\\" escape


stringSimpleComilla 
    = !("'" / "\\" / finLinea) .
    / "\\" escape

continuacionLinea = "\\" secuenciaFinLinea

finLinea = [\n\r\u2028\u2029]

escape = "'"
    / '"'
    / "\\"
    / "b"
    / "f"
    / "n"
    / "r"
    / "t"
    / "v"
    / "u"

secuenciaFinLinea = "\r\n" / "\n" / "\r" / "\u2028" / "\u2029"

// literales = 
//     "\"" [^"]* "\""
//     / "'" [^']* "'"
    

numero = [0-9]+

identificador = [_a-z]i[_a-z0-9]i* { return text() }


_ = (Comentarios /[ \t\n\r])*


Comentarios = 
    "//" [^\n]* 
    / "/*" (!"*/" .)* "*/"
