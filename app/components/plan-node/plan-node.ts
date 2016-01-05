import {IPlan} from '../../interfaces/iplan';
import {Component, OnInit} from 'angular2/core';
import {HighlightType, EstimateDirection} from '../../enums';

import {PlanService} from '../../services/plan-service';
import {SyntaxHighlightService} from '../../services/syntax-highlight-service';
import {HelpService} from '../../services/help-service';
import {ColorService} from '../../services/color-service';

/// <reference path="lodash.d.ts" />

@Component({
    selector: 'plan-node',
    inputs: ['plan', 'node', 'viewOptions'],
    templateUrl: './components/plan-node/plan-node.html',
    directives: [PlanNode],
    providers: [PlanService, SyntaxHighlightService, HelpService, ColorService]
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

    constructor(private _planService: PlanService,
      private _syntaxHighlightService: SyntaxHighlightService,
      private _helpService: HelpService,
      private _colorService: ColorService)
      {}

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
      keyItems.push(this.node[this._planService.SCHEMA_PROP] + '.' + this.node[this._planService.RELATION_NAME_PROP]);
      keyItems.push(' ' + this.node[this._planService.RELATION_NAME_PROP] + ' ');
      keyItems.push(' ' + this.node[this._planService.ALIAS_PROP] + ' ');
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
        this.backgroundColor = this._colorService.numberToColorHsl(1 - this.width / this.MAX_WIDTH);
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
            .omit(this._planService.PLANS_PROP)
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

    getNodeTypeDescription() {
      return this._helpService.getNodeTypeDescription(this.node[this._planService.NODE_TYPE_PROP]);
   }
}
