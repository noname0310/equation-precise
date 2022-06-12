use crate::TokenNumberLiteral;

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

impl TokenKind {
    pub fn to_str(&self) -> &'static str {
        match self {
            TokenKind::Unknown => "unknown",
            TokenKind::Whitespace => "whitespace",
            TokenKind::OpenParen => "(",
            TokenKind::CloseParen => ")",
            TokenKind::Dot => ".",
            TokenKind::Comma => ",",
            TokenKind::Eq => "=",
            TokenKind::Lt => "<",
            TokenKind::Gt => ">",
            TokenKind::Plus => "+",
            TokenKind::Minus => "-",
            TokenKind::Star => "*",
            TokenKind::Slash => "/",
            TokenKind::Percent => "%",
            TokenKind::Or => "|",
            TokenKind::And => "&",
            TokenKind::Caret => "^",
            TokenKind::Id => "id",
            TokenKind::Literal(..) => "literal",
        }
    }
}
