import { ShiftsService } from "../prisma-api/shifts.service";
import { Prisma } from "@prisma/client";
export declare class ShiftsController {
    private readonly shiftsService;
    constructor(shiftsService: ShiftsService);
    findShiftsForShow(showId: string): Promise<Shift[]>;
    create(data: Prisma.ShiftUncheckedCreateInput): Promise<Shift>;
}
