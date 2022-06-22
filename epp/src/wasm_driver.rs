use std::collections::{HashMap, HashSet};

use ast::Expr;
use lexer;
use parser;
use diagnostic;
use transpiler;
use wasm_bindgen::prelude::*;
use std::f64;

use crate::{parse_result::ParseResult};

lazy_static! {
    pub static ref CONSTANTS: HashMap<String, f64> = HashMap::from([
        ("e".to_string(), f64::consts::E),
        ("pi".to_string(), f64::consts::PI),
        ("ln2".to_string(), f64::consts::LN_2),
        ("ln10".to_string(), f64::consts::LN_10),
        ("sqrt2".to_string(), f64::consts::SQRT_2),
    ]);

    pub static ref CONSTANTS_NAMES: HashMap<String, String> = HashMap::from([
        ("e".to_string(), "Math.E".to_string()),
        ("pi".to_string(), "Math.PI".to_string()),
        ("ln2".to_string(), "Math.LN2".to_string()),
        ("ln10".to_string(), "Math.LN10".to_string()),
        ("sqrt2".to_string(), "Math.SQRT2".to_string()),
    ]);
}

static mut AST_MAP: Option<HashMap<i32, Box<Expr>>> = None;
static mut NEXT_ID: i32 = 1;

fn ast_map() -> &'static mut HashMap<i32, Box<Expr>> {
    if let Some(map) = unsafe { AST_MAP.as_mut() } {
        map
    } else {
        unsafe {
            AST_MAP = Some(HashMap::new());
            AST_MAP.as_mut().unwrap()
        }
    }
}

fn register_ast(ast: Box<Expr>) -> i32 {
    let id = unsafe { NEXT_ID };
    ast_map().insert(id, ast);
    unsafe { NEXT_ID += 1; }
    id
}

#[wasm_bindgen]
pub fn dispose_ast(id: i32) {
    ast_map().remove(&id);
}

#[wasm_bindgen]
pub fn parse_bool_expr(
    expr: &str
) -> ParseResult {
    diagnostic::Diagnostic::clear();
    
    let token_iter = lexer::token_iter(expr);

    let ast = parser::parse_top_level_expression(
        parser::ParserContext::new(
            Box::new(token_iter),
            parser::create_binary_op_precedence()
        )
    );

    let result;

    if let Ok(ast) = ast {
        if !validator::validate_bool_equation(
            &ast, 
            &CONSTANTS,
            &HashMap::new(),
            &HashSet::from([
                "x".to_string(),
                "y".to_string()
            ])
        ) {
            result = -1;
        } else {
            result = register_ast(ast);
        }
    } else {
        result = -1;
    }

    ParseResult {
        ast_id: result,
        diagnostics: serde_json::to_string(&diagnostic::Diagnostic::diagnostics().to_vec()).unwrap()
    }
}

#[wasm_bindgen]
pub fn emit_bool_expr(
    ast_id: i32,
    equality_approximate_threshold: f64
) -> String {
    transpiler::transplie_to_js(
        &ast_map().get(&ast_id).unwrap(),
        &CONSTANTS_NAMES,
        equality_approximate_threshold
    )
}

#[wasm_bindgen]
pub fn parse_number_expr(
    expr: &str
) -> ParseResult {
    diagnostic::Diagnostic::clear();
    
    let token_iter = lexer::token_iter(expr);

    let ast = parser::parse_top_level_expression(
        parser::ParserContext::new(
            Box::new(token_iter),
            parser::create_binary_op_precedence()
        )
    );

    let result;

    if let Ok(ast) = ast {
        if !validator::validate_number_equation(
            &ast, 
            &CONSTANTS,
            &HashMap::new(),
            &HashSet::from([
                "x".to_string()
            ])
        ) {
            result = -1;
        } else {
            result = register_ast(ast);
        }
    } else {
        result = -1;
    }

    ParseResult {
        ast_id: result,
        diagnostics: serde_json::to_string(&diagnostic::Diagnostic::diagnostics().to_vec()).unwrap()
    }
}

#[wasm_bindgen]
pub fn emit_number_expr(
    ast_id: i32
) -> String {
    transpiler::transplie_to_js(
        &ast_map().get(&ast_id).unwrap(),
        &CONSTANTS_NAMES,
        0.0
    )
}
