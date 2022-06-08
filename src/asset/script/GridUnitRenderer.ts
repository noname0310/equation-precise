import { Vector2 } from "three/src/Three";
import { Camera, Color, Component, CssTextRenderer, PrefabRef } from "the-world-engine";
import { CameraController } from "./CameraController";
import { GraphMath } from "./GraphMath";

export class GridUnitRenderer extends Component {
    public override readonly disallowMultipleComponent = true;
    public override readonly requiredComponents = [Camera, CameraController];

    private _camera: Camera|null = null;
    private _cameraController: CameraController|null = null;

    private readonly onScreenResize = (): void => {
        this.renderGridUnit(this._camera!);
    };
    
    private readonly onZoom = (): void => {
        this.renderGridUnit(this._camera!);
    };

    public awake(): void {
        this._camera = this.gameObject.getComponent(Camera)!;
        this._cameraController = this.gameObject.getComponent(CameraController)!;

        const screen = this.engine.screen;
        screen.onResize.addListener(this.onScreenResize);
        this._cameraController.onZoom.addListener(this.onZoom);
    }

    public onDestroy(): void {
        this.engine.screen.onResize.removeListener(this.onScreenResize);
        this._cameraController!.onZoom.removeListener(this.onZoom);

        this._camera = null;
        this._cameraController = null;
    }

    private readonly _textObjectPool: CssTextRenderer[] = [];

    private getTextObject(): CssTextRenderer {
        let textObject = this._textObjectPool.pop();

        if (!textObject) {
            const newTextObject = new PrefabRef<CssTextRenderer>();

            this.gameObject.addChildFromBuilder(
                this.engine.instantiater.buildGameObject("grid-unit-text")
                    .active(false)
                    .withComponent(CssTextRenderer, c => {
                        c.textColor = new Color(0, 0, 0);
                        c.autoSize = true;
                        c.centerOffset = new Vector2(0.7, 0.7);
                    })
                    .getComponent(CssTextRenderer, newTextObject)
            );

            textObject = newTextObject.ref!;
        }

        textObject.gameObject.activeSelf = true;
        return textObject;
    }

    private releaseTextObject(textObject: CssTextRenderer): void {
        textObject.gameObject.activeSelf = false;
        this._textObjectPool.push(textObject);
    }
    
    private readonly _activeTextX: Map<number, CssTextRenderer> = new Map();
    private readonly _activeTextY: Map<number, CssTextRenderer> = new Map();

    private renderGridUnit(camera: Camera): void {
        const viewSize = camera.viewSize;
        const screen = this.engine.screen;
        const aspect = screen.width / screen.height;

        const lodScale = GraphMath.computeLod(viewSize);

        let yUnitCount = Math.floor(viewSize / lodScale) * 2 + 1;
        if (yUnitCount % 2 === 0) yUnitCount -= 1;

        let xUnitCount = Math.floor(viewSize * aspect / lodScale) * 2 + 1;
        if (xUnitCount % 2 === 0) xUnitCount -= 1;

        for (const textObject of this._activeTextX.values()) {
            this.releaseTextObject(textObject);
        }
        this._activeTextX.clear();

        for (const textObject of this._activeTextY.values()) {
            this.releaseTextObject(textObject);
        }
        this._activeTextY.clear();

        const cameraPosition = camera.transform.position;
        let xUnitStartPosition = Math.abs((cameraPosition.x - viewSize * aspect) % lodScale);
        if ((cameraPosition.x - viewSize * aspect) > 0) xUnitStartPosition = lodScale - xUnitStartPosition;
        const xUnitStartValue = (viewSize * aspect * -1 + cameraPosition.x) + xUnitStartPosition;

        let yUnitStartPosition = Math.abs((cameraPosition.y - viewSize) % lodScale);
        if ((cameraPosition.y - viewSize) > 0) yUnitStartPosition = lodScale - yUnitStartPosition;
        const yUnitStartValue = viewSize * -1 + cameraPosition.y + yUnitStartPosition;

        //#region xUnitYposition

        let xUnitYposition;
        
        if (viewSize < cameraPosition.y) {
            xUnitYposition = -viewSize;
        } else if (-viewSize + 0.07 * viewSize > cameraPosition.y) {
            xUnitYposition = viewSize - 0.07 * viewSize;
        } else {
            xUnitYposition = -cameraPosition.y;
        }

        //#endregion

        for (let i = 0; i < xUnitCount; ++i) {
            const xPosition = xUnitStartPosition + i * lodScale - viewSize * aspect;

            const textObject = this.getTextObject();
            this._activeTextX.set(xPosition, textObject);
            textObject.text = `${Number((xUnitStartValue + i * lodScale).toFixed(3))}`;

            const localPosition = textObject.transform.localPosition;
            localPosition.x = xPosition;

            localPosition.y = xUnitYposition;
        }

        //#region yUnitXposition

        let yUnitXposition;

        const yViewSize = viewSize * aspect;
        if (yViewSize < cameraPosition.x) {
            yUnitXposition = -yViewSize;
        } else if (-yViewSize + 0.12 * viewSize > cameraPosition.x) {
            yUnitXposition = yViewSize - 0.12 * viewSize;
        } else {
            yUnitXposition = -cameraPosition.x;
        }
        
        //#endregion

        for (let i = 0; i < yUnitCount; ++i) {
            const yPosition = yUnitStartPosition + i * lodScale - viewSize;

            const textObject = this.getTextObject();
            this._activeTextY.set(yPosition, textObject);
            textObject.text = `${Number((yUnitStartValue + i * lodScale).toFixed(3))}`;

            const localPosition = textObject.transform.localPosition;
            localPosition.x = yUnitXposition;
            localPosition.y = yPosition;
        }

        for (const text of this._activeTextX.values()) {
            text.viewScale = viewSize * 0.005;
        }

        for (const text of this._activeTextY.values()) {
            text.viewScale = viewSize * 0.005;
        }
    }

    private readonly _lastPosition = new Vector2(NaN, NaN);

    public update(): void {
        const cameraPosition = this._camera!.transform.position;
        const lastPosition = this._lastPosition;

        if (lastPosition.x === cameraPosition.x && lastPosition.y === cameraPosition.y) return;
        lastPosition.x = cameraPosition.x;
        lastPosition.y = cameraPosition.y;

        this.renderGridUnit(this._camera!);
    }
}
