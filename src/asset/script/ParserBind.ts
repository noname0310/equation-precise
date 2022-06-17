import { EmitResult } from "../../epp";

type GetParametersLengthStringArray<T extends (...args: number[]) => any> =
    T extends (...args: infer U) => any
        ? {[K in keyof U]: string}
        : never;

export class ParserBind {
    private static _epp: typeof import("../../epp")|null = null;

    public static async init(): Promise<void> {
        ParserBind._epp = await import("../../epp");
    }

    public static emitBoolExpr(expr: string): TranspileResult<(x: number, y: number) => boolean> {
        if (!this._epp) throw new Error("ParserBind is not initialized");
        return this.parseResult<(x: number, y: number) => boolean>(this._epp.emit_bool_expr(expr, 0.00001), ["x", "y"]);
    }

    public static emitNumberExpr(expr: string): TranspileResult<(x: number) => number> {
        if (!this._epp) throw new Error("ParserBind is not initialized");
        return this.parseResult<(x: number) => number>(this._epp.emit_number_expr(expr), ["x"]);
    }

    private static parseResult<T extends (...args: number[]) => number|boolean>(
        emitResult: EmitResult,
        params: GetParametersLengthStringArray<T>
    ): TranspileResult<T> {
        const func = emitResult.code === "Invalid equation"
            ? null
            : new Function(...params, "return " + emitResult.code) as T;

        const error = JSON.parse(emitResult.diagnostics).map((d: any) => {
            return [
                d.level === "Error" ? ErrorLevel.Error : ErrorLevel.Warning,
                d.message
            ];
        });
        return new TranspileResult<T>(func, error);
    }
}

export class TranspileResult<T extends (...args: number[]) => number|boolean> {
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
