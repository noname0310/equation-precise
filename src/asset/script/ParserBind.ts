import { ParseResult as LowParseResult } from "../../epp";

type GetParametersLengthStringArray<T extends (...args: number[]) => any> =
    T extends (...args: infer U) => any
        ? {[K in keyof U]: string}
        : never;

export class ParserBind {
    private static _epp: typeof import("../../epp")|null = null;

    public static async init(): Promise<void> {
        ParserBind._epp = await import("../../epp");
    }

    public static disposeAst(astId: number): void {
        if (!this._epp) throw new Error("ParserBind is not initialized");
        this._epp.dispose_ast(astId);
    }

    public static parseBoolExpr(expr: string): ParseResult<(x: number, y: number) => boolean> {
        if (!this._epp) throw new Error("ParserBind is not initialized");
        const lowParseResult = this._epp.parse_bool_expr(expr);
        const parseResult = this.parseResult<(x: number, y: number) => boolean>(lowParseResult, ["x", "y"]);
        lowParseResult.free();
        return parseResult;
    }

    public static emitBoolExpr(astId: number): string {
        if (!this._epp) throw new Error("ParserBind is not initialized");
        return this._epp.emit_bool_expr(astId, 0.00001);
    }

    public static parseNumberExpr(expr: string): ParseResult<(x: number) => number> {
        if (!this._epp) throw new Error("ParserBind is not initialized");
        const lowParseResult = this._epp.parse_number_expr(expr);
        const parseResult = this.parseResult<(x: number) => number>(lowParseResult, ["x"]);
        lowParseResult.free();
        return parseResult;
    }

    public static emitNumberExpr(astId: number): string {
        if (!this._epp) throw new Error("ParserBind is not initialized");
        return this._epp.emit_number_expr(astId);
    }

    private static parseResult<T extends (...args: number[]) => number|boolean>(
        parseResult: LowParseResult,
        params: GetParametersLengthStringArray<T>
    ): ParseResult<T> {
        const ast = parseResult.ast_id === -1 ? null : new Ast(parseResult.ast_id, params);

        const error = JSON.parse(parseResult.diagnostics).map((d: any) => {
            return [
                d.level === "Error" ? ErrorLevel.Error : ErrorLevel.Warning,
                d.message
            ];
        });

        return new ParseResult<T>(ast, error);
    }
}

export class Ast<T extends (...args: number[]) => number|boolean> {
    private _astId: number;
    private readonly _params: GetParametersLengthStringArray<T>;

    public constructor(astId: number, params: GetParametersLengthStringArray<T>) {
        this._astId = astId;
        this._params = params;
    }

    public get params(): GetParametersLengthStringArray<T> {
        return this._params;
    }

    public dispose(): void {
        if (this._astId !== 0) {
            ParserBind.disposeAst(this._astId);
            this._astId = 0;
        }
    }

    public emit(): T {
        if (this._astId === 0) throw new Error("Ast is disposed");

        if (this._params.length === 0) throw new Error("Ast has no parameters");
        else if (this._params.length === 1) {
            return new Function(...this.params, "return " + ParserBind.emitBoolExpr(this._astId)) as T;
        } else if (this._params.length === 2) {
            return new Function(...this.params, "return " + ParserBind.emitNumberExpr(this._astId)) as T;
        } else {
            throw new Error("Ast has too many parameters");
        }
    }
}

export class ParseResult<T extends (...args: number[]) => number|boolean> {
    public readonly ast: Ast<T>|null;
    public readonly error: [ErrorLevel, string][];

    public constructor(ast: Ast<T>|null, error: [ErrorLevel, string][]) {
        this.ast = ast;
        this.error = error;
    }

    public dispose(): void {
        if (this.ast) this.ast.dispose();
    }
}

export enum ErrorLevel {
    Warning,
    Error
}
