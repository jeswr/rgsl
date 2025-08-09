grammar RGSL;

script      : stmt* EOF ;
stmt        : prefixStmt | bindStmt | termStmt | emitStmt | langStmt | dtStmt | NL+ ;

prefixStmt  : AT 'prefix' IDENT ':' IRI NL* ;
bindStmt    : AT 'bind' IDENT '<-' PATH ( '|' IDENT )? NL* ;
termStmt    : AT 'term' IDENT '=' term NL* ;
emitStmt    : AT 'emit' term term term ( '@' term )? NL* ;
langStmt    : AT 'lang' LANGTAG NL* ;
dtStmt      : AT 'dt' term NL* ;

term        : 'iri:' ( IRI | CURIE | IDENT )
            | 'lit:' ( STRING ( '@' LANGTAG | '^^' termIri )? | IDENT )
            | 'bnode:' IDENT
            | termIri
            | IDENT
            ;
termIri     : IRI | CURIE ;

AT          : '@' ;
IDENT       : [A-Za-z_][A-Za-z0-9_]* ;
PATH        : ~[\r\n]+ ;
LANGTAG     : '@'? [A-Za-z]+ ( '-' [A-Za-z0-9]+ )* ;
CURIE       : IDENT ':' [A-Za-z0-9_.-]* ;
IRI         : '<' ~['>']+ '>' ;
STRING      : '"' ( '\\"' | ~['\r\n"] )* '"' ;
NL          : [\r\n]+ ;
WS          : [ \t]+ -> skip ;
