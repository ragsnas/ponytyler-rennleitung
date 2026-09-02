import { ShowService } from 'src/prisma-api/show.service';
export declare class ExportService {
    private readonly showService;
    constructor(showService: ShowService);
    allShowsWithRaces(): import(".prisma/client").Prisma.PrismaPromise<({
        races: {
            id: number;
            showId: number;
            orderNumber: number;
            createdAt: Date;
            raced: boolean;
            raceState: string;
            person1: string | null;
            song1Id: number | null;
            person2: string | null;
            song2Id: number | null;
            bikeWon: number;
        }[];
        shifts: {
            id: number;
            showId: number;
            duration: number | null;
            order: number;
            shiftStarted: Date | null;
            shiftFinished: Date | null;
        }[];
    } & {
        id: number;
        name: string;
        date: Date | null;
        actualStartTime: Date | null;
        duration: number | null;
        finished: boolean;
        active: boolean;
    })[]>;
}
