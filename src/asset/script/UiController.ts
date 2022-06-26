import { Component, EventContainer, IEventContainer } from "the-world-engine";
import { GraphRenderer } from "./GraphRenderer";
import { ErrorLevel, ParserBind } from "./ParserBind";

export class UiController extends Component {
    private _equationInputField: HTMLInputElement|null = null;
    private _errorMessageDiv: HTMLDivElement|null = null;
    private _debounceTimeout: number|null = null;
    private _graphRenderer: GraphRenderer|null = null;
    private readonly _onEquationEmited = new EventContainer<(equation: (x: number) => number, derivatedFunction: (x: number) => number) => void>();
    private _equation: ((x: number) => number)|null = null;
    private _derivatedFunction: ((x: number) => number)|null = null;

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
                errorMessageDiv.style.color = "red";

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

        const transformed = ast.differentiate();
        const folded = transformed.ast?.fold();

        const errorMessageDiv = this.errorMessageDiv;
        if (errorMessageDiv) {
            errorMessageDiv.innerHTML = "";

            if (transformed.ast) {
                errorMessageDiv.style.color = "black";

                errorMessageDiv.appendChild(
                    new Text(`transformed: ${transformed.ast.toString()}`)
                );
                errorMessageDiv.appendChild(document.createElement("br"));

                errorMessageDiv.appendChild(
                    new Text(`folded: ${folded!.toString()}`)
                );

                const equation = this._equation = ast.emit();
                const derivated = this._derivatedFunction = folded!.emit();
                this._onEquationEmited.invoke(equation, derivated);
            } else {
                errorMessageDiv.style.color = "red";
                
                errorMessageDiv.appendChild(
                    new Text(`Transform Error: ${transformed.error}`)
                );
            }
        }

        if (this._graphRenderer) {
            this._graphRenderer.equation = ast.emit();
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

    public get onEquationEmited(): IEventContainer<(equation: (x: number) => number, derivatedFunction: (x: number) => number) => void> {
        return this._onEquationEmited;
    }

    public get equation(): ((x: number) => number)|null {
        return this._equation;
    }

    public get derivatedFunction(): ((x: number) => number)|null {
        return this._derivatedFunction;
    }

    public onDestroy(): void {
        if (this._equationInputField) {
            this._equationInputField.removeEventListener("input", this.onEquationInputFieldChange);
        }
    }
}
