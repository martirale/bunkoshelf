const removedPrismaMethod = () => {
  throw new Error(
    "Prisma has been removed. Replace this layer with the direct Postgres implementation."
  );
};

const prisma = new Proxy(
  {},
  {
    get() {
      return removedPrismaMethod;
    },
  }
) as Record<string, unknown>;

export default prisma;
