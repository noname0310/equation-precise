#[derive(Debug, Clone, Copy, Eq, PartialEq, PartialOrd, Ord, Hash)]
pub struct TokenNumberLiteral {
    suffix_start: usize,
}

impl TokenNumberLiteral {
    pub fn new(suffix_start: usize) -> Self {
        Self { suffix_start }
    }

    pub fn suffix_start(&self) -> usize {
        self.suffix_start
    }
}
