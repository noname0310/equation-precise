use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen(getter_with_clone)]
pub struct EmitResult {
    pub code: String,
    pub diagnostics: String,
}
