import { Color, Component, Coroutine, CoroutineIterator, Css2DLineRenderer, PrefabRef, WaitForSeconds } from "the-world-engine";
import { PointerEvent, PointerInputListener } from "./PointerInputListener";
import { Vector3, Vector2 } from "three/src/Three";
import { UiController } from "./UiController";

export class RootSolver extends Component {
    private _iteration = 100;
    private _lastCursorPositionX = NaN;
    private _viewScale = 0.1;

    private _uiController: UiController|null = null;
    private _pointerInputListener: PointerInputListener|null = null;
    private _resultDiv: HTMLDivElement|null = null;

    private equation = (_x: number): number => NaN;
    private derivatedFunction = (_x: number): number => NaN;

    private readonly _tempVector = new Vector3();
    private _animation: Coroutine|null = null;

    private readonly onEquationEmited = (equation: (x: number) => number, derivatedFunction: (x: number) => number): void => {
        this.equation = equation;
        this.derivatedFunction = derivatedFunction;
    };

    private _lastCursorDownTime = 0;
    
    private readonly onCursorDown = (event: PointerEvent): void => {
        if (event.button !== 0) return;
        
        const now = Date.now();

        if (now - this._lastCursorDownTime < 200) {
            this.onDoubleClick(event);
            this._lastCursorDownTime = 0;
        }

        this._lastCursorDownTime = now;
    };

    private onDoubleClick(event: PointerEvent): void {
        const position = this.engine.cameraContainer.camera!.transform.transformPoint(
            this._tempVector.set(event.position.x, event.position.y, 0)
        );

        if (this._animation) {
            this.stopCoroutine(this._animation);
        }

        this._lastCursorPositionX = position.x;
        this._animation = this.startCoroutine(this.solve(position.x));
    }

    private readonly _spawnedObjects: Css2DLineRenderer[] = [];
    private readonly _tempVector2 = new Vector2();
    private readonly _tempColor = new Color();
    private readonly _waitForSeconds = new WaitForSeconds(0.1);

    private *solve(x: number): CoroutineIterator {
        const spawnedObjects = this._spawnedObjects;
        for (let i = 0; i < spawnedObjects.length; i++) {
            spawnedObjects[i].destroy();
        }
        spawnedObjects.length = 0;

        yield this._waitForSeconds;

        for (let i = 0; i < this._iteration; i++) {
            const y = this.equation(x);
            const gradient = this.derivatedFunction(x);

            if (isNaN(gradient)) break;

            // y = gradient * (x - x0) + y0

            // 0 = gradient * (x - x0) + y0
            // 0 = gradient * x - gradient * x0 + y0
            // - gradient * x = y0 - gradient * x0
            // gradient * x = gradient * x0 - y0
            // x = (gradient * x0 - y0) / gradient
            const xWhenYIsZero = (gradient * x - y) / gradient;

            const gradientLine = new PrefabRef<Css2DLineRenderer>();

            this.engine.scene.addChildFromBuilder(
                this.engine.instantiater.buildGameObject(`gradient-line-${i}`)
                    .withComponent(Css2DLineRenderer, c => {
                        c.point1 = this._tempVector2.set(x, y);
                        c.point2 = this._tempVector2.set(xWhenYIsZero, 0);
                        c.lineColor = this._tempColor.set(1, 0.5, 0.5);
                        c.lineWidth = this._viewScale;
                    })
                    .getComponent(Css2DLineRenderer, gradientLine)
            );

            spawnedObjects.push(gradientLine.ref!);

            yield this._waitForSeconds;

            const nextY = this.equation(xWhenYIsZero);
            if (!isNaN(nextY)) {
                const verticalLine = new PrefabRef<Css2DLineRenderer>();

                this.engine.scene.addChildFromBuilder(
                    this.engine.instantiater.buildGameObject(`vertical-line-${i}`)
                        .withComponent(Css2DLineRenderer, c => {
                            c.point1 = this._tempVector2.set(xWhenYIsZero, 0);
                            c.point2 = this._tempVector2.set(xWhenYIsZero, nextY);
                            c.lineColor = this._tempColor.set(0.5, 1, 0.5);
                            c.lineWidth = this._viewScale;
                        })
                        .getComponent(Css2DLineRenderer, verticalLine)
                );

                spawnedObjects.push(verticalLine.ref!);

                const resultDiv = this._resultDiv;
                if (resultDiv) {
                    resultDiv.innerText = `root: ${Number(xWhenYIsZero.toFixed(6))}`;
                }

                yield this._waitForSeconds;
            }

            x = xWhenYIsZero;
        }

        yield null;
    }

    public get uiController(): UiController|null {
        return this._uiController;
    }

    public set uiController(value: UiController|null) {
        if (this._uiController) {
            this._uiController.onEquationEmited.removeListener(this.onEquationEmited);
            this.equation = (_x: number): number => NaN;
            this.derivatedFunction = (_x: number): number => NaN;
        }

        this._uiController = value;

        if (this._uiController) {
            this._uiController.onEquationEmited.addListener(this.onEquationEmited);
            if (this._uiController.equation && this._uiController.derivatedFunction) {
                this.onEquationEmited(this._uiController.equation, this._uiController.derivatedFunction);
            }
        }
    }

    public get pointerInputListener(): PointerInputListener|null {
        return this._pointerInputListener;
    }

    public set pointerInputListener(value: PointerInputListener|null) {
        if (this._pointerInputListener) {
            this._pointerInputListener.onPointerDown.removeListener(this.onCursorDown);
        }

        this._pointerInputListener = value;

        if (this._pointerInputListener) {
            this._pointerInputListener.onPointerDown.addListener(this.onCursorDown);
        }
    }

    public get iteration(): number {
        return this._iteration;
    }

    public set iteration(value: number) {
        this._iteration = value;

        if (this._animation) {
            this.stopCoroutine(this._animation);
        }

        this._animation = this.startCoroutine(this.solve(this._lastCursorPositionX));
    }

    public get resultDiv(): HTMLDivElement|null {
        return this._resultDiv;
    }

    public set resultDiv(value: HTMLDivElement|null) {
        this._resultDiv = value;
    }

    public get lineWidth(): number {
        return this._viewScale;
    }

    public set lineWidth(value: number) {
        this._viewScale = value;
        const spawnedObjects = this._spawnedObjects;
        for (let i = 0; i < spawnedObjects.length; i++) {
            spawnedObjects[i].lineWidth = value;
        }
    }

    public onDestroy(): void {
        if (this._uiController) {
            this._uiController.onEquationEmited.removeListener(this.onEquationEmited);
        }

        if (this._pointerInputListener) {
            this._pointerInputListener.onPointerDown.removeListener(this.onCursorDown);
        }
        
        this._uiController = null;
        this._pointerInputListener = null;
    }
}
