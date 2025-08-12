---
applyTo: '**'
---

1. **Project Context**:
   This project creates a way to formally describe RDF syntaxes so that parsers can be automatically generated from the formal declaration.

I would like for
1. it to be an RDF vocabulary that is used for describing the syntax and how the syntax maps to different semantics,
2. there for be a custom syntax (which is self descrbing because it has an RDF sytnax) that extends g4 for describing the syntax and semantics attached to it

2. **Coding Guidelines**:
   - There should be as little code as possible (excluding generated code). All parsing behavior should be defined in grammar files so that it can be used by any toolchain for automated generation.
   - Follow best practices for code quality, including readability, maintainability, and performance.
   - Use consistent naming conventions and code styles as established in the project's existing codebase.
