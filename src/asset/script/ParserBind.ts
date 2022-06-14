type GetParametersLengthStringArray<T extends (...args: number[]) => any> =
    T extends (...args: infer U) => any
        ? {[K in keyof U]: string}
        : never;

export class ParserBind {
    private static _epp: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        emit_bool_expr(expr: string, equality_approximate_threshold: number): string;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        emit_number_expr(expr: string): string;
    }|null = null;

    public static async init(): Promise<void> {
        ParserBind._epp = await import("../../epp");
    }

    public static emitBoolExpr(expr: string): ParseResult<(x: number, y: number) => boolean> {
        if (!this._epp) throw new Error("ParserBind is not initialized");
        return this.parseResult<(x: number, y: number) => boolean>(this._epp.emit_bool_expr(expr, 0.00001), ["x", "y"]);
    }

    public static emitNumberExpr(expr: string): ParseResult<(x: number) => number> {
        if (!this._epp) throw new Error("ParserBind is not initialized");
        return this.parseResult<(x: number) => number>(this._epp.emit_number_expr(expr), ["x"]);
    }

    private static parseResult<T extends (...args: number[]) => number|boolean>(
        json: string,
        params: GetParametersLengthStringArray<T>
    ): ParseResult<T> {
        const obj = JSON.parse(json);

        const func = obj.code === "Invalid equation"
            ? null
            : new Function(...params, "return " + obj.code) as T;

        const error = obj.diagnostics.map((d: any) => {
            return [
                d.level === "error" ? ErrorLevel.Error : ErrorLevel.Warning,
                d.message
            ];
        });
        return new ParseResult<T>(func, error);
    }
}

export class ParseResult<T extends (...args: number[]) => number|boolean> {
    public readonly func: T|null;
    public readonly error: [ErrorLevel, string][];

    public constructor(func: T|null, error: [ErrorLevel, string][]) {
        this.func = func;
        this.error = error;
    }
}

export enum ErrorLevel {
    Warning,
    Error
}
