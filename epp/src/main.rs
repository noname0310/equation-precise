use lexer;

fn main() {
    let mut input = String::new();
    std::io::stdin().read_line(&mut input).unwrap();
    let tokens = lexer::token_iter(&input);
    for token in tokens {
        println!("{:?}", token);
    }
}
