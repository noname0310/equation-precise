pub struct ParserContext {
    current_token: Token,
    token_iter: Box<dyn Iterator<Item = Token>>,
    binary_op_precedence: HashMap<String, u32>,
}

impl ParserContext {
    pub fn new(token_iter: impl Iterator<Item = Token>, binary_op_precedence: HashMap<String, u32>) -> ParserContext {
        ParserContext {
            current_token: token_iter.next().unwrap(),
            token_iter,
            binary_op_precedence,
        }
    }

    pub fn next_token(&mut self) -> Token {
        self.current_token = self.token_iter.next().unwrap();
        self.current_token
    }

    pub fn current_token(&self) -> Token {
        self.current_token
    }

    pub fn get_token_precedence(&self, token: &Token) -> u32 {
        self.binary_op_precedence.get(token.to_str()).unwrap_or(-1)
    }
}
