import { PrismaService } from "./prisma.service";

const connectMock = jest.fn();

jest.mock("@prisma/client", () => ({
  PrismaClient: class {
    $connect = connectMock;
  },
}));

jest.mock("@prisma/adapter-pg", () => ({
  PrismaPg: jest.fn(),
}));

describe("PrismaService", () => {
  let service: PrismaService;

  beforeEach(() => {
    connectMock.mockClear();
    service = new PrismaService();
  });

  describe("onModuleInit", () => {
    it("connects to the database", async () => {
      await service.onModuleInit();

      expect(connectMock).toHaveBeenCalled();
    });
  });
});
