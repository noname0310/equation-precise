use std::collections::{HashMap, HashSet};

use diagnostic::{Diagnostic, Level};
use ast::Expr;

#[macro_use]
extern crate lazy_static;

lazy_static! {
    static ref FUNCTION_SET: HashSet<&'static str> = {
        let mut set = HashSet::new();
        set.insert("abs");
        set.insert("acos");
        set.insert("acosh");
        set.insert("asin");
        set.insert("asinh");
        set.insert("atan");
        set.insert("atan2");
        set.insert("atanh");
        set.insert("cbrt");
        set.insert("ceil");
        set.insert("cos");
        set.insert("cosh");
        set.insert("exp");
        set.insert("exp_m1");
        set.insert("floor");
        set.insert("hypot");
        set.insert("ln");
        set.insert("ln_1p");
        set.insert("log");
        set.insert("log10");
        set.insert("log2");
        set.insert("max");
        set.insert("min");
        set.insert("pow");
        set.insert("round");
        set.insert("sin");
        set.insert("sinh");
        set.insert("sqrt");
        set.insert("tan");
        set.insert("tanh");
        set
    };
}

pub fn validate_equation(
    ast: &Box<Expr>,
    variables: &HashMap<String, f64>
) -> bool {
    let id_table = make_id_list(ast);
    let expr_count_map = count_expr_count(ast);

    let mut var_set = HashSet::new();
    for (var, _) in variables {
        var_set.insert(var);
    }

    let mut ids = id_table.ids;
    for (name, _) in variables {
        if ids.contains(name) {
            ids.remove(name);
            var_set.remove(name);
        } else {
            Diagnostic::push_new(Diagnostic::new(
                Level::Error,
                format!("Variable {} is not defined", name),
            ));
            return false;
        }
    }

    for var_name in var_set {
        Diagnostic::push_new(Diagnostic::new(
            Level::Warning,
            format!("Variable {} is not used", var_name),
        ));
    }

    let functions = id_table.called_ids;
    for function in functions {
        if !FUNCTION_SET.contains(function.as_str()) {
            Diagnostic::push_new(Diagnostic::new(
                Level::Error,
                format!("Function {} is not defined", function),
            ));
            return false;
        }
    }

    let mut relation_expr_count = 0;

    for (expr, count) in expr_count_map {
        if expr == Expr::eq_str() ||
            expr == Expr::lt_str() ||
            expr == Expr::gt_str() ||
            expr == Expr::le_str() ||
            expr == Expr::ge_str()
        {
            relation_expr_count += count;
        }
    }

    if 1 != relation_expr_count {
        Diagnostic::push_new(Diagnostic::new(
            Level::Error,
            format!("relation expression must be used once"),
        ));
        return false;
    }

    true
}


#[derive(Debug, Clone)]
struct IdTable {
    pub(crate) ids: HashSet<String>,
    pub(crate) called_ids: HashSet<String>,
}

fn make_id_list(ast: &Box<Expr>) -> IdTable {
    let mut result = IdTable { ids: HashSet::new(), called_ids: HashSet::new() };

    traverse_ast(
        &ast, 
        &mut |ast| {
            match &**ast {
                Expr::Id(id) => {
                    result.ids.insert(id.to_owned());
                },
                Expr::Call(id, _) => {
                    result.called_ids.insert(id.to_owned());
                }
                _ => { }
            }
        }
    );

    result
}

fn count_expr_count(ast: &Box<Expr>) -> HashMap<&'static str, i32> {
    let mut result = HashMap::new();

    traverse_ast(
        &ast, 
        &mut |ast| {
            result.entry(ast.to_str()).and_modify(|e| *e += 1).or_insert(1);
        }
    );

    result
}

fn traverse_ast(ast: &Box<Expr>, func: &mut impl FnMut(&Box<Expr>)) {
    match &**ast {
        Expr::Id(_) => {
            func(ast);
        },
        Expr::Call(_, args) => {
            func(ast);
            for arg in args {
                traverse_ast(&arg, func);
            }
        },
        Expr::Eq(lhs, rhs)
        | Expr::Lt(lhs, rhs)
        | Expr::Gt(lhs, rhs)
        | Expr::Le(lhs, rhs)
        | Expr::Ge(lhs, rhs)
        | Expr::Add(lhs, rhs)
        | Expr::Sub(lhs, rhs)
        | Expr::Mul(lhs, rhs)
        | Expr::Div(lhs, rhs)
        | Expr::Mod(lhs, rhs)
        | Expr::Pow(lhs, rhs) => {
            func(ast);
            traverse_ast(&lhs, func);
            traverse_ast(&rhs, func);
        },
        Expr::Unary(expr) => {
            func(ast);
            traverse_ast(&expr, func);
        },
        Expr::Literal(_) => {
            func(ast);
        }
    }
}
