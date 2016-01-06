import {Component, ViewEncapsulation} from 'angular2/core';
import {RouteConfig, ROUTER_DIRECTIVES} from 'angular2/router';

import {PlanView} from '../plan-view/plan-view';
import {PlanList} from '../plan-list/plan-list';
import {PlanNew} from '../plan-new/plan-new';
import {About} from '../about/about';

@Component({
    selector: 'app',
    templateUrl: './components/app/app.html',
    encapsulation: ViewEncapsulation.None,
    directives: [ROUTER_DIRECTIVES]
})

@RouteConfig([
    { path: '/', redirectTo: ['/PlanList'] },
    { path: '/plans', component: PlanList, name: 'PlanList' },
    { path: '/plans/new', component: PlanNew, name: 'PlanNew' },
    { path: '/plans/:id', component: PlanView, name: 'PlanView' },
    { path: '/about', component: About, name: 'About'}
])

export class App { }
