use std::collections::HashMap;
use ast::Expr;
use validator::validate_equation;

#[derive(Debug)]
pub struct EvalResult {
    lhs: f64,
    op: &'static str,
    rhs: f64,
    eval_result: bool,
}

impl EvalResult {
    pub fn lhs(&self) -> f64 {
        self.lhs
    }

    pub fn op(&self) -> &'static str {
        self.op
    }

    pub fn rhs(&self) -> f64 {
        self.rhs
    }

    pub fn eval_result(&self) -> bool {
        self.eval_result
    }
}

pub fn eval_equation(
    ast: &Box<Expr>,
    variables: &HashMap<String, f64>,
    equality_approximate_threshold: f64,
) -> Result<EvalResult, ()> {
    if !validate_equation(ast, variables) {
        return Err(());
    }

    match ast.as_ref() {
        Expr::Eq(lhs, rhs) => {
            let lhs = fold_const_expr(lhs, variables);
            let rhs = fold_const_expr(rhs, variables);
            return Ok(
                EvalResult {
                    rhs, op: ast.to_str(), lhs,
                    eval_result: f64::abs(lhs - rhs) < equality_approximate_threshold
                }
            );
        },
        Expr::Lt(lhs, rhs) => {
            let lhs = fold_const_expr(lhs, variables);
            let rhs = fold_const_expr(rhs, variables);
            return Ok(
                EvalResult {
                    rhs, op: ast.to_str(), lhs,
                    eval_result: lhs < rhs
                }
            );
        },
        Expr::Gt(lhs, rhs) => {
            let lhs = fold_const_expr(lhs, variables);
            let rhs = fold_const_expr(rhs, variables);
            return Ok(
                EvalResult {
                    rhs, op: ast.to_str(), lhs,
                    eval_result: lhs > rhs
                }
            );
        },
        Expr::Le(lhs, rhs) => {
            let lhs = fold_const_expr(lhs, variables);
            let rhs = fold_const_expr(rhs, variables);
            return Ok(
                EvalResult {
                    rhs, op: ast.to_str(), lhs,
                    eval_result: lhs <= rhs
                }
            );
        },
        Expr::Ge(lhs, rhs) => {
            let lhs = fold_const_expr(lhs, variables);
            let rhs = fold_const_expr(rhs, variables);
            return Ok(
                EvalResult {
                    rhs, op: ast.to_str(), lhs,
                    eval_result: lhs >= rhs
                }
            );
        },
        _ => unreachable!(),
    }
}

fn fold_const_expr(ast: &Box<Expr>, variables: &HashMap<String, f64>) -> f64 {
    match ast.as_ref() {
        Expr::Literal(value) => value.clone(),
        Expr::Add(lhs, rhs) => fold_const_expr(lhs, variables) + fold_const_expr(rhs, variables),
        Expr::Sub(lhs, rhs) => fold_const_expr(lhs, variables) - fold_const_expr(rhs, variables),
        Expr::Mul(lhs, rhs) => fold_const_expr(lhs, variables) * fold_const_expr(rhs, variables),
        Expr::Div(lhs, rhs) => fold_const_expr(lhs, variables) / fold_const_expr(rhs, variables),
        Expr::Mod(lhs, rhs) => fold_const_expr(lhs, variables) % fold_const_expr(rhs, variables),
        Expr::Pow(lhs, rhs) => fold_const_expr(lhs, variables).powf(fold_const_expr(rhs, variables)),
        Expr::Unary(expr) => -fold_const_expr(expr, variables),
        Expr::Id(id) => {
            if let Some(value) = variables.get(id) {
                return value.clone();
            } else {
                panic!("variable not found");
            }
        },
        Expr::Eq(..)
        | Expr::Lt(..)
        | Expr::Gt(..)
        | Expr::Le(..)
        | Expr::Ge(..) => panic!("constant expression expected"),
        Expr::Call(..) => unimplemented!(),
    }
}
