use super::TokenNumberLiteral;

#[derive(Debug, Clone, Copy, Eq, PartialEq, PartialOrd, Ord, Hash)]
pub enum TokenKind {
    Unknown,
    Whitespace,
    OpenParen,    // "("
    CloseParen,   // ")"
    Dot,          // "."
    Comma,        // ","
    Eq,           // "="
    Lt,           // "<"
    Gt,           // ">"
    Plus,         // "+"
    Minus,        // "-"
    Star,         // "*"
    Slash,        // "/"
    Percent,      // "%"
    Or,           // "|"
    And,          // "&"
    Caret,        // "^"
    Id,           // identifier or keyword
    Literal(TokenNumberLiteral),
}
