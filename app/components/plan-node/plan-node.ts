import {IPlan} from '../../interfaces/iplan';
import {Component, OnInit} from 'angular2/core';
import {HighlightType, EstimateDirection, ViewMode} from '../../enums';
import {DurationPipe, DurationUnitPipe} from '../../pipes';

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
    providers: [PlanService, SyntaxHighlightService, HelpService, ColorService],
    pipes: [DurationPipe, DurationUnitPipe]
})

export class PlanNode {
    // consts
    NORMAL_WIDTH: number = 220;
    COMPACT_WIDTH: number = 140;
    DOT_WIDTH: number = 30;
    EXPANDED_WIDTH: number = 400;

    MIN_ESTIMATE_MISS: number = 100;
    COSTLY_TAG: string = 'costliest';
    SLOW_TAG: string = 'slowest';
    LARGE_TAG: string = 'largest';
    ESTIMATE_TAG: string = 'bad estimate';

    // inputs
    plan: IPlan;
    node: any;
    viewOptions: any;

    // UI flags
    showDetails: boolean;

    // calculated properties
    executionTimePercent: number;
    backgroundColor: string;
    highlightValue: number;
    barContainerWidth: number;
    barWidth: number;
    props: Array<any>;
    tags: Array<string>;
    plannerRowEstimateValue: number;
    plannerRowEstimateDirection: EstimateDirection;

    // required for custom change detection
    currentHighlightType: string;
    currentCompactView: boolean;
    currentExpandedView: boolean;

    // expose enum to view
    estimateDirections = EstimateDirection;
    highlightTypes = HighlightType;
    viewModes = ViewMode;

    constructor(private _planService: PlanService,
        private _syntaxHighlightService: SyntaxHighlightService,
        private _helpService: HelpService,
        private _colorService: ColorService) { }

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
        if (this.currentHighlightType !== this.viewOptions.highlightType) {
            this.currentHighlightType = this.viewOptions.highlightType;
            this.calculateBar();
        }

        if (this.currentCompactView !== this.viewOptions.showCompactView) {
            this.currentCompactView = this.viewOptions.showCompactView;
            this.calculateBar();
        }

        if (this.currentExpandedView !== this.showDetails) {
            this.currentExpandedView = this.showDetails;
            this.calculateBar();
        }
    }

    getFormattedQuery() {
        var keyItems: Array<string> = [];

        // relation name will be highlighted for SCAN nodes
        var relationName: string = this.node[this._planService.RELATION_NAME_PROP];
        if (relationName) {
            keyItems.push(this.node[this._planService.SCHEMA_PROP] + '.' + relationName);
            keyItems.push(' ' + relationName);
            keyItems.push(' ' + this.node[this._planService.ALIAS_PROP] + ' ');
        }

        // group key will be highlighted for AGGREGATE nodes
        var groupKey: Array<string> = this.node[this._planService.GROUP_KEY_PROP];
        if (groupKey) {
            keyItems.push('GROUP BY ' + groupKey.join(','));
        }

        // hash condition will be highlighted for HASH JOIN nodes
        var hashCondition: string = this.node[this._planService.HASH_CONDITION_PROP];
        if (hashCondition) {
            keyItems.push(hashCondition.replace('(', '').replace(')', ''));
        }

        if (this.node[this._planService.NODE_TYPE_PROP].toUpperCase() === 'LIMIT') {
            keyItems.push('LIMIT');
        }
        return this._syntaxHighlightService.highlight(this.plan.query, keyItems);
    }

    calculateBar() {
        switch (this.viewOptions.viewMode) {
            case ViewMode.DOT:
                this.barContainerWidth = this.DOT_WIDTH;
                break;
            case ViewMode.COMPACT:
                this.barContainerWidth = this.COMPACT_WIDTH;
                break;
            default:
                this.barContainerWidth = this.NORMAL_WIDTH;
                break;
        }

        // expanded view width trumps others
        if (this.currentExpandedView) {
            this.barContainerWidth = this.EXPANDED_WIDTH;
        }

        switch (this.currentHighlightType) {
            case HighlightType.DURATION:
                this.highlightValue = (this.node[this._planService.ACTUAL_DURATION_PROP]);
                this.barWidth = Math.round((this.highlightValue / this.plan.planStats.maxDuration) * this.barContainerWidth);
                break;
            case HighlightType.ROWS:
                this.highlightValue = (this.node[this._planService.ACTUAL_ROWS_PROP]);
                this.barWidth = Math.round((this.highlightValue / this.plan.planStats.maxRows) * this.barContainerWidth);
                break;
            case HighlightType.COST:
                this.highlightValue = (this.node[this._planService.ACTUAL_COST_PROP]);
                this.barWidth = Math.round((this.highlightValue / this.plan.planStats.maxCost) * this.barContainerWidth);
                break;
        }

        if (this.barWidth < 1) {
            this.barWidth = 1;
        }

        this.backgroundColor = this._colorService.numberToColorHsl(1 - this.barWidth / this.barContainerWidth);
    }

    calculateDuration() {
        this.executionTimePercent = (_.round((this.node[this._planService.ACTUAL_DURATION_PROP] / this.plan.planStats.executionTime) * 100));
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

    getNodeName() {
        if (this.viewOptions.viewMode === ViewMode.DOT && !this.showDetails) {
            return this.node[this._planService.NODE_TYPE_PROP].replace(/[^A-Z]/g, '').toUpperCase();
        }

        return (this.node[this._planService.NODE_TYPE_PROP]).toUpperCase();
    }

    getTagName(tagName: String) {
        if (this.viewOptions.viewMode === ViewMode.DOT && !this.showDetails) {
            return tagName.charAt(0);
        }
        return tagName;
    }

    shouldShowPlannerEstimate() {
        if (this.viewOptions.showPlannerEstimate && this.showDetails) {
            return true;
        }

        if (this.viewOptions.viewMode === ViewMode.DOT) {
            return false;
        }

        return this.viewOptions.showPlannerEstimate;
    }

    shouldShowNodeBarLabel() {
      if (this.showDetails) {
         return true;
      }

      if (this.viewOptions.viewMode === ViewMode.DOT) {
         return false;
      }

      return true;
   }
}
