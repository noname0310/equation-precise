use std::collections::HashMap;

use ast::Expr;

#[macro_use]
extern crate lazy_static;

lazy_static! {
    static ref JS_FUNCTION_MAP: HashMap<&'static str, &'static str> = {
        let mut map = HashMap::new();
        //function_name => js_function_name
        map.insert("abs", "Math.abs");
        map.insert("acos", "Math.acos");
        map.insert("acosh", "Math.acosh");
        map.insert("asin", "Math.asin");
        map.insert("asinh", "Math.asinh");
        map.insert("atan", "Math.atan");
        map.insert("atan2", "Math.atan2");
        map.insert("atanh", "Math.atanh");
        map.insert("cbrt", "Math.cbrt");
        map.insert("ceil", "Math.ceil");
        map.insert("cos", "Math.cos");
        map.insert("cosh", "Math.cosh");
        map.insert("exp", "Math.exp");
        map.insert("exp_m1", "Math.expm1");
        map.insert("floor", "Math.floor");
        map.insert("hypot", "Math.hypot");
        map.insert("ln", "Math.log");
        map.insert("ln_1p", "Math.log1p");
        map.insert("log", "[this function needs custom implementation]");
        map.insert("log10", "Math.log10");
        map.insert("log2", "Math.log2");
        map.insert("max", "Math.max");
        map.insert("min", "Math.min");
        map.insert("pow", "Math.pow");
        map.insert("round", "Math.round");
        map.insert("sin", "Math.sin");
        map.insert("sinh", "Math.sinh");
        map.insert("sqrt", "Math.sqrt");
        map.insert("tan", "Math.tan");
        map.insert("tanh", "Math.tanh");
        map
    };
}

pub fn transplie_to_js(
    ast: &Expr,
    constant_name_map: &HashMap<String, String>,
    equality_approximate_threshold: f64,
) -> String {
    let mut result = String::new();

    transplie_to_js_internal(ast, constant_name_map, equality_approximate_threshold, &mut result);
    result
}

