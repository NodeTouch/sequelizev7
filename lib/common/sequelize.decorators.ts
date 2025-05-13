import { Inject } from '@nestjs/common';
import { AbstractDialect } from '@sequelize/core';
import { SequelizeModuleOptions } from '../interfaces/sequelize-options.interface';
import { DEFAULT_CONNECTION_NAME } from '../sequelize.constants';
import { getConnectionToken, getModelToken } from './sequelize.utils';

/**
 * @publicApi
 */
export const InjectModel = (
  entity: Function,
  connection: string = DEFAULT_CONNECTION_NAME,
) => Inject(getModelToken(entity, connection));

/**
 * @publicApi
 */
export const InjectConnection: <Dialect extends AbstractDialect>(
  connection?: SequelizeModuleOptions<Dialect> | string,
) => ParameterDecorator = <Dialect extends AbstractDialect>(connection?: SequelizeModuleOptions<Dialect> | string) =>
  Inject(getConnectionToken(connection));
