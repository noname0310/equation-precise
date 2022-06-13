use std::collections::HashMap;

use lexer;
use parser;
use diagnostic;
use transpiler;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn emit(
    expr: &str,
    equality_approximate_threshold: f64
) -> String {
    diagnostic::Diagnostic::clear();
    
    let token_iter = lexer::token_iter(expr);

    let ast = parser::parse_top_level_expression(
        parser::ParserContext::new(
            Box::new(token_iter),
            parser::create_binary_op_precedence()
        )
    );

    let mut result = String::new();

    if let Ok(ast) = ast {
        if !validator::validate_equation(
            &ast, 
            &HashMap::from([
            ("x".to_string(), 1.0),
            ("y".to_string(), 2.0),
            ("z".to_string(), 3.0),
        ])) {
            result.push_str("Invalid equation");
        } else {
            result.push_str(transpiler::transplie_to_js(&ast, equality_approximate_threshold).as_str());
        }
    }

    result.push_str(format!("\n{:?}", diagnostic::Diagnostic::diagnostics()).as_str());

    result
}
