import { 
    Camera,
    Component,
    CssHtmlElementRenderer,
    GameObject,
    PrefabRef
} from "the-world-engine";
import { Vector3 } from "three/src/Three";
import { CameraController } from "./CameraController";

/**
 * editor grid renderer for debug
 * 
 * just add this component to your camera it will render grid
 * 
 * 
 * disallow multiple component
 * 
 * require components: `Camera`
 */
export class GridRenderer extends Component {
    public override readonly disallowMultipleComponent: boolean = true;
    public override readonly requiredComponents = [Camera, CameraController];

    private _camera: Camera|null = null;
    private _cameraController: CameraController|null = null;

    private _htmlRenderer: CssHtmlElementRenderer|null = null;
    private _htmlRendererObject: GameObject|null = null;

    private readonly onScreenResize = (width: number, height: number): void => {
        if (this._htmlRenderer) {
            const viewSize = this._camera!.viewSize;
            const aspect = width / height;
            this._htmlRenderer!.elementWidth = viewSize * 2 * aspect;
            this._htmlRenderer!.elementHeight = viewSize * 2;
            this._gridCellScalar = Math.max(
                10 ** Math.floor(Math.log10(viewSize)),
                0.5 * 10 ** Math.floor(Math.log10(viewSize / 0.5)),
                0.2 * 10 ** Math.floor(Math.log10(viewSize / 0.2))
            );

            this._htmlRenderer.element!.style.backgroundSize =
                this._gridCellScalar / this._viewScale + "px " +
                this._gridCellScalar / this._viewScale + "px";
        }
    };

    private readonly onZoom = (): void => {
        if (this._htmlRenderer) {
            const screen = this.engine.screen;
            this.onScreenResize(screen.width, screen.height);
        }
    };

    public awake(): void {
        this.engine.screen.onResize.addListener(this.onScreenResize);

        this._camera = this.gameObject.getComponent(Camera)!;
        this._cameraController = this.gameObject.getComponent(CameraController)!;

        this._cameraController.onZoom.addListener(this.onZoom);

        this.createRenderer();
        const screen = this.engine.screen;
        this.onScreenResize(screen.width, screen.height);
    }

    private _gridCellScalar = 2;

    private _viewScale = 0.01;

    public get viewScale(): number {
        return this._viewScale;
    }

    public set viewScale(value: number) {
        this._viewScale = value;

        if (this._htmlRenderer) {
            this._htmlRenderer.element!.style.backgroundSize =
                this._gridCellScalar / this._viewScale + "px " +
                this._gridCellScalar / this._viewScale + "px";
            
            this._htmlRenderer.viewScale = this._viewScale;
        }
    }
    
    private createRenderer(): void {
        if (this._htmlRenderer) return;

        const cssHtmlRendererRef = new PrefabRef<CssHtmlElementRenderer>();

        this._htmlRendererObject = this.gameObject.addChildFromBuilder(
            this.engine.instantiater.buildGameObject("grid-renderer", new Vector3(0, 0, -1))
                .active(false)
                .withComponent(CssHtmlElementRenderer, c => {
                    const element = document.createElement("div");
                    element.style.backgroundImage = "\
                        repeating-linear-gradient(#555 0 1px, transparent 1px 100%),\
                        repeating-linear-gradient(#999 0 1px, transparent 1px 50%),\
                        repeating-linear-gradient(90deg, #555 0 1px, transparent 1px 100%), \
                        repeating-linear-gradient(90deg, #999 0 1px, transparent 1px 50%)";
                    element.style.backgroundSize =
                        this._gridCellScalar / this._viewScale + "px " +
                        this._gridCellScalar / this._viewScale + "px";
                    c.pointerEvents = false;
                    c.element = element;
                    c.viewScale = this._viewScale;
                })
                .getComponent(CssHtmlElementRenderer, cssHtmlRendererRef))
        ;
        
        this._htmlRenderer = cssHtmlRendererRef.ref!;
        this._htmlRenderer.enabled = this.enabled;
    }

    public onEnable(): void {
        if (this._htmlRendererObject!.exists) this._htmlRendererObject!.activeSelf = true;
    }

    public onDisable(): void {
        if (this._htmlRendererObject!.exists) this._htmlRendererObject!.activeSelf = false;
    }

    private readonly _lastPosition: Vector3 = new Vector3(NaN, NaN, NaN);

    public update(): void {
        const position = this.transform.position;

        const renderer = this._htmlRenderer!;
        const elementWidth = renderer.elementWidth;
        const elementHeight = renderer.elementHeight;
        const centerX = elementWidth / this._viewScale * 0.5;
        const centerY = elementHeight / this._viewScale * 0.5;

        if (!position.equals(this._lastPosition)) {
            this._htmlRenderer!.element!.style.backgroundPosition = 
                (-position.x / this._viewScale + centerX) + "px " +
                (position.y / this._viewScale + centerY) + "px";
        }
    }

    public onDestroy(): void {
        this.engine.screen.onResize.removeListener(this.onScreenResize);
        this._cameraController!.onZoom.removeListener(this.onZoom);

        this._camera = null;
        this._cameraController = null;
        this._htmlRenderer = null;

        this._htmlRendererObject?.destroy();
        this._htmlRendererObject = null;
    }
}
