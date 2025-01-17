import { MikroORM, EntityManager } from '@mikro-orm/core';
import config from '../../mikro-orm.config'; // Adjust the path as necessary

let ormInstance: MikroORM | null = null;

export const getEntityManager = async (): Promise<EntityManager> => {
  if (!ormInstance) {
    ormInstance = await MikroORM.init(config);
  }
  return ormInstance.em.fork(); // Return a forked EntityManager for thread safety
};
