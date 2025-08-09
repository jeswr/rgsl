// ANTLR v4 meta-grammar lexer (abridged minimal subset for alt collection)
lexer grammar ANTLRv4Lexer;
@members {
// placeholder members if needed
}
// This is a reduced version; for full functionality include the complete grammar from grammars-v4.
GRAMMAR: 'grammar';
PARSER: 'parser';
LEXER: 'lexer';
OPTIONS: 'options';
TOKENS: 'tokens';
CHANNELS: 'channels';
IMPORT: 'import';
MODE: 'mode';
COLON: ':'; SEMI: ';'; LPAREN:'(' ; RPAREN:')'; LT:'<'; GT:'>' ; ASSIGN:'='; AT:'@'; POUND:'#'; OR:'|';
ID: [A-Za-z_][A-Za-z0-9_]*;
COMMENT: '/*' .*? '*/' -> channel(HIDDEN);
LINE_COMMENT: '//' ~[\r\n]* -> channel(HIDDEN);
WS: [ \t\r\n]+ -> channel(HIDDEN);
UNRECOGNIZED: . ;
