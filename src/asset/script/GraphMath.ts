export class GraphMath {
    private static readonly _viewOffset = 0.4;

    public static computeLod(viewSize: number): number {
        viewSize *= GraphMath._viewOffset;

        return Math.max(
            10 ** Math.floor(Math.log10(viewSize)),
            0.5 * 10 ** Math.floor(Math.log10(viewSize / 0.5)),
            0.2 * 10 ** Math.floor(Math.log10(viewSize / 0.2))
        );
    }
}
