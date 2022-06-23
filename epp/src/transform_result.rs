use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(getter_with_clone)]
pub struct TransformResult {
    pub ast_id: i32,
    pub error: String,
}
