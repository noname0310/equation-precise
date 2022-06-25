import { Component } from "the-world-engine";
import { GraphRenderer } from "./GraphRenderer";
import { ErrorLevel, ParserBind } from "./ParserBind";

export class UiController extends Component {
    private _equationInputField: HTMLInputElement|null = null;
    private _errorMessageDiv: HTMLDivElement|null = null;
    private _debounceTimeout: number|null = null;
    private _graphRenderer: GraphRenderer|null = null;

    private readonly onEquationInputFieldChange = (ev: Event): void => {
        const inputField = ev.target as HTMLInputElement;
        
        if (this._debounceTimeout) {
            clearTimeout(this._debounceTimeout);
        }

        this._debounceTimeout = window.setTimeout(() => {
            this._debounceTimeout = null;
            this.onEquationInputFieldChangeDebounced(inputField.value);
        }, 500);
    };

    private onEquationInputFieldChangeDebounced(value: string): void {
        const whiteSpaceFilteredValue = value.replace(/\s/g, "");
        if (!whiteSpaceFilteredValue.startsWith("y=")) {
            const errorMessageDiv = this.errorMessageDiv;
            if (errorMessageDiv) {
                errorMessageDiv.innerHTML = "";
                errorMessageDiv.appendChild(
                    new Text("Error: The equation must start with 'y='")
                );
                errorMessageDiv.appendChild(document.createElement("br"));
            }
            return;
        }

        const parseResult = ParserBind.parseNumberExpr(value.split("=")[1]);
        const ast = parseResult.ast;
        if (!ast) {
            const errorMessageDiv = this.errorMessageDiv;
            if (errorMessageDiv) {
                errorMessageDiv.innerHTML = "";
                const transpileError = parseResult.error;
                for (let i = 0; i < transpileError.length; ++i) {
                    const [level, message] = transpileError[i];
                    errorMessageDiv.appendChild(
                        new Text(`${level === ErrorLevel.Error ? "Error" : "Warning"}: ${message}`)
                    );
                    errorMessageDiv.appendChild(document.createElement("br"));
                }
            }
            return;
        }

        const errorMessageDiv = this.errorMessageDiv;
        if (errorMessageDiv) {
            errorMessageDiv.innerHTML = "";
        }

        const transformed = ast.differentiate();
        const folded = transformed.ast?.fold();
        console.log(transformed.ast ? `transformed: ${transformed.ast.toString()}\ntransfolded: ${folded?.toString()}` : transformed.error);

        if (this._graphRenderer) {
            this._graphRenderer.equation = folded?.emit() ?? ((): number => 0);
        }

        folded?.dispose();
        transformed?.dispose();

        parseResult.dispose();
    }

    public get equationInputField(): HTMLInputElement|null {
        return this._equationInputField;
    }

    public set equationInputField(value: HTMLInputElement|null) {
        if (this._equationInputField) {
            this._equationInputField.removeEventListener("input", this.onEquationInputFieldChange);
        }

        this._equationInputField = value;

        if (value) {
            value.addEventListener("input", this.onEquationInputFieldChange);
            this.onEquationInputFieldChangeDebounced(value.value);
        }
    }

    public get errorMessageDiv(): HTMLDivElement|null {
        return this._errorMessageDiv;
    }

    public set errorMessageDiv(value: HTMLDivElement|null) {
        this._errorMessageDiv = value;
    }

    public get graphRenderer(): GraphRenderer|null {
        return this._graphRenderer;
    }

    public set graphRenderer(value: GraphRenderer|null) {
        this._graphRenderer = value;
        this.onEquationInputFieldChangeDebounced(this._equationInputField?.value ?? "");
    }

    public onDestroy(): void {
        if (this._equationInputField) {
            this._equationInputField.removeEventListener("input", this.onEquationInputFieldChange);
        }
    }
}
