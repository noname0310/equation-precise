import { 
    Camera,
    Component, CssHtmlElementRenderer, EventContainer, IEventContainer
} from "the-world-engine";
import { Vector2 } from "three/src/Three";

/**
 * pointer event object
 */
export class PointerEvent {
    private readonly _position: Vector2;
    private readonly _button: number;

    public constructor(position: Vector2, button: number) {
        this._position = new Vector2(position.x, position.y);
        this._button = button;
    }

    /**
     * world position
     */
    public get position(): Vector2 {
        return this._position;
    }

    /**
     * pressed button number (0: left, 1: middle, 2: right)
     */
    public get button(): number {
        return this._button;
    }
}

export class PointerInputListener extends Component {
    public override readonly requiredComponents = [Camera];
    public override readonly disallowMultipleComponent: boolean = true;
    private readonly _onPointerDownEvent = new EventContainer<(event: PointerEvent) => void>();
    private readonly _onPointerUpEvent = new EventContainer<(event: PointerEvent) => void>();
    private readonly _onPointerEnterEvent = new EventContainer<(event: PointerEvent) => void>();
    private readonly _onPointerLeaveEvent = new EventContainer<(event: PointerEvent) => void>();
    private readonly _onPointerMoveEvent = new EventContainer<(event: PointerEvent) => void>();
    private _onTouchStartFunc: (() => void)|null = null;
    private _touchMoveOccured = false;

    private _camera: Camera|null = null;
    private _htmlRenderer: CssHtmlElementRenderer|null = null;
    
    private static readonly _viewScale = 0.001;

    public awake(): void {
        this.engine.screen.onResize.addListener(this.onScreenResize);

        this._camera = this.gameObject.getComponent(Camera);
        const renderer = this.createRenderer();
        const viewSize = this._camera!.viewSize;
        const screen = this.engine.screen;
        const aspect = screen.width / screen.height;
        renderer.elementWidth = viewSize * 2 * aspect;
        renderer.elementHeight = viewSize * 2;
    }
    
    private createRenderer(): CssHtmlElementRenderer {
        if (this._htmlRenderer) return this._htmlRenderer;

        this._htmlRenderer = this.gameObject.addComponent(CssHtmlElementRenderer);
        this._htmlRenderer!.enabled = this.enabled;

        const div = document.createElement("div");
        div.addEventListener("mousedown", this.onMouseDown);
        div.addEventListener("mouseup", this.onMouseUp);
        div.addEventListener("mouseenter", this.onMouseEnter);
        div.addEventListener("mouseleave", this.onMouseLeave);
        div.addEventListener("mousemove", this.onMouseMove);
        div.addEventListener("touchstart", this.onTouchStart);
        div.addEventListener("touchend", this.onTouchEnd);
        div.addEventListener("touchmove", this.onTouchMove);
        div.addEventListener("touchcancel", this.onTouchCancel);
        this._htmlRenderer!.element = div;
        this._htmlRenderer!.viewScale = PointerInputListener._viewScale;

        return this._htmlRenderer!;
    }
    
    public onEnable(): void {
        if (this._htmlRenderer!.exists) {
            this._htmlRenderer!.enabled = true;
        }
    }

    public onDisable(): void {
        if (this._htmlRenderer!.exists) {
            this._htmlRenderer!.enabled = false;
        }
    }

    public onDestroy(): void {
        this.engine.screen.onResize.removeListener(this.onScreenResize);

        if (this._htmlRenderer) {
            this._htmlRenderer.destroy();
            this._htmlRenderer = null;
        }
    }

    private readonly onScreenResize = (width: number, height: number): void => {
        if (this._htmlRenderer) {
            const viewSize = this._camera!.viewSize;
            const aspect = width / height;
            this._htmlRenderer!.elementWidth = viewSize * 2 * aspect;
            this._htmlRenderer!.elementHeight = viewSize * 2;
        }
    };

    private readonly _tempVector2 = new Vector2();

    private makePointerEvent(event: MouseEvent): PointerEvent {
        const viewSize = this._camera!.viewSize;
        const screen = this.engine.screen;
        const aspect = screen.width / screen.height;
        
        return new PointerEvent(
            this._tempVector2.set(
                event.offsetX * PointerInputListener._viewScale - viewSize * aspect,
                -event.offsetY * PointerInputListener._viewScale + viewSize
            ),
            event.button
        );
    }

    private readonly onMouseDown = (event: MouseEvent): void => {
        this._onPointerDownEvent.invoke(this.makePointerEvent(event));
    };
    
    private readonly onMouseUp = (event: MouseEvent): void => {
        this._onPointerUpEvent.invoke(this.makePointerEvent(event));
    };

    private readonly onMouseEnter = (event: MouseEvent): void => {
        this._onPointerEnterEvent.invoke(this.makePointerEvent(event));
    };

    private readonly onMouseLeave = (event: MouseEvent): void => {
        this._onPointerLeaveEvent.invoke(this.makePointerEvent(event));
    };

    private readonly onMouseMove = (event: MouseEvent): void => {
        this._onPointerMoveEvent.invoke(this.makePointerEvent(event));
    };

    private simulateMouseEvent(eventName: string, touch: Touch): void {
        const simulatedEvent = new MouseEvent(
            eventName, {
                bubbles: true, cancelable: true, view: window, detail: 1,
                screenX: touch.screenX, screenY: touch.screenY, clientX: touch.clientX, clientY: touch.clientY,
                ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, button: 0, relatedTarget: null
            });
        touch.target.dispatchEvent(simulatedEvent);
    }

    private readonly onTouchStart = (event: TouchEvent): void => {
        this._onTouchStartFunc = (): void => {
            this.simulateMouseEvent("mouseenter", event.touches[0]);
            this.simulateMouseEvent("mousedown", event.touches[0]);
        };
    };

    private readonly onTouchEnd = (event: TouchEvent): void => {
        if (!this._touchMoveOccured) return;
        this._touchMoveOccured = false;
        this.simulateMouseEvent("mouseup", event.changedTouches[0]);
        this.simulateMouseEvent("mouseleave", event.changedTouches[0]);
    };

    private readonly onTouchMove = (event: TouchEvent): void => {
        if (this._onTouchStartFunc) {
            this._onTouchStartFunc();
            this._onTouchStartFunc = null;
        }
        this.simulateMouseEvent("mousemove", event.touches[0]);
        this._touchMoveOccured = true;
    };

    private readonly onTouchCancel = (event: TouchEvent): void => {
        if (!this._touchMoveOccured) return;
        this._touchMoveOccured = false;
        this.simulateMouseEvent("mouseleave", event.changedTouches[0]);
    };

    /**
     * on pointer down event
     */
    public get onPointerDown(): IEventContainer<(event: PointerEvent) => void> {
        return this._onPointerDownEvent;
    }

    /**
     * on pointer up event
     */
    public get onPointerUp(): IEventContainer<(event: PointerEvent) => void> {
        return this._onPointerUpEvent;
    }

    /**
     * on pointer enter event
     */
    public get onPointerEnter(): IEventContainer<(event: PointerEvent) => void> {
        return this._onPointerEnterEvent;
    }

    /**
     * on pointer leave event
     */
    public get onPointerLeave(): IEventContainer<(event: PointerEvent) => void> {
        return this._onPointerLeaveEvent;
    }

    /**
     * on pointer move event
     */
    public get onPointerMove(): IEventContainer<(event: PointerEvent) => void> {
        return this._onPointerMoveEvent;
    }
}
