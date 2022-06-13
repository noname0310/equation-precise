mod validate;

use std::collections::{HashSet, HashMap};

use ast::Expr;

use validate::validate_equation;

pub fn eval(ast: Box<Expr>, variables: &HashMap<String, f64>) -> Result<f64, ()> {
    let id_table = make_id_list(&ast);
    let expr_count = count_expr_count(&ast);

    if !validate_equation(variables, expr_count, id_table) {
        return Err(());
    }
    
    println!("{:?}", ast);
    Err(())
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

fn trasnsform_ast(ast: &Box<Expr>, transformer: &mut impl FnMut(Box<Expr>) -> Box<Expr>) -> Box<Expr> {
    let transformed_expr = match ast.as_ref() {
        Expr::Id(id) => Box::new(Expr::Id(id.clone())),
        Expr::Call(name, args) => {
            Box::new(Expr::Call(
                name.to_owned(),
                args.iter().map(|arg| trasnsform_ast(arg, transformer)).collect()
            ))
        },
        Expr::Eq(lhs, rhs) => {
            Box::new(Expr::Eq(
                trasnsform_ast(lhs, transformer),
                trasnsform_ast(rhs, transformer)
            ))
        },
        Expr::Lt(lhs, rhs) => {
            Box::new(Expr::Lt(
                trasnsform_ast(lhs, transformer),
                trasnsform_ast(rhs, transformer)
            ))
        },
        Expr::Gt(lhs, rhs) => {
            Box::new(Expr::Gt(
                trasnsform_ast(lhs, transformer),
                trasnsform_ast(rhs, transformer)
            ))
        },
        Expr::Le(lhs, rhs) => {
            Box::new(Expr::Le(
                trasnsform_ast(lhs, transformer),
                trasnsform_ast(rhs, transformer)
            ))
        },
        Expr::Ge(lhs, rhs) => {
            Box::new(Expr::Ge(
                trasnsform_ast(lhs, transformer),
                trasnsform_ast(rhs, transformer)
            ))
        },
        Expr::Add(lhs, rhs) => {
            Box::new(Expr::Add(
                trasnsform_ast(lhs, transformer),
                trasnsform_ast(rhs, transformer)
            ))
        },
        Expr::Sub(lhs, rhs) => {
            Box::new(Expr::Sub(
                trasnsform_ast(lhs, transformer),
                trasnsform_ast(rhs, transformer)
            ))
        },
        Expr::Mul(lhs, rhs) => {
            Box::new(Expr::Mul(
                trasnsform_ast(lhs, transformer),
                trasnsform_ast(rhs, transformer)
            ))
        },
        Expr::Div(lhs, rhs) => {
            Box::new(Expr::Div(
                trasnsform_ast(lhs, transformer),
                trasnsform_ast(rhs, transformer)
            ))
        },
        Expr::Mod(lhs, rhs) => {
            Box::new(Expr::Mod(
                trasnsform_ast(lhs, transformer),
                trasnsform_ast(rhs, transformer)
            ))
        },
        Expr::Pow(lhs, rhs) => {
            Box::new(Expr::Pow(
                trasnsform_ast(lhs, transformer),
                trasnsform_ast(rhs, transformer)
            ))
        },
        Expr::Unary(expr) => {
            Box::new(Expr::Unary(
                trasnsform_ast(expr, transformer)
            ))
        },
        Expr::Literal(value) => Box::new(Expr::Literal(value.clone()))
    };
    transformer(transformed_expr)
}

#[derive(Debug, Clone)]
pub(crate) struct IdTable {
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
