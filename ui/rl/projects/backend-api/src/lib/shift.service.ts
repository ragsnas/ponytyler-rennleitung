import { Injectable } from "@angular/core";
import { Show } from "./show.service";

export interface Shift {
  id: number;
  show: Show;
  showId: number;
  order: number;
  duration: number;
  shiftStarted: Date;
  shiftFinished: Date;
  shiftJobs: ShiftRole[];
}

export interface ShiftRole {
  id: number;
  shift?: Shift;
  shiftId?: number;
  roleTitle: string;
  crewMember: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShiftService {

}
