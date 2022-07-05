use std::collections::HashMap;
use ast::Expr;

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
    ast: &Expr,
    variables: &HashMap<String, f64>,
    equality_approximate_threshold: f64,
) -> Result<EvalResult, ()> {
    match ast {
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

fn fold_const_expr(ast: &Expr, variables: &HashMap<String, f64>) -> f64 {
    match ast {
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
                value.clone()
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
            let params = params.iter().map(|param| fold_const_expr(param, variables)).collect::<Vec<f64>>();
            match func_name.as_str() {
                "abs" => f64::abs(params[0]),
                "acos" => f64::acos(params[0]),
                "acosh" => f64::acosh(params[0]),
                "asin" => f64::asin(params[0]),
                "asinh" => f64::asinh(params[0]),
                "atan" => f64::atan(params[0]),
                "atan2" => f64::atan2(params[0], params[1]),
                "atanh" => f64::atanh(params[0]),
                "cbrt" => f64::cbrt(params[0]),
                "ceil" => f64::ceil(params[0]),
                "cos" => f64::cos(params[0]),
                "cosh" => f64::cosh(params[0]),
                "exp" => f64::exp(params[0]),
                "exp_m1" => f64::exp_m1(params[0]),
                "floor" => f64::floor(params[0]),
                "hypot" => f64::hypot(params[0], params[1]),
                "ln" => f64::ln(params[0]),
                "ln_1p" => f64::ln_1p(params[0]),
                "log" => f64::log(params[0], params[1]),
                "log10" => f64::log10(params[0]),
                "log2" => f64::log2(params[0]),
                "max" => f64::max(params[0], params[1]),
                "min" => f64::min(params[0], params[1]),
                "pow" => f64::powf(params[0], params[1]),
                "round" => f64::round(params[0]),
                "sin" => f64::sin(params[0]),
                "sinh" => f64::sinh(params[0]),
                "sqrt" => f64::sqrt(params[0]),
                "tan" => f64::tan(params[0]),
                "tanh" => f64::tanh(params[0]),
                _ => panic!("function not found"),
            }
        }
    }
}

pub fn fold_expr(ast: &Expr) -> Box<Expr> {
    match ast {
        Expr::Eq(lhs, rhs) => {
            let lhs = fold_expr(lhs);
            let rhs = fold_expr(rhs);
            return Box::new(Expr::Eq(lhs, rhs));
        },
        Expr::Lt(lhs, rhs) => {
            let lhs = fold_expr(lhs);
            let rhs = fold_expr(rhs);
            return Box::new(Expr::Lt(lhs, rhs));
        },
        Expr::Gt(lhs, rhs) => {
            let lhs = fold_expr(lhs);
            let rhs = fold_expr(rhs);
            return Box::new(Expr::Gt(lhs, rhs));
        },
        Expr::Le(lhs, rhs) => {
            let lhs = fold_expr(lhs);
            let rhs = fold_expr(rhs);
            return Box::new(Expr::Le(lhs, rhs));
        },
        Expr::Ge(lhs, rhs) => {
            let lhs = fold_expr(lhs);
            let rhs = fold_expr(rhs);
            return Box::new(Expr::Ge(lhs, rhs));
        },
        Expr::Unary(expr) => {
            let expr = fold_expr(expr);

            match expr.as_ref() {
                Expr::Literal(expr) => return Box::new(Expr::Literal(-expr)),
                Expr::Unary(expr) => return expr.clone(),
                _ => { }
            }
            return Box::new(Expr::Unary(expr));
        },
        Expr::Add(lhs, rhs) => {
            let lhs = fold_expr(lhs);
            let rhs = fold_expr(rhs);

            if let Expr::Literal(lhs) = lhs.as_ref() {
                if *lhs == 0.0 {
                    return rhs;
                }
            }

            if let Expr::Literal(rhs) = rhs.as_ref() {
                if *rhs == 0.0 {
                    return lhs;
                }
            }
            
            if let Expr::Literal(lhs) = lhs.as_ref() {
                if let Expr::Literal(rhs) = rhs.as_ref() {
                    return Box::new(Expr::Literal(lhs + rhs));
                }
            }
            return Box::new(Expr::Add(lhs, rhs));
        },
        Expr::Sub(lhs, rhs) => {
            let lhs = fold_expr(lhs);
            let rhs = fold_expr(rhs);

            if let Expr::Literal(lhs) = lhs.as_ref() {
                if *lhs == 0.0 {
                    return Box::new(Expr::Unary(rhs));
                }
            }

            if let Expr::Literal(rhs) = rhs.as_ref() {
                if *rhs == 0.0 {
                    return lhs;
                }
            }

            if let Expr::Literal(lhs) = lhs.as_ref() {
                if let Expr::Literal(rhs) = rhs.as_ref() {
                    return Box::new(Expr::Literal(lhs - rhs));
                }
            }
            return Box::new(Expr::Sub(lhs, rhs));
        },
        Expr::Mul(lhs, rhs) => {
            let lhs = fold_expr(lhs);
            let rhs = fold_expr(rhs);

            if let Expr::Literal(lhs) = lhs.as_ref() {
                if *lhs == 0.0 {
                    return Box::new(Expr::Literal(0.0));
                }
                if *lhs == 1.0 {
                    return rhs;
                }
            }

            if let Expr::Literal(rhs) = rhs.as_ref() {
                if *rhs == 0.0 {
                    return Box::new(Expr::Literal(0.0));
                }
                if *rhs == 1.0 {
                    return lhs;
                }
            }

            if let Expr::Literal(lhs) = lhs.as_ref() {
                if let Expr::Literal(rhs) = rhs.as_ref() {
                    return Box::new(Expr::Literal(lhs * rhs));
                }
            }
            return Box::new(Expr::Mul(lhs, rhs));
        },
        Expr::Div(lhs, rhs) => {
            let lhs = fold_expr(lhs);
            let rhs = fold_expr(rhs);

            if let Expr::Literal(lhs) = lhs.as_ref() {
                if *lhs == 0.0 {
                    return Box::new(Expr::Literal(0.0));
                }
            }

            if let Expr::Literal(lhs) = lhs.as_ref() {
                if let Expr::Literal(rhs) = rhs.as_ref() {
                    return Box::new(Expr::Literal(lhs / rhs));
                }
            }
            return Box::new(Expr::Div(lhs, rhs));
        },
        Expr::Mod(lhs, rhs) => {
            let lhs = fold_expr(lhs);
            let rhs = fold_expr(rhs);
            if let Expr::Literal(lhs) = lhs.as_ref() {
                if let Expr::Literal(rhs) = rhs.as_ref() {
                    return Box::new(Expr::Literal(lhs % rhs));
                }
            }
            return Box::new(Expr::Mod(lhs, rhs));
        },
        Expr::Pow(lhs, rhs) => {
            let lhs = fold_expr(lhs);
            let rhs = fold_expr(rhs);

            if let Expr::Literal(lhs) = lhs.as_ref() {
                if *lhs == 0.0 {
                    return Box::new(Expr::Literal(0.0));
                }
                if *lhs == 1.0 {
                    return Box::new(Expr::Literal(1.0));
                }
            }

            if let Expr::Literal(rhs) = rhs.as_ref() {
                if *rhs == 0.0 {
                    return Box::new(Expr::Literal(1.0));
                }
                if *rhs == 1.0 {
                    return lhs;
                }
            }

            if let Expr::Literal(lhs) = lhs.as_ref() {
                if let Expr::Literal(rhs) = rhs.as_ref() {
                    return Box::new(Expr::Literal(lhs.powf(*rhs)));
                }
            }
            return Box::new(Expr::Pow(lhs, rhs));
        },
        Expr::Call(name, params) => {
            let params = params.iter().map(|x| fold_expr(x)).collect();
            return Box::new(Expr::Call(name.to_string(), params));
        }
        Expr::Id(name) => {
            return Box::new(Expr::Id(name.to_string()));
        }
        Expr::Literal(literal) => {
            return Box::new(Expr::Literal(*literal));
        }
    }
}
