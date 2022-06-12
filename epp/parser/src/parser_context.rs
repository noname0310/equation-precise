use std::collections::HashMap;

use lexer::Token;

pub struct ParserContext<'a> {
    current_token: Option<Token>,
    token_iter: Box<dyn Iterator<Item = Token> + 'a>,
    binary_op_precedence: HashMap<String, i32>,
}

impl <'a>ParserContext<'_> {
    pub fn new(token_iter: Box<dyn Iterator<Item = Token> + 'a>, binary_op_precedence: HashMap<String, i32>) -> ParserContext<'a> {
        ParserContext {
            current_token: None,
            token_iter,
            binary_op_precedence,
        }
    }

    pub fn next_token(&mut self) -> Option<&Token> {
        self.current_token = self.token_iter.next();
        self.current_token.as_ref()
    }

    pub fn current_token(&self) -> Option<&Token> {
        self.current_token.as_ref()
    }

    pub fn get_token_precedence(&self, token: &Token) -> i32 {
        self.binary_op_precedence.get(token.to_str()).unwrap_or(&-1).to_owned()
    }
}

pub fn create_binary_op_precedence() -> HashMap<String, i32> {
    let mut map = HashMap::new();
    map.insert("<".to_owned(), 10);
    map.insert("+".to_owned(), 20);
    map.insert("-".to_owned(), 20);
    map.insert("*".to_owned(), 40);// highest.

    map
}
