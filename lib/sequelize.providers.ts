import { Provider } from '@nestjs/common';
import { Sequelize, Options, AbstractDialect } from '@sequelize/core';
import { getConnectionToken, getModelToken } from './common/sequelize.utils';

export function createSequelizeProviders<Dialect extends AbstractDialect>(
  entities?: Function[],
  connection?: Options<Dialect> | string,
): Provider[] {
  const repositories = (entities || []).map((entity) => ({
    provide: getModelToken(entity, connection),
    useFactory: (connection: Sequelize) => {
      return entity;
    },
    inject: [getConnectionToken(connection)],
  }));

  return [...repositories];
}
