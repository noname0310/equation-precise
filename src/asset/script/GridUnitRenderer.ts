import { Camera, Component } from "the-world-engine";
import { CameraController } from "./CameraController";

export class GridUnitRenderer extends Component {
    public override readonly disallowMultipleComponent = true;
    public override readonly requiredComponents = [Camera, CameraController];
}
