grammar TURTLE;

// Added RGSL semantic annotations after labeled alternatives.

turtleDoc
    : statement* EOF #TurtleDoc
    ;

statement
    : directive #DirectiveStmt
    | triples '.' #TriplesStmt
    ;

// @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
// @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
// @prefix xsd: <http://www.w3.org/2001/XMLSchema#>
// @prefix ex: <http://example.com/>
// (Directive statements themselves don't emit triples.)

directive
    : prefixID #PrefixDir
    | base #BaseDir
    | sparqlPrefix #SparqlPrefixDir
    | sparqlBase #SparqlBaseDir
    ;

prefixID
    : '@prefix' PNAME_NS IRIREF '.' #PrefixId
    ;

base
    : '@base' IRIREF '.' #BaseId
    ;

sparqlBase
    : 'BASE' IRIREF #SparqlBase
    ;

sparqlPrefix
    : 'PREFIX' PNAME_NS IRIREF #SparqlPrefix
    ;

triples
    : subject predicateObjectList #TriplesSPO
      // @bind S <- subject
      // @bind PO <- predicateObjectList | expandPO
      // @emit iri:rdf:subject iri:rdf:predicate iri:rdf:object
    | blankNodePropertyList predicateObjectList? #TriplesBN
      // @bind BN <- blankNodePropertyList
      // @bind PO <- predicateObjectList | expandPO
      // @term BNTERM = bnode:BN
      // @emit BNTERM iri:rdf:predicate iri:rdf:object
    ;

predicateObjectList
    : verb objectList (';' (verb objectList)?)* #PredicateObjectList
    ;

objectList
    : object_ (',' object_)* #ObjectList
    ;

verb
    : predicate #VerbPred
    | 'a' #VerbA
      // @term A = iri:rdf:type
    ;

subject
    : iri #SubjectIri
      // @bind SI <- iri
    | BlankNode #SubjectBNode
      // @bind SB <- BlankNode
      // @term SBTERM = bnode:SB
    | collection #SubjectCollection
      // @bind SC <- collection
    ;

predicate
    : iri #PredicateIri
      // @bind P <- iri
    ;

object_
    : iri #ObjectIri
      // @bind OI <- iri
    | BlankNode #ObjectBNode
      // @bind OB <- BlankNode
      // @term OBTERM = bnode:OB
    | collection #ObjectCollection
      // @bind OC <- collection
    | blankNodePropertyList #ObjectBNPL
      // @bind OBP <- blankNodePropertyList
    | literal #ObjectLiteral
      // @bind OL <- literal
    ;

literal
    : rdfLiteral #LiteralRdf
      // @bind L <- rdfLiteral
    | NumericLiteral #LiteralNumeric
      // @bind LN <- NumericLiteral
    | BooleanLiteral #LiteralBoolean
      // @bind LB <- BooleanLiteral
    ;

blankNodePropertyList
    : '[' predicateObjectList ']' #BlankNodePropertyList
      // @bind BPO <- predicateObjectList
    ;

collection
    : '(' object_* ')' #Collection
      // @bind COBJ <- object_
    ;

NumericLiteral
    : INTEGER #NumericInteger
    | DECIMAL #NumericDecimal
    | DOUBLE #NumericDouble
    ;

rdfLiteral
    : String (LANGTAG | '^^' iri)? #RdfLiteral
    ;

BooleanLiteral
    : 'true' #BoolTrue
    | 'false' #BoolFalse
    ;

String
    : STRING_LITERAL_QUOTE #StrDQuote
    | STRING_LITERAL_SINGLE_QUOTE #StrSQuote
    | STRING_LITERAL_LONG_SINGLE_QUOTE #StrLongS
    | STRING_LITERAL_LONG_QUOTE #StrLongD
    ;

iri
    : IRIREF #IriRef
    | PrefixedName #IriPrefixed
    ;

BlankNode
    : BLANK_NODE_LABEL #BlankNodeLabel
    | ANON #BlankAnon
    ;

WS
    : ([\t\r\n\u000C] | ' ')+ -> skip
    ;

// LEXER

PN_PREFIX
    : PN_CHARS_BASE ((PN_CHARS | '.')* PN_CHARS)?
    ;

