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

export class Bootstrapper extends BaseBootstrapper {
    public run(): SceneBuilder {
        const instantiater = this.instantiater;

        const cameraController = new PrefabRef<CameraController>();
        const graphRenderer = new PrefabRef<GraphRenderer>();

        return this.sceneBuilder
            .withChild(instantiater.buildGameObject("ui-controller")
                .withComponent(UiController, c => {
                    c.equationInputField = document.getElementById("input_equation") as HTMLInputElement;
                    c.errorMessageDiv = document.getElementById("error_message") as HTMLDivElement;
                    c.graphRenderer = graphRenderer.ref!;
                }))

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

            .withChild(instantiater.buildGameObject("camera", new Vector3(0, 0, -1))
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
                        axisRenderer.lineWidth = viewSize * 5;
                    };
                    c.cameraController = cameraController.ref!;
                })
                .getComponent(CameraController, cameraController))
        ;
    }
}
