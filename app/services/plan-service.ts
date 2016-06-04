import {IPlan} from '../interfaces/iplan';
import {EstimateDirection} from '../enums';
/// <reference path="moment.d.ts" />
/// <reference path="lodash.d.ts" />

export class PlanService {
    // plan property keys
    NODE_TYPE_PROP: string = 'Node Type';
    ACTUAL_ROWS_PROP: string = 'Actual Rows';
    PLAN_ROWS_PROP: string = 'Plan Rows';
    ACTUAL_TOTAL_TIME_PROP: string = 'Actual Total Time';
    ACTUAL_LOOPS_PROP: string = 'Actual Loops';
    TOTAL_COST_PROP: string = 'Total Cost';
    PLANS_PROP: string = 'Plans';
    RELATION_NAME_PROP: string = 'Relation Name';
    SCHEMA_PROP: string = 'Schema';
    ALIAS_PROP: string = 'Alias';
    GROUP_KEY_PROP: string = 'Group Key';
    SORT_KEY_PROP: string = 'Sort Key';
    JOIN_TYPE_PROP: string = 'Join Type';
    INDEX_NAME_PROP: string = 'Index Name';
    HASH_CONDITION_PROP: string = 'Hash Cond';

    // computed by pev
    COMPUTED_TAGS_PROP: string = '*Tags';

    COSTLIEST_NODE_PROP: string = '*Costiest Node (by cost)';
    LARGEST_NODE_PROP: string = '*Largest Node (by rows)';
    SLOWEST_NODE_PROP: string = '*Slowest Node (by duration)';

    MAXIMUM_COSTS_PROP: string = '*Most Expensive Node (cost)';
    MAXIMUM_ROWS_PROP: string = '*Largest Node (rows)';
    MAXIMUM_DURATION_PROP: string = '*Slowest Node (time)';
    ACTUAL_DURATION_PROP: string = '*Actual Duration';
    ACTUAL_COST_PROP: string = '*Actual Cost';
    PLANNER_ESTIMATE_FACTOR: string = '*Planner Row Estimate Factor';
    PLANNER_ESIMATE_DIRECTION: string = '*Planner Row Estimate Direction';

    CTE_SCAN_PROP = 'CTE Scan';
    CTE_NAME_PROP = 'CTE Name';

    ARRAY_INDEX_KEY: string = 'arrayIndex';

    PEV_PLAN_TAG: string = 'plan_';

    private _maxRows: number = 0;
    private _maxCost: number = 0;
    private _maxDuration: number = 0;

    getPlans(): Array<IPlan> {
        var plans: Array<IPlan> = [];

        for (var i in localStorage) {
            if (_.startsWith(i, this.PEV_PLAN_TAG)) {
                plans.push(JSON.parse(localStorage[i]));
            }
        }

        return _.chain(plans)
        .sortBy('createdOn')
        .reverse()
        .value();
    }

    getPlan(id: string): IPlan {
        return JSON.parse(localStorage.getItem(id));
    }

    createPlan(planName: string, planContent: string, planQuery): IPlan {
        var plan: IPlan = {
            id: this.PEV_PLAN_TAG + new Date().getTime().toString(),
            name: planName || 'plan created on ' + moment().format('LLL'),
            createdOn: new Date(),
            content: JSON.parse(planContent)[0],
            query: planQuery
        };

        this.analyzePlan(plan);
        return plan;
    }

    isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    analyzePlan(plan: IPlan) {
        this.processNode(plan.content.Plan);
        plan.content[this.MAXIMUM_ROWS_PROP] = this._maxRows;
        plan.content[this.MAXIMUM_COSTS_PROP] = this._maxCost;
        plan.content[this.MAXIMUM_DURATION_PROP] = this._maxDuration;

        this.findOutlierNodes(plan.content.Plan);

        localStorage.setItem(plan.id, JSON.stringify(plan));
    }

