import {Component, OnInit} from 'angular2/core';
import {ROUTER_DIRECTIVES, RouteParams} from 'angular2/router';

import {IPlan} from '../../interfaces/iplan';
import {HighlightType} from '../../enums';
import {PlanNode} from '../plan-node/plan-node';
import {PlanService} from '../../services/plan-service';
import {SyntaxHighlightService} from '../../services/syntax-highlight-service';

@Component({
    selector: 'plan-view',
    templateUrl: './components/plan-view/plan-view.html',
    directives: [ROUTER_DIRECTIVES, PlanNode],
    providers: [PlanService, SyntaxHighlightService]
})
export class PlanView {
    id: string;
    plan: IPlan;
    rootContainer: any;
    executionTime: string;
    executionTimeUnit: string;
    hideMenu: boolean = true;

    viewOptions: any = {
        showPlanStats: true,
        showHighlightBar: true,
        showPlannerEstimate: false,
        showTags: true,
        highlightType: HighlightType.NONE
    };

    showPlannerEstimate: boolean = true;
    showMenu: boolean = false;

    highlightTypes = HighlightType; // exposing the enum to the view

    constructor(private _planService: PlanService, routeParams: RouteParams) {
        this.id = routeParams.get('id');
    }

    getPlan() {
        if (!this.id) {
            return;
        }

        this.plan = this._planService.getPlan(this.id);
        this.rootContainer = this.plan.content;

        var executionTime: number = this.rootContainer['Execution Time'] || this.rootContainer['Total Runtime'];
        [this.executionTime, this.executionTimeUnit] = this.calculateDuration(executionTime);

        this.plan.planStats = {
            executionTime: executionTime,
            planningTime: this.rootContainer['Planning Time'] || 0,
            maxRows: this.rootContainer[this._planService.MAXIMUM_ROWS_PROP] || 0,
            maxCost: this.rootContainer[this._planService.MAXIMUM_COSTS_PROP] || 0,
            maxDuration: this.rootContainer[this._planService.MAXIMUM_DURATION_PROP] || 0
        };
    }

    ngOnInit() {
        this.getPlan();
    }

    toggleHighlight(type: HighlightType) {
        this.viewOptions.highlightType = type;
    }

    analyzePlan() {
        this._planService.analyzePlan(this.plan);
    }

    calculateDuration(originalValue: number) {
        var duration: string = '';
        var unit: string = '';

        if (originalValue < 1) {
            duration = '<1';
            unit = 'ms';
        } else if (originalValue > 1 && originalValue < 1000) {
            duration = originalValue.toString();
            unit = 'ms';
        } else {
            duration = _.round(originalValue / 1000, 2).toString();
            unit = 'mins';
        }
        return [duration, unit];
    }
}
