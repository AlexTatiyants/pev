import {IPlan} from '../../interfaces/iplan';
import {Component, OnInit} from 'angular2/core';
import {HighlightType, EstimateDirection} from '../../enums';
import {PlanService} from '../../services/plan-service';
import {SyntaxHighlightService} from '../../services/syntax-highlight-service';
/// <reference path="lodash.d.ts" />

@Component({
    selector: 'plan-node',
    inputs: ['plan', 'node', 'viewOptions'],
    templateUrl: './components/plan-node/plan-node.html',
    directives: [PlanNode],
    providers: [PlanService, SyntaxHighlightService]
})

export class PlanNode {
    // consts
    MAX_WIDTH: number = 220;
    MIN_ESTIMATE_MISS: number = 100;
    COSTLY_TAG: string = 'costliest';
    SLOW_TAG: string = 'slowest';
    LARGE_TAG: string = 'largest';
    ESTIMATE_TAG: string = 'bad estimate';

    // inputs
    plan: IPlan;
    node: any;
    viewOptions: any;

    // calculated properties
    duration: string;
    durationUnit: string;
    executionTimePercent: number;
    backgroundColor: string;
    highlightValue: number;
    width: number;
    props: Array<any>;
    tags: Array<string>;
    plannerRowEstimateValue: number;
    plannerRowEstimateDirection: EstimateDirection;
    currentHighlightType: string;

    // expose enum to view
    estimateDirections = EstimateDirection;
    highlightTypes = HighlightType;

    constructor(private _planService: PlanService, private _syntaxHighlightService: SyntaxHighlightService) { }

    ngOnInit() {
        this.currentHighlightType = this.viewOptions.highlightType;
        this.calculateBar();
        this.calculateProps();
        this.calculateDuration();
        this.calculateTags();

        this.plannerRowEstimateDirection = this.node[this._planService.PLANNER_ESIMATE_DIRECTION];
        this.plannerRowEstimateValue = _.round(this.node[this._planService.PLANNER_ESTIMATE_FACTOR]);
    }

    ngDoCheck() {
        //   console.log("check", this.currentHighlightType, this.viewOptions.highlightType);
        if (this.currentHighlightType !== this.viewOptions.highlightType) {
            this.currentHighlightType = this.viewOptions.highlightType;
            this.calculateBar();
        }
    }

    getFormattedQuery() {
      var keyItems: Array<string> = [];
      keyItems.push(this.node['Schema'] + '.' + this.node['Relation Name']);
      keyItems.push(' ' + this.node['Relation Name'] + ' ');
      keyItems.push(' ' + this.node['Alias'] + ' ');
      return this._syntaxHighlightService.highlightKeyItems(this.plan.formattedQuery, keyItems);
    }

    calculateBar() {
        switch (this.currentHighlightType) {
            case HighlightType.DURATION:
                this.highlightValue = (this.node[this._planService.ACTUAL_DURATION_PROP]);
                this.width = Math.round((this.highlightValue / this.plan.planStats.maxDuration) * this.MAX_WIDTH);
                break;
            case HighlightType.ROWS:
                this.highlightValue = (this.node[this._planService.ACTUAL_ROWS_PROP]);
                this.width = Math.round((this.highlightValue / this.plan.planStats.maxRows) * this.MAX_WIDTH);
                break;
            case HighlightType.COST:
                this.highlightValue = (this.node[this._planService.ACTUAL_COST_PROP]);
                this.width = Math.round((this.highlightValue / this.plan.planStats.maxCost) * this.MAX_WIDTH);
                break;
        }

        if (this.width < 1) { this.width = 1 }
        this.backgroundColor = this.numberToColorHsl(1 - this.width / this.MAX_WIDTH);
    }

    calculateDuration() {
        var dur: number = _.round(this.node[this._planService.ACTUAL_DURATION_PROP]);
        // convert duration into approriate units
        if (dur < 1) {
            this.duration = "<1";
            this.durationUnit = 'ms';
        } else if (dur > 1 && dur < 1000) {
            this.duration = dur.toString();
            this.durationUnit = 'ms';
        } else {
            this.duration = _.round(dur / 1000, 2).toString();
            this.durationUnit = 'mins';
        }
        this.executionTimePercent = (_.round((dur / this.plan.planStats.executionTime) * 100));
    }

    // create an array of node propeties so that they can be displayed in the view
    calculateProps() {
        this.props = _.chain(this.node)
            .omit('Plans')
            .map((value, key) => {
                return { key: key, value: value };
            })
            .value();
    }

    calculateTags() {
        this.tags = [];
        if (this.node[this._planService.SLOWEST_NODE_PROP]) {
            this.tags.push(this.SLOW_TAG);
        }
        if (this.node[this._planService.COSTLIEST_NODE_PROP]) {
            this.tags.push(this.COSTLY_TAG);
        }
        if (this.node[this._planService.LARGEST_NODE_PROP]) {
            this.tags.push(this.LARGE_TAG);
        }
        if (this.node[this._planService.PLANNER_ESTIMATE_FACTOR] >= this.MIN_ESTIMATE_MISS) {
            this.tags.push(this.ESTIMATE_TAG);
        }
    }

    /**
     * http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
     *
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes h, s, and l are contained in the set [0, 1] and
     * returns r, g, and b in the set [0, 255].
     *
     * @param   Number  h       The hue
     * @param   Number  s       The saturation
     * @param   Number  l       The lightness
     * @return  Array           The RGB representation
     */
    hslToRgb(h, s, l) {
        var r, g, b;

        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
    }

    // convert a number to a color using hsl
    numberToColorHsl(i) {
        // as the function expects a value between 0 and 1, and red = 0° and green = 120°
        // we convert the input to the appropriate hue value
        var hue = i * 100 * 1.2 / 360;
        // we convert hsl to rgb (saturation 100%, lightness 50%)
        var rgb = this.hslToRgb(hue, .9, .4);
        // we format to css value and return
        return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    }
}
