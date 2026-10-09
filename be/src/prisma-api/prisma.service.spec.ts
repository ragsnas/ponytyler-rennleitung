import { PrismaService } from "./prisma.service";

const connectMock = jest.fn();
const disconnectMock = jest.fn();

jest.mock("@prisma/client", () => ({
  PrismaClient: class {
    $connect = connectMock;
    $disconnect = disconnectMock;
  },
}));

jest.mock("@prisma/adapter-pg", () => ({
  PrismaPg: jest.fn(),
}));

describe("PrismaService", () => {
  let service: PrismaService;

  beforeEach(() => {
    connectMock.mockClear();
    disconnectMock.mockClear();
    service = new PrismaService();
  });

  describe("onModuleInit", () => {
    it("connects to the database", async () => {
      await service.onModuleInit();

      expect(connectMock).toHaveBeenCalled();
    });
  });

  describe("onModuleDestroy", () => {
    it("disconnects from the database", async () => {
      await service.onModuleDestroy();

      expect(disconnectMock).toHaveBeenCalled();
    });
  });
});
