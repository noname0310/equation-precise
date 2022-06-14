use crate::Diagnostic;
use lazy_static::lazy_static;
use std::sync::Mutex;

lazy_static! {
    pub static ref DIAGNOSTICS: Mutex<Vec<Diagnostic>> = Vec::default().into();
}
