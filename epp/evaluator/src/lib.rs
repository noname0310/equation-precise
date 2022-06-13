use std::collections::HashMap;
use ast::Expr;
use validator::validate_equation;
use diagnostic::{Diagnostic, Level};

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
            let lhs = fold_const_expr(lhs, variables)?;
            let rhs = fold_const_expr(rhs, variables)?;
            return Ok(
                EvalResult {
                    rhs, op: ast.to_str(), lhs,
                    eval_result: f64::abs(lhs - rhs) < equality_approximate_threshold
                }
            );
        },
        Expr::Lt(lhs, rhs) => {
            let lhs = fold_const_expr(lhs, variables)?;
            let rhs = fold_const_expr(rhs, variables)?;
            return Ok(
                EvalResult {
                    rhs, op: ast.to_str(), lhs,
                    eval_result: lhs < rhs
                }
            );
        },
        Expr::Gt(lhs, rhs) => {
            let lhs = fold_const_expr(lhs, variables)?;
            let rhs = fold_const_expr(rhs, variables)?;
            return Ok(
                EvalResult {
                    rhs, op: ast.to_str(), lhs,
                    eval_result: lhs > rhs
                }
            );
        },
        Expr::Le(lhs, rhs) => {
            let lhs = fold_const_expr(lhs, variables)?;
            let rhs = fold_const_expr(rhs, variables)?;
            return Ok(
                EvalResult {
                    rhs, op: ast.to_str(), lhs,
                    eval_result: lhs <= rhs
                }
            );
        },
        Expr::Ge(lhs, rhs) => {
            let lhs = fold_const_expr(lhs, variables)?;
            let rhs = fold_const_expr(rhs, variables)?;
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

fn fold_const_expr(ast: &Box<Expr>, variables: &HashMap<String, f64>) -> Result<f64, ()> {
    match ast.as_ref() {
        Expr::Literal(value) => Ok(value.clone()),
        Expr::Add(lhs, rhs) => Ok(fold_const_expr(lhs, variables)? + fold_const_expr(rhs, variables)?),
        Expr::Sub(lhs, rhs) => Ok(fold_const_expr(lhs, variables)? - fold_const_expr(rhs, variables)?),
        Expr::Mul(lhs, rhs) => Ok(fold_const_expr(lhs, variables)? * fold_const_expr(rhs, variables)?),
        Expr::Div(lhs, rhs) => Ok(fold_const_expr(lhs, variables)? / fold_const_expr(rhs, variables)?),
        Expr::Mod(lhs, rhs) => Ok(fold_const_expr(lhs, variables)? % fold_const_expr(rhs, variables)?),
        Expr::Pow(lhs, rhs) => Ok(fold_const_expr(lhs, variables)?.powf(fold_const_expr(rhs, variables)?)),
        Expr::Unary(expr) => fold_const_expr(expr, variables).map(|x| -x),
        Expr::Id(id) => {
            if let Some(value) = variables.get(id) {
                Ok(value.clone())
            } else {
                panic!("variable not found");
            }
        },
        Expr::Eq(..)
        | Expr::Lt(..)
        | Expr::Gt(..)
        | Expr::Le(..)
        | Expr::Ge(..) => panic!("constant expression expected"),
        Expr::Call(func_name, params) => {
            let params = params.iter().map(|param| fold_const_expr(param, variables)).collect::<Result<Vec<f64>, ()>>()?;
            match func_name.as_str() {
                "abs" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "abs function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::abs(params[0]))
                },
                "acos" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "acos function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::acos(params[0]))
                },
                "acosh" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "acosh function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::acosh(params[0]))
                },
                "asin" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "asin function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::asin(params[0]))
                },
                "asinh" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "asinh function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::asinh(params[0]))
                },
                "atan" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "atan function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::atan(params[0]))
                },
                "atan2" => {
                    if params.len() != 2 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "atan2 function expects two parameters".to_string(),
                            ),
                        )
                    }
                    Ok(f64::atan2(params[0], params[1]))
                },
                "atanh" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "atanh function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::atanh(params[0]))
                },
                "cbrt" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "cbrt function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::cbrt(params[0]))
                },
                "ceil" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "ceil function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::ceil(params[0]))
                },
                "cos" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "cos function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::cos(params[0]))
                },
                "cosh" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "cosh function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::cosh(params[0]))
                },
                "exp" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "exp function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::exp(params[0]))
                },
                "exp_m1" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "exp_m1 function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::exp_m1(params[0]))
                },
                "floor" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "floor function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::floor(params[0]))
                },
                "hypot" => {
                    if params.len() != 2 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "hypot function expects two parameters".to_string(),
                            ),
                        )
                    }
                    Ok(f64::hypot(params[0], params[1]))
                },
                "ln" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "ln function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::ln(params[0]))
                },
                "ln_1p" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "ln_1p function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::ln_1p(params[0]))
                },
                "log" => {
                    if params.len() != 2 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "log function expects two parameters".to_string(),
                            ),
                        )
                    }
                    Ok(f64::log(params[0], params[1]))
                },
                "log10" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "log10 function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::log10(params[0]))
                },
                "log2" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "log2 function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::log2(params[0]))
                },
                "max" => {
                    if params.len() != 2 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "max function expects two parameters".to_string(),
                            ),
                        )
                    }
                    Ok(f64::max(params[0], params[1]))
                },
                "min" => {
                    if params.len() != 2 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "min function expects two parameters".to_string(),
                            ),
                        )
                    }
                    Ok(f64::min(params[0], params[1]))
                },
                "pow" => {
                    if params.len() != 2 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "pow function expects two parameters".to_string(),
                            ),
                        )
                    }
                    Ok(f64::powf(params[0], params[1]))
                },
                "round" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "round function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::round(params[0]))
                },
                "sin" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "sin function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::sin(params[0]))
                },
                "sinh" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "sinh function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::sinh(params[0]))
                },
                "sqrt" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "sqrt function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::sqrt(params[0]))
                },
                "tan" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "tan function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::tan(params[0]))
                },
                "tanh" => {
                    if params.len() != 1 {
                        Diagnostic::push_new(
                            Diagnostic::new(
                                Level::Error,
                                "tanh function expects one parameter".to_string(),
                            ),
                        )
                    }
                    Ok(f64::tanh(params[0]))
                },
                _ => panic!("function not found"),
            }
        }
    }
}
