import { Camera, Component, CssTextRenderer, PrefabRef } from "the-world-engine";
import { CameraController } from "./CameraController";

export class GridUnitRenderer extends Component {
    public override readonly disallowMultipleComponent = true;
    public override readonly requiredComponents = [Camera, CameraController];

    private readonly _textObjectPool: CssTextRenderer[] = [];

    private getTextObject(): CssTextRenderer {
        let textObject = this._textObjectPool.pop();

        if (!textObject) {
            const newTextObject = new PrefabRef<CssTextRenderer>();

            this.gameObject.addChildFromBuilder(
                this.engine.instantiater.buildGameObject("grid-unit-text")
                    .active(false)
                    .withComponent(CssTextRenderer)
                    .getComponent(CssTextRenderer, newTextObject)
            );

            textObject = newTextObject.ref!;
        }

        textObject.gameObject.activeSelf = true;
        return textObject;
    }

    private releaseTextObject(textObject: CssTextRenderer) {
        textObject.gameObject.activeSelf = false;
        this._textObjectPool.push(textObject);
    }
    
    private readonly _activeTextX: Map<number, CssTextRenderer> = new Map();
    private readonly _activeTextY: Map<number, CssTextRenderer> = new Map();

    private renderGridUnit(): void {

    }

    public update(): void {
        
    }
}
