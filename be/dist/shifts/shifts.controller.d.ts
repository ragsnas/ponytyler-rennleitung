import { ShiftsService } from "../prisma-api/shifts.service";
import { Prisma } from "@prisma/client";
export declare class ShiftsController {
    private readonly shiftsService;
    constructor(shiftsService: ShiftsService);
    findShiftsForShow(showId: string): Promise<{
        id: number;
        showId: number;
        order: number;
        duration: number | null;
        shiftStarted: Date | null;
        shiftFinished: Date | null;
    }[]>;
    create(data: Prisma.ShiftUncheckedCreateInput): Promise<{
        id: number;
        showId: number;
        order: number;
        duration: number | null;
        shiftStarted: Date | null;
        shiftFinished: Date | null;
    }>;
}