//IRIREF	        :	'<' (~(['\u0000'..'\u0020']|'<'|'>'|'"'|'{'|'}'|'|'|'^'|'`'|'\\') | UCHAR)* '>'; /* \u00=NULL #01-\u1F=control codes \u20=space */

IRIREF
    : '<' (PN_CHARS | '.' | ':' | '/' | '\\' | '#' | '@' | '%' | '&' | UCHAR)* '>'
    ;

PNAME_NS
    : PN_PREFIX? ':'
    ;

PrefixedName
    : PNAME_LN
    | PNAME_NS
    ;

PNAME_LN
    : PNAME_NS PN_LOCAL
    ;

BLANK_NODE_LABEL
    : '_:' (PN_CHARS_U | [0-9]) ((PN_CHARS | '.')* PN_CHARS)?
    ;

LANGTAG
    : '@' [a-zA-Z]+ ('-' [a-zA-Z0-9]+)*
    ;

INTEGER
    : [+-]? [0-9]+
    ;

DECIMAL
    : [+-]? [0-9]* '.' [0-9]+
    ;

DOUBLE
    : [+-]? ([0-9]+ '.' [0-9]* EXPONENT | '.' [0-9]+ EXPONENT | [0-9]+ EXPONENT)
    ;

EXPONENT
    : [eE] [+-]? [0-9]+
    ;

STRING_LITERAL_LONG_SINGLE_QUOTE
    : '\'\'\'' (('\'' | '\'\'')? ([^'\\] | ECHAR | UCHAR | '"'))* '\'\'\''
    ;

STRING_LITERAL_LONG_QUOTE
    : '"""' (('"' | '""')? (~ ["\\] | ECHAR | UCHAR | '\''))* '"""'
    ;

STRING_LITERAL_QUOTE
    : '"' (~ ["\\\r\n] | '\'' | '\\"')* '"'
    ;

STRING_LITERAL_SINGLE_QUOTE
    : '\'' (~ [\u0027\u005C\u000A\u000D] | ECHAR | UCHAR | '"')* '\''
    ;

UCHAR
    : '\\u' HEX HEX HEX HEX
    | '\\U' HEX HEX HEX HEX HEX HEX HEX HEX
    ;

ECHAR
    : '\\' [tbnrf"'\\]
    ;

ANON_WS
    : ' '
    | '\t'
    | '\r'
    | '\n'
    ;

ANON
    : '[' ANON_WS* ']'
    ;

PN_CHARS_BASE
    : 'A' .. 'Z'
    | 'a' .. 'z'
    | '\u00C0' .. '\u00D6'
    | '\u00D8' .. '\u00F6'
    | '\u00F8' .. '\u02FF'
    | '\u0370' .. '\u037D'
    | '\u037F' .. '\u1FFF'
    | '\u200C' .. '\u200D'
    | '\u2070' .. '\u218F'
    | '\u2C00' .. '\u2FEF'
    | '\u3001' .. '\uD7FF'
    | '\uF900' .. '\uFDCF'
    | '\uFDF0' .. '\uFFFD'
    ;

PN_CHARS_U
    : PN_CHARS_BASE
    | '_'
    ;

PN_CHARS
    : PN_CHARS_U
    | '-'
    | [0-9]
    | '\u00B7'
    | [\u0300-\u036F]
    | [\u203F-\u2040]
    ;

PN_LOCAL
    : (PN_CHARS_U | ':' | [0-9] | PLX) ((PN_CHARS | '.' | ':' | PLX)* (PN_CHARS | ':' | PLX))?
    ;

PLX
    : PERCENT
    | PN_LOCAL_ESC
    ;

PERCENT
    : '%' HEX HEX
    ;

HEX
    : [0-9]
    | [A-F]
    | [a-f]
    ;

PN_LOCAL_ESC
    : '\\' (
        '_'
        | '~'
        | '.'
        | '-'
        | '!'
        | '$'
        | '&'
        | '\''
        | '('
        | ')'
        | '*'
        | '+'
        | ','
        | ';'
        | '='
        | '/'
        | '?'
        | '#'
        | '@'
        | '%'
    )
    ;

LC
    : '#' ~[\r\n]+ -> channel(HIDDEN)
    ;
