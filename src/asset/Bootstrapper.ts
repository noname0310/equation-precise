import { Vector3 } from "three/src/Three";
import { 
    Bootstrapper as BaseBootstrapper,
    Camera,
    GameObject,
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
        const gridRenderer = new PrefabRef<GridRenderer>();
        const axisRenderer = new PrefabRef<AxisRenderer>();
        const cameraGameObject = new PrefabRef<GameObject>();
        const rootSolver = new PrefabRef<RootSolver>();

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
                    c.onZoom = (viewSize: number): void => {
                        graphRenderer.ref!.viewScale = viewSize;
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
                    c.onZoom = (viewSize: number): void => {
                        rootSolver.ref!.lineWidth = viewSize;
                    };
                    c.cameraController = cameraController.ref!;
                })
                .getComponent(RootSolver, rootSolver))

            .withChild(instantiater.buildGameObject("camera", new Vector3(0, 0, 1))
                .withComponent(Camera, c => c.viewSize = 4)
                .withComponent(CameraController)
                .withComponent(GridRenderer)
                .withComponent(GridUnitRenderer)
                .withComponent(AxisRenderer)
                .withComponent(CameraRelativeScaleController, c => {
                    c.cameraRelativeScale = 0.003;
                    c.onZoom = (viewSize: number): void => {
                        gridRenderer.ref!.viewScale = viewSize;
                        axisRenderer.ref!.lineWidth = viewSize * 2;
                    };
                    c.cameraController = cameraController.ref!;
                })
                .withComponent(PointerInputListener, c => {
                    const tempVector = new Vector3();
                    c.onPointerMove.addListener(e => {
                        tempVector.set(e.position.x, e.position.y, 0);
                        cameraGameObject.ref!.transform.transformPoint(tempVector);
                    });
                })
                .getComponent(CameraController, cameraController)
                .getComponent(GridRenderer, gridRenderer)
                .getComponent(AxisRenderer, axisRenderer)
                .getComponent(PointerInputListener, pointerInputListener)
                .getGameObject(cameraGameObject))
        ;
    }
}
