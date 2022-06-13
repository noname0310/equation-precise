use std::collections::{HashMap, HashSet};

use lexer;
use parser;
use diagnostic;
use transpiler;
use wasm_bindgen::prelude::*;
use std::f64;

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
                ("e".to_string(), f64::consts::E),
                ("pi".to_string(), f64::consts::PI),
                ("ln2".to_string(), f64::consts::LN_2),
                ("ln10".to_string(), f64::consts::LN_10),
                ("sqrt2".to_string(), f64::consts::SQRT_2),
            ]),
            &HashMap::new(),
            &HashSet::from([
                "x".to_string(),
                "y".to_string()
            ])
        ) {
            result.push_str("Invalid equation");
        } else {
            result.push_str(transpiler::transplie_to_js(&ast, equality_approximate_threshold).as_str());
        }
    }

    result.push_str(format!("\n{:?}", diagnostic::Diagnostic::diagnostics()).as_str());

    result
}
