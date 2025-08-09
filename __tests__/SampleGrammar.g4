grammar SampleGrammar;

triples: subject predicate object '.' #TripleLine
       ;
subject: IRI #SubjectIri ;
predicate: IRI #PredicateIri ;
object: IRI #ObjectIri ;

IRI: '<' ~[>]+ '>' ;
WS: [ \t\r\n]+ -> skip;

// @prefix ex: <http://example.com/>
// @term S = iri:<http://example.com/subject>
// @term P = iri:<http://example.com/predicate>
// @term O = iri:<http://example.com/object>
// @emit S P O
