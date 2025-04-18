import { Injectable } from "@angular/core";
import { User } from "projects/backend-api/src/lib/user.service";
import { Shift, ShiftRole } from "../../../../../backend-api/src/lib/shift.service";

@Injectable({
  providedIn: 'root'
})
export class WizzardService {
  selectedUsers: User[] = [];
  selectedShifts: Shift[] = [];
  selectedShiftsRoles: ShiftRole[] = [];
  selectedShiftCount: number = 0;
  selectedShiftsForUsers: number = 0;

  reset() {
    this.selectedUsers = [];
    this.selectedShiftCount = 0;
    this.selectedShiftsForUsers = 0;
  }

  selectUsers(selectedUsers: User[]) {
    this.selectedUsers = selectedUsers;
  }
}
