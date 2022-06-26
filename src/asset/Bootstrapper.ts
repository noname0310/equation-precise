import { Vector3 } from "three/src/Three";
import { 
    Bootstrapper as BaseBootstrapper,
    Camera,
    PrefabRef,
    SceneBuilder
} from "the-world-engine";
import { CameraController } from "./script/CameraController";
import { CameraRelativeScaleController } from "./script/CameraRelativeScaleController";
import { GraphRenderer } from "./script/GraphRenderer";
import { GridRenderer } from "./script/GridRenderer";
import { AxisRenderer } from "./script/AxisRenderer";
import { GridUnitRenderer } from "./script/GridUnitRenderer";
import { UiController } from "./script/UiController";
import { PointerInputListener } from "./script/PointerInputListener";
import { RootSolver } from "./script/RootSolver";

export class Bootstrapper extends BaseBootstrapper {
    public run(): SceneBuilder {
        const instantiater = this.instantiater;

        const cameraController = new PrefabRef<CameraController>();
        const graphRenderer = new PrefabRef<GraphRenderer>();
        const pointerInputListener = new PrefabRef<PointerInputListener>();
        const uiController = new PrefabRef<UiController>();

        return this.sceneBuilder
            .withChild(instantiater.buildGameObject("ui-controller")
                .withComponent(UiController, c => {
                    c.equationInputField = document.getElementById("input_equation") as HTMLInputElement;
                    c.errorMessageDiv = document.getElementById("error_message") as HTMLDivElement;
                    c.graphRenderer = graphRenderer.ref!;
                })
                .getComponent(UiController, uiController))

            .withChild(instantiater.buildGameObject("graph-renderer")
                .withComponent(GraphRenderer)
                .withComponent(CameraRelativeScaleController, c => {
                    c.cameraRelativeScale = 2;
                    const renderer = c.gameObject.getComponent(GraphRenderer)!;
                    c.onZoom = (viewSize: number): void => {
                        renderer.viewScale = viewSize;
                    };
                    c.cameraController = cameraController.ref!;
                })
                .getComponent(GraphRenderer, graphRenderer))

            .withChild(instantiater.buildGameObject("solver")
                .withComponent(RootSolver, c => {
                    c.uiController = uiController.ref!;
                    c.pointerInputListener = pointerInputListener.ref!;
                    c.resultDiv = document.getElementById("result_message") as HTMLDivElement;
                })
                .withComponent(CameraRelativeScaleController, c => {
                    c.cameraRelativeScale = 0.01;
                    const renderer = c.gameObject.getComponent(RootSolver)!;
                    c.onZoom = (viewSize: number): void => {
                        renderer.lineWidth = viewSize;
                    };
                    c.cameraController = cameraController.ref!;
                }))

            .withChild(instantiater.buildGameObject("camera", new Vector3(0, 0, 1))
                .withComponent(Camera, c => c.viewSize = 4)
                .withComponent(CameraController)
                .withComponent(GridRenderer)
                .withComponent(GridUnitRenderer)
                .withComponent(AxisRenderer)
                .withComponent(CameraRelativeScaleController, c => {
                    c.cameraRelativeScale = 0.003;
                    const gridRenderer = c.gameObject.getComponent(GridRenderer)!;
                    const axisRenderer = c.gameObject.getComponent(AxisRenderer)!;
                    c.onZoom = (viewSize: number): void => {
                        gridRenderer.viewScale = viewSize;
                        axisRenderer.lineWidth = viewSize * 2;
                    };
                    c.cameraController = cameraController.ref!;
                })
                .withComponent(PointerInputListener, c => {
                    const tempVector = new Vector3();
                    c.onPointerMove.addListener(e => {
                        tempVector.set(e.position.x, e.position.y, 0);
                        c.transform.transformPoint(tempVector);
                    });
                })
                .getComponent(CameraController, cameraController)
                .getComponent(PointerInputListener, pointerInputListener))
        ;
    }
}
