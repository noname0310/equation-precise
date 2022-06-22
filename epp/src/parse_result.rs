use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(getter_with_clone)]
pub struct ParseResult {
    pub ast_id: i32,
    pub diagnostics: String,
}
