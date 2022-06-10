mod cursor;
mod token;

pub use token::*;

use cursor::*;
use std::iter::from_fn as iter_from_fn;
use unicode_xid::UnicodeXID;

pub fn token_iter(mut input: &str) -> impl Iterator<Item = Token> + '_ {
    iter_from_fn(move || {
        if input.is_empty() {
            return None;
        }

        let token = next(input);
        input = &input[token.len()..];
        Some(token)
    })
}

fn next(input: &str) -> Token {
    let mut cursor = Cursor::new(input);
    let kind = match cursor.consume().unwrap() {
        char if char.is_whitespace() => {
            consume_while(&mut cursor, |char| char.is_whitespace());
            TokenKind::Whitespace
        }
        char if is_id_start(char) => {
            consume_while(&mut cursor, |char| is_id_continue(char));
            TokenKind::Id
        }
        char @ '0'..='9' => {
            consume_number(&mut cursor, char);
            let suffix_start = cursor.len_consumed();

            if is_id_start(cursor.first()) {
                cursor.consume();
                consume_while(&mut cursor, |char| is_id_continue(char));
            }

            TokenKind::Literal(TokenNumberLiteral::new(suffix_start))
        }
        '(' => TokenKind::OpenParen,
        ')' => TokenKind::CloseParen,
        '.' => TokenKind::Dot,
        ',' => TokenKind::Comma,
        '=' => TokenKind::Eq,
        '<' => TokenKind::Lt,
        '>' => TokenKind::Gt,
        '+' => TokenKind::Plus,
        '-' => TokenKind::Minus,
        '*' => TokenKind::Star,
        '/' => TokenKind::Slash,
        '%' => TokenKind::Percent,
        '|' => TokenKind::Or,
        '&' => TokenKind::And,
        '^' => TokenKind::Caret,
        _ => TokenKind::Unknown,
    };

    Token::new(kind, cursor.len_consumed())
}

fn consume_while(cursor: &mut Cursor, mut pred: impl FnMut(char) -> bool) {
    while pred(cursor.first()) {
        cursor.consume();
    }
}

fn is_id_start(char: char) -> bool {
    ('a'..='z').contains(&char)
        || ('A'..='Z').contains(&char)
        || (char == '_')
        || (char > '\x7f' && UnicodeXID::is_xid_start(char))
}

fn is_id_continue(char: char) -> bool {
    ('a'..='z').contains(&char)
        || ('A'..='Z').contains(&char)
        || ('0'..='9').contains(&char)
        || (char == '_')
        || (char > '\x7f' && UnicodeXID::is_xid_continue(char))
}

fn consume_number(cursor: &mut Cursor, first_char: char) {
    if first_char == '0' {
        match cursor.first() {
            '0'..='9' => {
                cursor.consume();
                consume_while(cursor, |char| char.is_digit(10));
            }
            '.' => {},
            _ => return,
        }
    }

    match cursor.first() {
        '.' if cursor.second().is_digit(10) => {
            cursor.consume();
            consume_while(cursor, |char| char.is_digit(10));
        }
        _ => {
            consume_while(cursor, |char| char.is_digit(10));
            return;
        }
    }
}
