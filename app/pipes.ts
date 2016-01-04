import {Pipe} from 'angular2/core';
/// <reference path="moment.d.ts" />

@Pipe({name: 'momentDate'})

export class MomentDatePipe {
  transform(value:string, args:string[]) : any {
    return moment(value).format('LLLL');
  }
}
