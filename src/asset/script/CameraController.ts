import { Camera, Component, ComponentConstructor, EventContainer, IEventContainer } from "the-world-engine";
import { Vector2, Vector3 } from "three/src/Three";

/**
 * controller for 2D editor free camera
 * 
 * it requires a camera component to control
 * 
 * camera type is must be set to CameraType.Orthographic
 * 
 * 
 * disallow multiple component
 * 
 * require components: `Camera`
 */
export class CameraController extends Component {
    public override readonly disallowMultipleComponent: boolean = true;
    public override readonly requiredComponents: ComponentConstructor[] = [Camera];

    private _camera: Camera|null = null;
    private _mouseMoveButtonDown = false;
    private _mouseMoveButton = 1;
    private readonly _lastOffset: Vector2 = new Vector2();
    private _minViewSize = 0.1;
    private _maxViewSize = 1000;
    private _defaultViewSize = 3;
    private _currentViewSize = 3;
    private readonly _defaultPosition = new Vector3();

    private readonly _onZoomEvent: EventContainer<(viewSize: number) => void> = new EventContainer();

    public get onZoom(): IEventContainer<(viewSize: number) => void> {
        return this._onZoomEvent;
    }

    public get viewSize(): number {
        return this._currentViewSize;
    }

    public awake(): void {
        this._camera = this.gameObject.getComponent(Camera);
        this._defaultViewSize = this._camera!.viewSize;
        this._defaultPosition.copy(this.transform.localPosition);
        this._currentViewSize = this._defaultViewSize;
        this._camera!.viewSize = this._currentViewSize;
    }

    public onEnable(): void {
        const input = this.engine.input;
        input.onKeyDown.addListener(this.onKeyDown);
        input.onWheel.addListener(this.onWheel);
        input.onPointerDown.addListener(this.onPointerDown);
        input.onPointerUp.addListener(this.onPointerUp);
        input.onPointerMove.addListener(this.onPointerMove);
        input.onPointerLeave.addListener(this.onPointerLeave);
    }

    public onDisable(): void {
        const input = this.engine.input;
        input.onKeyDown.removeListener(this.onKeyDown);
        input.onWheel.removeListener(this.onWheel);
        input.onPointerDown.removeListener(this.onPointerDown);
        input.onPointerUp.removeListener(this.onPointerUp);
        input.onPointerMove.removeListener(this.onPointerMove);
        input.onPointerLeave.removeListener(this.onPointerLeave);
    }

    private readonly onKeyDown = (event: KeyboardEvent): void => {
        if (event.key === " ") {
            this._currentViewSize = this._defaultViewSize;
            this.resize();
            this.transform.localPosition.copy(this._defaultPosition);
        }
    };

    private readonly onWheel = (event: WheelEvent): void => {
        this._currentViewSize *= 1.01 ** (event.deltaY * 0.1);
        if (this._currentViewSize < this._minViewSize) {
            this._currentViewSize = this._minViewSize;
        } else if (this._currentViewSize > this._maxViewSize) {
            this._currentViewSize = this._maxViewSize;
        }
        this.resize();

        this._onZoomEvent.invoke(this._currentViewSize);
    };

    private readonly onPointerDown = (event: MouseEvent): void => {
        this._lastOffset.set(
            event.clientX / this.engine.screen.width,
            event.clientY / this.engine.screen.height
        );
        if (event.button === this._mouseMoveButton) {
            this._mouseMoveButtonDown = true;
        }
    };

    private readonly onPointerUp = (event: MouseEvent): void => {
        if (event.button === this._mouseMoveButton) {
            this._mouseMoveButtonDown = false;
        }
    };

    private readonly onPointerMove = (event: MouseEvent): void => {
        if (!this._mouseMoveButtonDown) return;

        const clientOffsetX = event.clientX / this.engine.screen.width;
        const clientOffsetY = event.clientY / this.engine.screen.height;

        const clientXdiff = clientOffsetX - this._lastOffset.x;
        const clientYdiff = clientOffsetY - this._lastOffset.y;

        const aspect = this.engine.screen.width / this.engine.screen.height;

        this.transform.localPosition.x -= clientXdiff * this._camera!.viewSize * 2 * aspect;
        this.transform.localPosition.y += clientYdiff * this._camera!.viewSize * 2;

        this._lastOffset.set(clientOffsetX, clientOffsetY);
    };

    private readonly onPointerLeave = (_event: MouseEvent): void => {
        this._mouseMoveButtonDown = false;
    };

    private resize(): void {
        if (this._camera) {
            this._camera.viewSize = this._currentViewSize;
        }
    }

    /**
     * min view size (default: 1)
     */
    public get minViewSize(): number {
        return this._minViewSize;
    }

    /**
     * min view size (default: 1)
     */
    public set minViewSize(value: number) {
        this._minViewSize = value;

        if (this._currentViewSize < this._minViewSize) {
            this._currentViewSize = this._minViewSize;
            this.resize();
        }
    }

    /**
     * max view size (default: 10)
     */
    public get maxViewSize(): number {
        return this._maxViewSize;
    }

    /**
     * max view size (default: 10)
     */
    public set maxViewSize(value: number) {
        this._maxViewSize = value;

        if (this._currentViewSize > this._maxViewSize) {
            this._currentViewSize = this._maxViewSize;
            this.resize();
        }
    }

    /**
     * mouse button number to move camera e.g. 1 for left mouse button (default: 1)
     */
    public get mouseMoveButton(): number {
        return this._mouseMoveButton;
    }

    /**
     * mouse button number to move camera e.g. 1 for left mouse button (default: 1)
     */
    public set mouseMoveButton(value: number) {
        this._mouseMoveButton = value;
    }
}
