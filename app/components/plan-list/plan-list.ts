import {Component, OnInit} from 'angular2/core';
import {ROUTER_DIRECTIVES} from 'angular2/router';

import {IPlan} from '../../interfaces/iplan';
import {PlanService} from '../../services/plan-service';
import {PlanNew} from '../plan-new/plan-new';

import {MomentDatePipe} from '../../pipes';

@Component({
    selector: 'plan-list',
    templateUrl: './components/plan-list/plan-list.html',
    providers: [PlanService],
    directives: [ROUTER_DIRECTIVES, PlanNew],
    pipes: [MomentDatePipe]
})
export class PlanList {
    plans: Array<IPlan>;
    newPlanName: string;
    newPlanContent: any;
    newPlanId: string;
    openDialog: boolean = false;
    planToDelete: IPlan;

    constructor(private _planService: PlanService) { }

    ngOnInit() {
        this.plans = this._planService.getPlans();
    }

    requestDelete(plan) {
        this.openDialog = true;
        this.planToDelete = plan;
    }

    deletePlan(plan) {
        this.openDialog = false;
        console.log(this.planToDelete);
        this._planService.deletePlan(this.planToDelete);
        this.plans = this._planService.getPlans();
    }

    cancelDelete() {
        this.openDialog = false;
    }

    deleteAllPlans() {
        this._planService.deleteAllPlans();
    }
}
