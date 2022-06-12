use lexer::{TokenNumberLiteral};
use span::Span;

#[derive(Debug, Clone, Hash)]
pub struct Expr {
    pub kind: ExprKind,
    pub span: Span,
}

#[derive(Debug, Clone, Hash)]
pub enum ExprKind {
    Eq(Box<Expr>, Box<Expr>),
    Ne(Box<Expr>, Box<Expr>),
    Lt(Box<Expr>, Box<Expr>),
    Gt(Box<Expr>, Box<Expr>),
    Le(Box<Expr>, Box<Expr>),
    Ge(Box<Expr>, Box<Expr>),
    Neg(Box<Expr>),
    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
    Mod(Box<Expr>, Box<Expr>),
    Call(Box<Expr>, Vec<Expr>),
    Id(Span),
    Literal(Literal),
}

#[derive(Debug, Clone, Hash)]
pub struct Literal {
    pub lit: TokenNumberLiteral,
    pub span: Span,
}