    deletePlan(plan: IPlan) {
        localStorage.removeItem(plan.id);
    }

    deleteAllPlans() {
        localStorage.clear();
    }

    // recursively walk down the plan to compute various metrics
    processNode(node) {
        this.calculatePlannerEstimate(node);
        this.calculateActuals(node);

        _.each(node, (value, key) => {
            this.calculateMaximums(node, key, value);

            if (key === this.PLANS_PROP) {
                _.each(value, (value) => {
                    this.processNode(value);
                });
            }
        });
    }

    calculateMaximums(node, key, value) {
        if (key === this.ACTUAL_ROWS_PROP && this._maxRows < value) {
            this._maxRows = value;
        }
        if (key === this.ACTUAL_COST_PROP && this._maxCost < value) {
            this._maxCost = value;
        }

        if (key === this.ACTUAL_DURATION_PROP && this._maxDuration < value) {
            this._maxDuration = value;
        }
    }

    findOutlierNodes(node) {
        node[this.SLOWEST_NODE_PROP] = false;
        node[this.LARGEST_NODE_PROP] = false;
        node[this.COSTLIEST_NODE_PROP] = false;

        if (node[this.ACTUAL_COST_PROP] === this._maxCost) {
            node[this.COSTLIEST_NODE_PROP] = true;
        }
        if (node[this.ACTUAL_ROWS_PROP] === this._maxRows) {
            node[this.LARGEST_NODE_PROP] = true;
        }
        if (node[this.ACTUAL_DURATION_PROP] === this._maxDuration) {
            node[this.SLOWEST_NODE_PROP] = true;
        }

        _.each(node, (value, key) => {
            if (key === this.PLANS_PROP) {
                _.each(value, (value) => {
                    this.findOutlierNodes(value);
                });
            }
        });
    }

    // actual duration and actual cost are calculated by subtracting child values from the total
    calculateActuals(node) {
        node[this.ACTUAL_DURATION_PROP] = node[this.ACTUAL_TOTAL_TIME_PROP];
        node[this.ACTUAL_COST_PROP] = node[this.TOTAL_COST_PROP];

        console.log (node);
        _.each(node.Plans, subPlan => {
           console.log('processing chldren', subPlan)
           // since CTE scan duration is already included in its subnodes, it should be be
           // subtracted from the duration of this node
            if (subPlan[this.NODE_TYPE_PROP] !== this.CTE_SCAN_PROP) {
               node[this.ACTUAL_DURATION_PROP] = node[this.ACTUAL_DURATION_PROP] - subPlan[this.ACTUAL_TOTAL_TIME_PROP];
               node[this.ACTUAL_COST_PROP] = node[this.ACTUAL_COST_PROP] - subPlan[this.TOTAL_COST_PROP];
            }
        });

        if (node[this.ACTUAL_COST_PROP] < 0) {
            node[this.ACTUAL_COST_PROP] = 0;
        }

        // since time is reported for an invidual loop, actual duration must be adjusted by number of loops
        node[this.ACTUAL_DURATION_PROP] = node[this.ACTUAL_DURATION_PROP] * node[this.ACTUAL_LOOPS_PROP];
    }

    // figure out order of magnitude by which the planner mis-estimated how many rows would be
    // invloved in this node
    calculatePlannerEstimate(node) {
        node[this.PLANNER_ESTIMATE_FACTOR] = node[this.ACTUAL_ROWS_PROP] / node[this.PLAN_ROWS_PROP];
        node[this.PLANNER_ESIMATE_DIRECTION] = EstimateDirection.under;

        if (node[this.PLANNER_ESTIMATE_FACTOR] < 1) {
            node[this.PLANNER_ESIMATE_DIRECTION] = EstimateDirection.over;
            node[this.PLANNER_ESTIMATE_FACTOR] = node[this.PLAN_ROWS_PROP] / node[this.ACTUAL_ROWS_PROP];
        }
    }
}
