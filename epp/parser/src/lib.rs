mod parser_context;

pub use parser_context::*;

use ast::Expr;
use lexer::Token;
use diagnostic::{Diagnostic, Level};


/// number_expr ::= number
fn parse_number_expr(ctx: &mut ParserContext) -> Box<Expr> {
    if let Token::NumberLiteral(number) = ctx.current_token().unwrap() {
        let number = number.to_owned();
        ctx.next_token();
        return Box::new(Expr::Literal(number.parse::<f64>().unwrap()));
    }
    unreachable!()
}

/// paren_expr ::= '(' expression ')'
fn parse_paren_expr(ctx: &mut ParserContext) -> Result<Box<Expr>, ()> {
    ctx.next_token(); // eat (.
    let v = parse_expression(ctx)?;

    if ctx.current_token().unwrap() != &Token::CloseParen {
        Diagnostic::push_new(Diagnostic::new(
            Level::Error,
            "expected ')'".to_string(),
        ));
    }

    ctx.next_token(); // eat ).
    Ok(v)
}

/// identifier_expr
///   ::= identifier
///   ::= identifier '(' expression* ')'
fn parse_identifier_expr(ctx: &mut ParserContext) -> Result<Box<Expr>, ()> {
    if let Token::Id(id_name) = ctx.current_token().unwrap() {
        let id_name = id_name.to_owned();

        ctx.next_token(); // eat identifier.
    
        if ctx.current_token().unwrap() != &Token::OpenParen { // Simple variable ref.
            return Ok(Box::new(Expr::Id(id_name)));
        }
    
        // Call.
        ctx.next_token(); // eat (
        let mut args = Vec::new();
        if ctx.current_token().unwrap() != &Token::CloseParen {
            loop {
                let arg = parse_expression(ctx)?;
                args.push(*arg);
                
                if ctx.current_token().unwrap() == &Token::CloseParen {
                    break;
                }
    
                if ctx.current_token().unwrap() != &Token::Comma {
                    Diagnostic::push_new(Diagnostic::new(
                        Level::Error,
                        "Expected ')' or ',' in argument list".to_string(),
                    ));
                    return Err(());
                }
                ctx.next_token();
            }
        }
    
        // Eat the ')'.
        ctx.next_token();
    
        return Ok(Box::new(Expr::Call(id_name.to_owned(), args)));
    } else {
        unreachable!()
    }
}

/// primary
///   ::= identifier_expr
///   ::= number_expr
///   ::= paren_expr
fn parse_primary(ctx: &mut ParserContext) -> Result<Box<Expr>, ()> {
    match ctx.current_token().unwrap() {
        Token::Id(..) => parse_identifier_expr(ctx),
        Token::NumberLiteral(..) => Ok(parse_number_expr(ctx)),
        Token::OpenParen => parse_paren_expr(ctx),
        _ => {
            Diagnostic::push_new(Diagnostic::new(
                Level::Error,
                "unknown token when expecting an expression".to_string(),
            ));
            Err(())
        },
    }
}

/// bin_op_rhs
///   ::= ('+' primary)*
fn parse_bin_op_rhs(ctx: &mut ParserContext, expr_precedence: i32, lhs: Box<Expr>) -> Result<Box<Expr>, ()> {
    let mut current_lhs = lhs;

    // If this is a bin_op, find its precedence.
    loop {
	    let tok_precedence = ctx.get_token_precedence(&ctx.current_token().unwrap());

        // If this is a bin_op that binds at least as tightly as the current bin_op,
        // consume it, otherwise we are done.
        if tok_precedence < expr_precedence {
            return Ok(current_lhs);
        }

        // Okay, we know this is a bin_op.
        let bin_op = ctx.current_token().unwrap().to_owned();
        ctx.next_token(); // eat bin_op

        // Parse the primary expression after the binary operator.
        let mut rhs = parse_primary(ctx)?;

        // If BinOp binds less tightly with RHS than the operator after RHS, let
        // the pending operator take RHS as its LHS.
        let next_precedence = ctx.get_token_precedence(&ctx.current_token().unwrap());
        if tok_precedence < next_precedence {
            rhs = parse_bin_op_rhs(ctx, tok_precedence + 1, rhs)?;
        }

        // Merge LHS/RHS.
        current_lhs = Box::new(
            match bin_op {
                Token::Eq => Expr::Eq(current_lhs, rhs),
                Token::Lt => Expr::Lt(current_lhs, rhs),
                Token::Gt => Expr::Gt(current_lhs, rhs),
                Token::Plus => Expr::Add(current_lhs, rhs),
                Token::Minus => Expr::Sub(current_lhs, rhs),
                Token::Star => Expr::Mul(current_lhs, rhs),
                Token::Slash => Expr::Div(current_lhs, rhs),
                Token::Percent => Expr::Mod(current_lhs, rhs),
                Token::Caret => Expr::Pow(current_lhs, rhs),
                _ => unreachable!(),
            }
        );
    }
}

/// expression
///   ::= primary bin_op_rhs
///
fn parse_expression(ctx: &mut ParserContext) -> Result<Box<Expr>, ()> {
    let lhs = parse_primary(ctx)?;
    return parse_bin_op_rhs(ctx, 0, lhs);
}

//===----------------------------------------------------------------------===//
// Top-Level parsing
//===----------------------------------------------------------------------===//

pub fn parse_top_level_expression(mut ctx: ParserContext) -> Result<Box<Expr>, ()> {
    if let Some(..) = ctx.current_token() {
        return parse_expression(&mut ctx);
    } else {
        return Err(());
    }
}
