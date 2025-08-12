// ANTLR v4 meta-grammar lexer (extended minimal subset for alt collection + EBNF + string literals)
lexer grammar ANTLRv4Lexer;
@members {
// placeholder members if needed
}
// Keywords
GRAMMAR: 'grammar';
PARSER: 'parser';
LEXER: 'lexer';
OPTIONS: 'options';
TOKENS: 'tokens';
CHANNELS: 'channels';
IMPORT: 'import';
MODE: 'mode';
// Punctuation / operators
COLON: ':'; SEMI: ';'; LPAREN:'(' ; RPAREN:')'; LT:'<'; GT:'>' ; ASSIGN:'='; AT:'@'; POUND:'#'; OR:'|';
QUESTION: '?'; STAR: '*'; PLUS: '+'; DOT: '.';
// String literal used in parser rules (single quoted)
STRING_LITERAL: '\'' ( '\\' . | ~['\\\r\n] )* '\'';
ID: [A-Za-z_][A-Za-z0-9_]*;
COMMENT: '/*' .*? '*/' -> channel(HIDDEN);
LINE_COMMENT: '//' ~[\r\n]* -> channel(HIDDEN);
WS: [ \t\r\n]+ -> channel(HIDDEN);
UNRECOGNIZED: . ;
