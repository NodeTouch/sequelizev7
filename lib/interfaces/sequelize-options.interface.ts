import { Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';
import { Options, AbstractDialect } from '@sequelize/core';

/**
 * @publicApi
 */
export type SequelizeModuleOptions<Dialect extends AbstractDialect> = {
  /**
   * Connection name
   */
  name?: string;
  /**
   * Number of times to retry connecting
   * Default: 10
   */
  retryAttempts?: number;
  /**
   * Delay between connection retry attempts (ms)
   * Default: 3000
   */
  retryDelay?: number;
  /**
   * If `true`, models will be loaded automatically.
   */
  autoLoadModels?: boolean;
  /**
   * If `true`, "sequelize.sync()" will be called.
   * Default: true
   */
  synchronize?: boolean;
} & Partial<Options<Dialect>>;

/**
 * @publicApi
 */
export interface SequelizeOptionsFactory<Dialect extends AbstractDialect> {
  createSequelizeOptions(
    connectionName?: string,
  ):  Promise<SequelizeModuleOptions<Dialect>> | SequelizeModuleOptions<Dialect>;
}

/**
 * @publicApi
 */
export interface SequelizeModuleAsyncOptions<Dialect extends AbstractDialect>
  extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  useExisting?: Type<SequelizeOptionsFactory<Dialect>>;
  useClass?: Type<SequelizeOptionsFactory<Dialect>>;
  useFactory?: (
    ...args: any[]
  ) => Promise<SequelizeModuleOptions<Dialect>> | SequelizeModuleOptions<Dialect>;
  inject?: any[];
}
