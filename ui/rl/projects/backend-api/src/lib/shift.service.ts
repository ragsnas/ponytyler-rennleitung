import { Injectable } from "@angular/core";
import { Show } from "./show.service";

export interface Shift {
  id: number | undefined;
  show: Show | undefined;
  showId: number | undefined;
  order: number;
  duration: number | undefined;
  shiftStarted: Date | undefined;
  shiftFinished: Date | undefined;
  shiftJobs: ShiftRole[];
}

export interface ShiftRole {
  id: number | undefined;
  shift?: Shift | undefined;
  shiftId?: number | undefined;
  roleTitle: string;
  crewMember: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShiftService {

}
