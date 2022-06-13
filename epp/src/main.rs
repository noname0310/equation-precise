use std::collections::HashMap;

use lexer;
use parser;
use diagnostic;
use evaluator;

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

    if let Ok(ast) = ast {
        let eval_result = evaluator::eval(
            ast,
            &HashMap::from([
                ("x".to_string(), 1.0),
                ("y".to_string(), 2.0),
                ("z".to_string(), 3.0),
            ])
        );

        println!("{:?}", eval_result);
    }

    println!("{:?}", diagnostic::Diagnostic::diagnostics());
}
