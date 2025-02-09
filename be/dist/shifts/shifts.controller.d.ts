import { ShiftsService } from "../prisma-api/shifts.service";
import { Shift, Prisma } from "@prisma/client";
export declare class ShiftsController {
    private readonly shiftsService;
    constructor(shiftsService: ShiftsService);
    getShows(): Promise<Shift[]>;
    findShiftsForShow(showId: string): any;
    create(data: Prisma.ShiftUncheckedCreateInput): Promise<{
        id: number;
        showId: number;
        order: number;
        duration: number | null;
        shiftStarted: Date | null;
        shiftFinished: Date | null;
    }>;
}
