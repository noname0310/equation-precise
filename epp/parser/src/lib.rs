mod parser_context;
use parser_context::ParserContext;

use std::collections::HashMap;

use ast::Expr;
use lexer::{Token, token_iter};
use diagnostic::{Diagnostic, Level};


/// number_expr ::= number
fn parse_number_expr(ctx: &ParserContext) -> Box<Expr> {
    if let Token::NumberLiteral(number) = ctx.current_token() {
        ctx.next_token();
        Box::new(Expr::Literal(number.parse::<f64>().unwrap()))
    }
    unreachable!()
}

/// paren_expr ::= '(' expression ')'
fn parse_paren_expr(ctx: &ParserContext) -> Box<Expr> {
    ctx.next_token(); // eat (.
    let v = parse_expression();
    if (!v) return nullptr;

    if (cur_tok != ')')
        return log_error("expected ')'");
        ctx.next_token(); // eat ).
    return v;
}

/// identifier_expr
///   ::= identifier
///   ::= identifier '(' expression* ')'
fn parse_identifier_expr(ctx: &ParserContext) -> Box<Expr> {
    if let Token::Id(id_name) = ctx.current_token() {
        ctx.next_token(); // eat identifier.
    
        if (ctx.current_token().cur_tok != '(') { // Simple variable ref.
            return std::make_unique<variable_expr_ast>(id_name);
        }
    
        // Call.
        ctx.next_token(); // eat (
        std::vector<std::unique_ptr<expr_ast>> args;
        if (cur_tok != ')') {
            while (true) {
                if (auto arg = parse_expression())
                    args.push_back(std::move(arg));
                else
                    return nullptr;
    
                if (cur_tok == ')')
                    break;
    
                if (cur_tok != ',')
                    return log_error("Expected ')' or ',' in argument list");
                ctx.next_token();
            }
        }
    
        // Eat the ')'.
        ctx.next_token();
    
        return std::make_unique<call_expr_ast>(id_name, std::move(args));
    } else {
        unreachable!()
    }
}

/// primary
///   ::= identifier_expr
///   ::= number_expr
///   ::= paren_expr
fn parse_primary(ctx: &ParserContext) -> Box<Expr> {
    match ctx.current_token() {
        Token::Id => parse_identifier_expr(),
        Token::NumberLiteral(number) => parse_number_expr(),
        Token::OpenParen => parse_paren_expr(),
        _ => diagnostic::Diagnostic
    }
    switch (cur_tok) {
    default:
        return log_error("unknown token when expecting an expression");
    case tok_identifier:
        return parse_identifier_expr();
    case tok_number:
        return parse_number_expr();
    case '(':
        return parse_paren_expr();
    }
}

/// bin_op_rhs
///   ::= ('+' primary)*
static std::unique_ptr<expr_ast> parse_bin_op_rhs(
    const int expr_precedence,
    std::unique_ptr<expr_ast> lhs
) {
    // If this is a bin_op, find its precedence.
    for (;;) {
	    const int tok_precedence = get_tok_precedence();

        // If this is a bin_op that binds at least as tightly as the current bin_op,
        // consume it, otherwise we are done.
        if (tok_precedence < expr_precedence)
            return lhs;

        // Okay, we know this is a bin_op.
        int BinOp = cur_tok;
        get_next_token(); // eat bin_op

        // Parse the primary expression after the binary operator.
        auto rhs = parse_primary();
        if (!rhs)
            return nullptr;

        // If BinOp binds less tightly with RHS than the operator after RHS, let
        // the pending operator take RHS as its LHS.
        const int next_precedence = get_tok_precedence();
        if (tok_precedence < next_precedence) {
            rhs = parse_bin_op_rhs(tok_precedence + 1, std::move(rhs));
            if (!rhs)
                return nullptr;
        }

        // Merge LHS/RHS.
        lhs =
            std::make_unique<binary_expr_ast>(BinOp, std::move(lhs), std::move(rhs));
    }
}

/// expression
///   ::= primary bin_op_rhs
///
static std::unique_ptr<expr_ast> parse_expression() {
    auto lhs = parse_primary();
    if (!lhs)
        return nullptr;

    return parse_bin_op_rhs(0, std::move(lhs));
}

/// prototype
///   ::= id '(' id* ')'
static std::unique_ptr<prototype_ast> parse_prototype() {
    if (cur_tok != tok_identifier)
        return log_error_p("Expected function name in prototype");

    std::string fn_name = identifier_str;
    get_next_token();

    if (cur_tok != '(')
        return log_error_p("Expected '(' in prototype");

    std::vector<std::string> ArgNames;
    while (get_next_token() == tok_identifier)
        ArgNames.push_back(identifier_str);
    if (cur_tok != ')')
        return log_error_p("Expected ')' in prototype");

    // success.
    get_next_token(); // eat ')'.

    return std::make_unique<prototype_ast>(fn_name, std::move(ArgNames));
}

/// definition ::= 'def' prototype expression
static std::unique_ptr<FunctionAST> parse_definition() {
    get_next_token(); // eat def.
    auto proto = parse_prototype();
    if (!proto)
        return nullptr;

    if (auto E = parse_expression())
        return std::make_unique<FunctionAST>(std::move(proto), std::move(E));
    return nullptr;
}

/// top_level_expr ::= expression
static std::unique_ptr<FunctionAST> parse_top_level_expr() {
    if (auto e = parse_expression()) {
        // Make an anonymous proto.
        auto proto = std::make_unique<prototype_ast>("__anon_expr",
            std::vector<std::string>());
        return std::make_unique<FunctionAST>(std::move(proto), std::move(e));
    }
    return nullptr;
}

// //===----------------------------------------------------------------------===//
// // Top-Level parsing
// //===----------------------------------------------------------------------===//

// static void handle_top_level_expression() {
//     // Evaluate a top-level expression into an anonymous function.
//     if (parse_top_level_expr()) {
//         fprintf(stderr, "Parsed a top-level expr\n");
//     }
//     else {
//         // Skip token for error recovery.
//         get_next_token();
//     }
// }

// /// top ::= definition | external | expression | ';'
// static void main_loop() {
//     while (true) {
//         fprintf(stderr, "ready> ");
//         switch (cur_tok) {
//         case tok_eof:
//             return;
//         case ';': // ignore top-level semicolons.
//             get_next_token();
//             break;
//         case tok_def:
//             handle_definition();
//             break;
//         case tok_extern:
//             handle_extern();
//             break;
//         default:
//             handle_top_level_expression();
//             break;
//         }
//     }
// }

// //===----------------------------------------------------------------------===//
// // Main driver code.
// //===----------------------------------------------------------------------===//

// int main() {
//     // Install standard binary operators.
//     // 1 is lowest precedence.
//     bin_op_precedence['<'] = 10;
//     bin_op_precedence['+'] = 20;
//     bin_op_precedence['-'] = 20;
//     bin_op_precedence['*'] = 40; // highest.

//     // Prime the first token.
//     fprintf(stderr, "ready> ");
//     get_next_token();

//     // Run the main "interpreter loop" now.
//     main_loop();

//     return 0;
// }
