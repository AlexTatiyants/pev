import {Component, OnInit} from 'angular2/core';
import {Router, ROUTER_DIRECTIVES} from 'angular2/router';
import {IPlan} from '../../interfaces/iplan';

import {PlanService} from '../../services/plan-service';

@Component({
    selector: 'plan-new',
    templateUrl: './components/plan-new/plan-new.html',
    providers: [PlanService],
    directives: [ROUTER_DIRECTIVES]
})
export class PlanNew {
    planIds: string[];
    newPlanName: string;
    newPlanContent: string;
    newPlanQuery: string;
    newPlan: IPlan;

    constructor( private _router: Router, private _planService: PlanService) { }

    submitPlan() {
        this.newPlan = this._planService.createPlan(this.newPlanName, this.newPlanContent, this.newPlanQuery);
        this._router.navigate( ['PlanView', { id: this.newPlan.id }] );
    }
}
