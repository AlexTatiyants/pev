export class HighlightType {
    static NONE: string = 'none';
    static DURATION: string = 'duration';
    static ROWS: string = 'rows';
    static COST: string = 'cost';
}

export enum EstimateDirection {
    over,
    under
}

export class ViewMode {
    static FULL: string = 'full';
    static COMPACT: string = 'compact';
    static DOT: string = 'dot';
}
