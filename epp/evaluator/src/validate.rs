use std::collections::{HashMap, HashSet};

use crate::IdTable;
use diagnostic::{Diagnostic, Level};
use ast::Expr;

pub(crate) fn validate_equation(
    variables: &HashMap<String, f64>,
    expr_count_map: HashMap<&'static str, i32>,
    id_table: IdTable,
) -> bool {
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
