use lexer;
use parser;
use diagnostic;

fn main() {
    let mut input = String::new();
    std::io::stdin().read_line(&mut input).unwrap();

    let token_iter = lexer::token_iter(&input);

    let ast = parser::parse_top_level_expression(
        parser::ParserContext::new(
            Box::new(token_iter),
            parser::create_binary_op_precedence()
        )
    );

    println!("{:?}", ast);
    println!("{:?}", diagnostic::Diagnostic::diagnostics());
}
