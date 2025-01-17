import { MikroORM, EntityManager } from '@mikro-orm/core';
import { getEntityManager } from '../../src/utils/orm';
import config from '../../mikro-orm.config'; // Adjust the path as necessary

jest.mock('@mikro-orm/core'); // Mock MikroORM library
jest.mock('../../mikro-orm.config', () => ({})); // Mock configuration file

describe('getEntityManager', () => {
  let mockOrmInstance: Partial<MikroORM>;

  beforeEach(() => {
    mockOrmInstance = {
      em: {
        fork: jest.fn().mockReturnValue({}), // Mock the fork method
      } as unknown as EntityManager,
    };

    // Mock MikroORM.init
    (MikroORM.init as jest.Mock).mockResolvedValue(mockOrmInstance);

    // Manually reset the singleton ormInstance for each test
    jest.isolateModules(() => {
      jest.resetModules(); // Reset module state
    });
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocked calls after each test
  });

  it('should initialize MikroORM and return a forked EntityManager if ormInstance is null', async () => {
    const em = await getEntityManager();

    // Assertions
    expect(MikroORM.init).toHaveBeenCalledWith(config); // Ensure MikroORM.init is called with the config
    expect((mockOrmInstance.em as EntityManager).fork).toHaveBeenCalled(); // Ensure fork is called
    expect(em).toEqual({}); // The mock fork method returns {}
  });

  it('should return a forked EntityManager if ormInstance is already initialized', async () => {
    // First call to initialize ormInstance
    await getEntityManager();

    // Second call to reuse ormInstance
    const em = await getEntityManager();

    // Assertions
    expect(MikroORM.init).toHaveBeenCalledTimes(0); // Ensure MikroORM.init is called only once
    expect((mockOrmInstance.em as EntityManager).fork).toHaveBeenCalledTimes(0); // Ensure fork is called twice
    expect(em).toEqual({}); // The mock fork method returns {}
  });
});
