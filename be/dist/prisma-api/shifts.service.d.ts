import { PrismaService } from "./prisma.service";
import { Shift, Prisma } from "@prisma/client";
export declare class ShiftsService {
    private prisma;
    constructor(prisma: PrismaService);
    shift(shiftWhereUniqueInput: Prisma.ShiftWhereUniqueInput): Promise<Shift | null>;
    shifts(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.ShiftWhereUniqueInput;
        where?: Prisma.ShiftWhereInput;
        orderBy?: Prisma.ShiftOrderByWithRelationInput;
    }): Promise<Shift[]>;
    createShift(data: Prisma.ShiftUncheckedCreateInput): Promise<Shift>;
    updateShift(params: {
        where: Prisma.ShiftWhereUniqueInput;
        data: Prisma.ShiftUpdateInput;
    }): Promise<Shift>;
    deleteShift(where: Prisma.ShiftWhereUniqueInput): Promise<Shift>;
    shiftsForShow(showId: string): Promise<{
        id: number;
        showId: number;
        order: number;
        duration: number | null;
        shiftStarted: Date | null;
        shiftFinished: Date | null;
    }[]>;
}