fn transplie_to_js_internal(
    ast: &Expr,
    constant_name_map: &HashMap<String, String>,
    equality_approximate_threshold: f64,
    result: &mut String, 
) {
    match ast {
        Expr::Id(id) => {
            if let Some(constant_name) = constant_name_map.get(id) {
                result.push_str(constant_name);
            } else {
                result.push_str(id);
            }
        },
        Expr::Call(id, args) => {
            if id == "log" {
                result.push('(');

                result.push_str("Math.log2(");
                transplie_to_js_internal(
                    &args[0],
                    constant_name_map,
                    equality_approximate_threshold,
                    result
                );
                result.push(')');
                result.push_str(" / ");
                result.push_str("Math.log2(");
                transplie_to_js_internal(
                    &args[1],
                    constant_name_map,
                    equality_approximate_threshold,
                    result
                );
                result.push(')');

                result.push(')');
            } else {
                result.push_str(JS_FUNCTION_MAP.get(id.as_str()).expect("function translation not found"));
                result.push('(');
                for arg in args {
                    transplie_to_js_internal(
                        arg,
                        constant_name_map,
                        equality_approximate_threshold,
                        result
                    );
                    result.push_str(", ");
                }
                result.pop();
                result.pop();
                result.push(')');
            }
        },
        Expr::Eq(lhs, rhs) => {
            result.push('(');
            result.push_str("Math.abs(");
            transplie_to_js_internal(
                lhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push_str(" - ");
            transplie_to_js_internal(
                rhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push(')');
            result.push_str(" < ");
            result.push_str(&equality_approximate_threshold.to_string());
            result.push(')');
        },
        Expr::Lt(lhs, rhs) => {
            result.push('(');
            transplie_to_js_internal(
                lhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push_str(" < ");
            transplie_to_js_internal(
                rhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push(')');
        },
        Expr::Gt(lhs, rhs) => {
            result.push('(');
            transplie_to_js_internal(
                lhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push_str(" > ");
            transplie_to_js_internal(
                rhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push(')');
        },
        Expr::Le(lhs, rhs) => {
            result.push('(');
            transplie_to_js_internal(
                lhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push_str(" <= ");
            transplie_to_js_internal(
                rhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push(')');
        },
        Expr::Ge(lhs, rhs) => {
            result.push('(');
            transplie_to_js_internal(
                lhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push_str(" >= ");
            transplie_to_js_internal(
                rhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push(')');
        },
        Expr::Add(lhs, rhs) => {
            result.push('(');
            transplie_to_js_internal(
                lhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push_str(" + ");
            transplie_to_js_internal(
                rhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push(')');
        },
        Expr::Sub(lhs, rhs) => {
            result.push('(');
            transplie_to_js_internal(
                lhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push_str(" - ");
            transplie_to_js_internal(
                rhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push(')');
        },
        Expr::Mul(lhs, rhs) => {
            result.push('(');
            transplie_to_js_internal(
                lhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push_str(" * ");
            transplie_to_js_internal(
                rhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push(')');
        },
        Expr::Div(lhs, rhs) => {
            result.push('(');
            transplie_to_js_internal(
                lhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push_str(" / ");
            transplie_to_js_internal(
                rhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push(')');
        },
        Expr::Mod(lhs, rhs) => {
            result.push('(');
            transplie_to_js_internal(
                lhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push_str(" % ");
            transplie_to_js_internal(
                rhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push(')');
        },
        Expr::Pow(lhs, rhs) => {
            result.push('(');
            transplie_to_js_internal(
                lhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push_str(" ** ");
            transplie_to_js_internal(
                rhs,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push(')');
        },
        Expr::Unary(expr) => {
            result.push('(');
            result.push('-');
            transplie_to_js_internal(
                expr,
                constant_name_map,
                equality_approximate_threshold,
                result
            );
            result.push(')');
        },
        Expr::Literal(literal) => {
            result.push_str(&literal.to_string());
        }
    }
}

pub fn ast_to_string(
    expr: &Expr
) -> String {
    let mut result = String::new();
    ast_to_string_internal(expr, &mut result);
    result
}


fn ast_to_string_internal(
    ast: &Expr,
    result: &mut String, 
) {
    match ast {
        Expr::Id(id) => result.push_str(id),
        Expr::Call(id, args) => {
            result.push_str(id);
            result.push('(');
            for (i, arg) in args.iter().enumerate() {
                if i > 0 {
                    result.push_str(", ");
                }
                ast_to_string_internal(arg, result);
            }
            result.push(')');
        },
        Expr::Eq(lhs, rhs) => {
            result.push('(');
            ast_to_string_internal(lhs, result);
            result.push_str(" = ");
            ast_to_string_internal(rhs, result);
            result.push(')');
        },
        Expr::Lt(lhs, rhs) => {
            result.push('(');
            ast_to_string_internal(lhs, result);
            result.push_str(" < ");
            ast_to_string_internal(rhs, result);
            result.push(')');
        },
        Expr::Gt(lhs, rhs) => {
            result.push('(');
            ast_to_string_internal(lhs, result);
            result.push_str(" > ");
            ast_to_string_internal(rhs, result);
            result.push(')');
        },
        Expr::Le(lhs, rhs) => {
            result.push('(');
            ast_to_string_internal(lhs, result);
            result.push_str(" <= ");
            ast_to_string_internal(rhs, result);
            result.push(')');
        },
        Expr::Ge(lhs, rhs) => {
            result.push('(');
            ast_to_string_internal(lhs, result);
            result.push_str(" >= ");
            ast_to_string_internal(rhs, result);
            result.push(')');
        },
        Expr::Add(lhs, rhs) => {
            result.push('(');
            ast_to_string_internal(lhs, result);
            result.push_str(" + ");
            ast_to_string_internal(rhs, result);
            result.push(')');
        },
        Expr::Sub(lhs, rhs) => {
            result.push('(');
            ast_to_string_internal(lhs, result);
            result.push_str(" - ");
            ast_to_string_internal(rhs, result);
            result.push(')');
        },
        Expr::Mul(lhs, rhs) => {
            result.push('(');
            ast_to_string_internal(lhs, result);
            result.push_str(" * ");
            ast_to_string_internal(rhs, result);
            result.push(')');
        },
        Expr::Div(lhs, rhs) => {
            result.push('(');
            ast_to_string_internal(lhs, result);
            result.push_str(" / ");
            ast_to_string_internal(rhs, result);
            result.push(')');
        },
        Expr::Mod(lhs, rhs) => {
            result.push('(');
            ast_to_string_internal(lhs, result);
            result.push_str(" % ");
            ast_to_string_internal(rhs, result);
            result.push(')');
        },
        Expr::Pow(lhs, rhs) => {
            result.push('(');
            ast_to_string_internal(lhs, result);
            result.push_str(" ^ ");
            ast_to_string_internal(rhs, result);
            result.push(')');
        },
        Expr::Unary(expr) => {
            result.push('(');
            result.push('-');
            ast_to_string_internal(expr, result);
            result.push(')');
        },
        Expr::Literal(literal) => {
            result.push_str(&literal.to_string());
        }
    }
}

pub fn differentiate_expr(ast: &Expr) -> Result<Box<Expr>, String> {
    match ast {
        Expr::Eq(_, _) => Err("Cannot differentiate an equality expression".to_string()),
        Expr::Lt(_, _) => Err("Cannot differentiate a less than expression".to_string()),
        Expr::Gt(_, _) => Err("Cannot differentiate a greater than expression".to_string()),
        Expr::Le(_, _) => Err("Cannot differentiate a less than or equal expression".to_string()),
        Expr::Ge(_, _) => Err("Cannot differentiate a greater than or equal expression".to_string()),
        Expr::Unary(expr) => Ok(Box::new(Expr::Unary(differentiate_expr(expr)?))),
        Expr::Add(lhs, rhs) => Ok( // (f(x) + g(x))' = f'(x) + g'(x)
            Box::new(Expr::Add(
                differentiate_expr(lhs)?,
                differentiate_expr(rhs)?
            ))
        ),
        Expr::Sub(lhs, rhs) => Ok( // (f(x) - g(x))' = f'(x) - g'(x)
            Box::new(Expr::Sub(
                differentiate_expr(lhs)?,
                differentiate_expr(rhs)?
            ))
        ),
        Expr::Mul(lhs, rhs) => Ok( // (f(x) * g(x))' = f'(x) * g(x) + f(x) * g'(x)
            Box::new(Expr::Add(
                Box::new(Expr::Mul(
                    differentiate_expr(lhs)?,
                    rhs.clone(),
                )),
                Box::new(Expr::Mul(
                    lhs.clone(),
                    differentiate_expr(rhs)?,
                ))
            ))
        ),
        Expr::Div(lhs, rhs) => Ok( // (f(x) / g(x))' = (f'(x) * g(x) - f(x) * g'(x)) / g(x)^2
            Box::new(Expr::Div(
                Box::new(Expr::Sub(
                    Box::new(Expr::Mul(
                        differentiate_expr(lhs)?,
                        rhs.clone(),
                    )),
                    Box::new(Expr::Mul(
                        lhs.clone(),
                        differentiate_expr(rhs)?,
                    )),
                )),
                Box::new(Expr::Pow(
                    rhs.clone(),
                    Box::new(Expr::Literal(2.0)),
                ))
            ))
        ),
        Expr::Mod(_, _) => Err("Cannot differentiate a modulo expression".to_string()),
        Expr::Pow(lhs, rhs) => Ok( // (f(x) ^ g(x))' = (g'(x) * ln(f(x)) + g(x) * (f'(x) / f(x))) * f(x) ^ g(x)
            // this mathod is not well defined for negative exponents
            Box::new(Expr::Mul(
                Box::new(Expr::Add(
                    Box::new(Expr::Mul(
                        differentiate_expr(rhs)?,
                        Box::new(Expr::Call("ln".to_string(), vec![lhs.clone()])),
                    )),
                    Box::new(Expr::Mul(
                        rhs.clone(),
                        Box::new(Expr::Div(
                            differentiate_expr(lhs)?,
                            lhs.clone(),
                        )),
                    ))
                )),
                Box::new(Expr::Pow(
                    lhs.clone(),
                    rhs.clone(),
                ))
            ))
        ),
        Expr::Call(function_name, args) => {
            match function_name.as_str() {
                "sin" => Ok( // (sin(f(x)))' = cos(f(x)) * f'(x)
                    Box::new(Expr::Mul(
                        Box::new(Expr::Call(
                            "cos".to_string(),
                            args.clone(),
                        )),
                        differentiate_expr(&args[0])?,
                    ))
                ),
                "cos" => Ok( // (cos(f(x)))' = -sin(f(x)) * f'(x)
                    Box::new(Expr::Mul(
                        Box::new(Expr::Unary(
                            Box::new(Expr::Call(
                                "sin".to_string(),
                                args.clone()
                            ))
                        )),
                        differentiate_expr(&args[0])?,
                    ))
                ),
                "tan" => Ok( // (tan(f(x)))' = sec^2(f(x)) * f'(x) = 1 / (cos^2(f(x))) * f'(x) = f'(x) / (cos^2(f(x)))
                    Box::new(Expr::Div(
                        differentiate_expr(&args[0])?,
                        Box::new(Expr::Pow(
                            Box::new(Expr::Call("cos".to_string(), args.clone())),
                            Box::new(Expr::Literal(2.0))
                        ))
                    ))
                ),
                "ln" => Ok( // (ln(f(x)))' = f'(x) / f(x)
                    Box::new(Expr::Div(
                        differentiate_expr(&args[0])?,
                        args[0].clone(),
                    ))
                ),
                "ln_1p" => Ok( // (ln_1p(f(x)))' = f'(x) / (f(x) + 1)
                    Box::new(Expr::Div(
                        differentiate_expr(&args[0])?,
                        Box::new(Expr::Add(
                            args[0].clone(),
                            Box::new(Expr::Literal(1.0))
                        ))
                    ))
                ),
                "log2" => Ok( // (log2(f(x)))' = f'(x) / (f(x) * ln(2))
                    Box::new(Expr::Div(
                        differentiate_expr(&args[0])?,
                        Box::new(Expr::Mul(
                            args[0].clone(),
                            Box::new(Expr::Call("ln".to_string(), vec![Box::new(Expr::Literal(2.0))]))
                        ))
                    ))
                ),
                "log10" => Ok( // (log10(f(x)))' = f'(x) / (f(x) * ln(10))
                    Box::new(Expr::Div(
                        differentiate_expr(&args[0])?,
                        Box::new(Expr::Mul(
                            args[0].clone(),
                            Box::new(Expr::Call("ln".to_string(), vec![Box::new(Expr::Literal(10.0))]))
                        ))
                    ))
                ),
                "log" => Ok( // (log(f(x), g(x)))' = 
                    Box::new(Expr::Div(
                        Box::new(Expr::Call("ln".to_string(), vec![args[0].clone()])),
                        Box::new(Expr::Call("ln".to_string(), vec![args[1].clone()]))
                    ))
                ),
                "sqrt" => Ok( // (sqrt(f(x)))' = f'(x) / (2 * sqrt(f(x)))
                    Box::new(Expr::Div(
                        differentiate_expr(&args[0])?,
                        Box::new(Expr::Mul(
                            Box::new(Expr::Literal(2.0)),
                            Box::new(Expr::Call("sqrt".to_string(), vec![args[0].clone()]))
                        ))
                    ))
                ),
                "cbrt" => Ok( // (cbrt(f(x)))' = f'(x) / (3 * cbrt(f(x))^2)
                    Box::new(Expr::Div(
                        differentiate_expr(&args[0])?,
                        Box::new(Expr::Mul(
                            Box::new(Expr::Literal(3.0)),
                            Box::new(Expr::Pow(
                                Box::new(Expr::Call("cbrt".to_string(), vec![args[0].clone()])),
                                Box::new(Expr::Literal(2.0))
                            ))
                        ))
                    ))
                ),
                "exp" => Ok( // (e^f(x))' = e^f(x) * f'(x)
                    Box::new(Expr::Mul(
                        Box::new(Expr::Call("exp".to_string(), vec![args[0].clone()])),
                        differentiate_expr(&args[0])?,
                    ))
                ),
                "exp_m1" => Ok( // (e^f(x) - 1)' = e^f(x) * f'(x)
                    Box::new(Expr::Mul(
                        Box::new(Expr::Call("exp".to_string(), vec![args[0].clone()])),
                        differentiate_expr(&args[0])?,
                    ))
                ),
                _ => Err(format!("Cannot differentiate function {}", function_name))
            }
        },
        Expr::Id(_) => Ok(Box::new(Expr::Literal(1.0))),
        Expr::Literal(_) => Ok(Box::new(Expr::Literal(0.0))),
    }
}

// fn composite_x_expr(f_x: &Expr, g_x: &Expr) -> Box<Expr> {
//     match f_x {
//         Expr::Eq(lhs, rhs) => Box::new(Expr::Eq(
//             composite_x_expr(lhs, g_x),
//             composite_x_expr(rhs, g_x),
//         )),
//         Expr::Lt(lhs, rhs) => Box::new(Expr::Lt(
//             composite_x_expr(lhs, g_x),
//             composite_x_expr(rhs, g_x),
//         )),
//         Expr::Gt(lhs, rhs) => Box::new(Expr::Gt(
//             composite_x_expr(lhs, g_x),
//             composite_x_expr(rhs, g_x),
//         )),
//         Expr::Le(lhs, rhs) => Box::new(Expr::Le(
//             composite_x_expr(lhs, g_x),
//             composite_x_expr(rhs, g_x),
//         )),
//         Expr::Ge(lhs, rhs) => Box::new(Expr::Ge(
//             composite_x_expr(lhs, g_x),
//             composite_x_expr(rhs, g_x),
//         )),
//         Expr::Unary(_) => Box::new(Expr::Unary(composite_x_expr(f_x, g_x))),
//         Expr::Add(lhs, rhs) => Box::new(Expr::Add(
//             composite_x_expr(lhs, g_x),
//             composite_x_expr(rhs, g_x),
//         )),
//         Expr::Sub(lhs, rhs) => Box::new(Expr::Sub(
//             composite_x_expr(lhs, g_x),
//             composite_x_expr(rhs, g_x),
//         )),
//         Expr::Mul(lhs, rhs) => Box::new(Expr::Mul(
//             composite_x_expr(lhs, g_x),
//             composite_x_expr(rhs, g_x),
//         )),
//         Expr::Div(lhs, rhs) => Box::new(Expr::Div(
//             composite_x_expr(lhs, g_x),
//             composite_x_expr(rhs, g_x),
//         )),
//         Expr::Mod(lhs, rhs) => Box::new(Expr::Mod(
//             composite_x_expr(lhs, g_x),
//             composite_x_expr(rhs, g_x),
//         )),
//         Expr::Pow(lhs, rhs) => Box::new(Expr::Pow(
//             composite_x_expr(lhs, g_x),
//             composite_x_expr(rhs, g_x),
//         )),
//         Expr::Call(name, rhs) => Box::new(Expr::Call(
//             name.clone(),
//             rhs.iter().map(|x| composite_x_expr(x, g_x)).collect(),
//         )),
//         Expr::Id(id) => {
//             if id == "x" {
//                 Box::new(g_x.clone())
//             } else {
//                 Box::new(f_x.clone())
//             }
//         }
//         Expr::Literal(_) => Box::new(f_x.clone()),
//     }
// }
