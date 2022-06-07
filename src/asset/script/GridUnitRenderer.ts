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
    // private readonly _activeTextY: Map<number, CssTextRenderer> = new Map();

    private renderGridUnit(camera: Camera): void {
        const viewSize = camera.viewSize;
        const screen = this.engine.screen;
        const aspect = screen.width / screen.height;

        const lodScale = GraphMath.computeLod(viewSize);

        let yUnitCount = Math.floor(viewSize / lodScale) * 2 + 1;
        if (yUnitCount % 2 === 0) yUnitCount -= 1;

        let xUnitCount = Math.floor(viewSize * aspect / lodScale) * 2 + 1;
        if (xUnitCount % 2 === 0) xUnitCount -= 1;

        for (const text of this._activeTextX.values()) {
            this.releaseTextObject(text);
        }
        this._activeTextX.clear();

        for (let i = 0; i < xUnitCount; ++i) {
            const textObject = this.getTextObject();
            this._activeTextX.set(i * lodScale, textObject);

            const position = textObject.transform.position;
            position.x = i * lodScale;
            position.y = 0;
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
