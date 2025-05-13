import { DynamicModule, Module } from '@nestjs/common';
import { Options, AbstractDialect } from '@sequelize/core';
import { EntitiesMetadataStorage } from './entities-metadata.storage';
import {
  SequelizeModuleAsyncOptions,
  SequelizeModuleOptions,
} from './interfaces/sequelize-options.interface';
import { SequelizeCoreModule } from './sequelize-core.module';
import { DEFAULT_CONNECTION_NAME } from './sequelize.constants';
import { createSequelizeProviders } from './sequelize.providers';

/**
 * @publicApi
 */
@Module({})
export class SequelizeModule {
  static forRoot<Dialect extends AbstractDialect>(options: SequelizeModuleOptions<Dialect>): DynamicModule {
    return {
      module: SequelizeModule,
      imports: [SequelizeCoreModule.forRoot(options)],
    };
  }

  static forFeature<Dialect extends AbstractDialect>(
    entities: Function[] = [],
    connection: Options<Dialect> | string = DEFAULT_CONNECTION_NAME,
  ): DynamicModule {
    const providers = createSequelizeProviders(entities, connection);
    EntitiesMetadataStorage.addEntitiesByConnection(connection, entities);
    return {
      module: SequelizeModule,
      providers: providers,
      exports: providers,
    };
  }

  static forRootAsync<Dialect extends AbstractDialect>(options: SequelizeModuleAsyncOptions<Dialect>): DynamicModule {
    return {
      module: SequelizeModule,
      imports: [SequelizeCoreModule.forRootAsync(options)],
    };
  }
}
