import {
  DynamicModule,
  Global,
  Inject,
  Module,
  OnApplicationShutdown,
  Provider,
  Type,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { defer, lastValueFrom } from 'rxjs';
import { Sequelize, Options, AbstractDialect } from '@sequelize/core';
import {
  generateString,
  getConnectionToken,
  handleRetry,
} from './common/sequelize.utils';
import { EntitiesMetadataStorage } from './entities-metadata.storage';
import {
  SequelizeModuleAsyncOptions,
  SequelizeModuleOptions,
  SequelizeOptionsFactory,
} from './interfaces/sequelize-options.interface';
import {
  DEFAULT_CONNECTION_NAME,
  SEQUELIZE_MODULE_ID,
  SEQUELIZE_MODULE_OPTIONS,
} from './sequelize.constants';

@Global()
@Module({})
export class SequelizeCoreModule<Dialect extends AbstractDialect> implements OnApplicationShutdown {
  constructor(
    @Inject(SEQUELIZE_MODULE_OPTIONS)
    private readonly options: SequelizeModuleOptions<Dialect>,
    private readonly moduleRef: ModuleRef,
  ) {}

  static forRoot<Dialect extends AbstractDialect>(options: SequelizeModuleOptions<Dialect> = {}): DynamicModule {
    const sequelizeModuleOptions = {
      provide: SEQUELIZE_MODULE_OPTIONS,
      useValue: options,
    };
    const connectionProvider = {
      provide: getConnectionToken(options as Options<Dialect>) as string,
      useFactory: async () => await this.createConnectionFactory(options),
    };

    return {
      module: SequelizeCoreModule,
      providers: [connectionProvider, sequelizeModuleOptions],
      exports: [connectionProvider],
    };
  }

  static forRootAsync<Dialect extends AbstractDialect>(options: SequelizeModuleAsyncOptions<Dialect>): DynamicModule {
    const connectionProvider = {
      provide: getConnectionToken(options as Options<Dialect>) as string,
      useFactory: async (sequelizeOptions: SequelizeModuleOptions<Dialect>) => {
        if (options.name) {
          return await this.createConnectionFactory({
            ...sequelizeOptions,
            name: options.name,
          });
        }
        return await this.createConnectionFactory(sequelizeOptions);
      },
      inject: [SEQUELIZE_MODULE_OPTIONS],
    };

    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: SequelizeCoreModule,
      imports: options.imports,
      providers: [
        ...asyncProviders,
        connectionProvider,
        {
          provide: SEQUELIZE_MODULE_ID,
          useValue: generateString(),
        },
      ],
      exports: [connectionProvider],
    };
  }

  async onApplicationShutdown() {
    const connection = this.moduleRef.get<Sequelize>(
      getConnectionToken(this.options as Options<Dialect>) as Type<Sequelize>,
    );
    if (connection) {
      await connection.close();
    }
  }

  private static createAsyncProviders<Dialect extends AbstractDialect>(
    options: SequelizeModuleAsyncOptions<Dialect>,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<SequelizeOptionsFactory<Dialect>>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider<Dialect extends AbstractDialect>(
    options: SequelizeModuleAsyncOptions<Dialect>,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: SEQUELIZE_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    // `as Type<SequelizeOptionsFactory>` is a workaround for microsoft/TypeScript#31603
    const inject = [
      (options.useClass ||
        options.useExisting) as Type<SequelizeOptionsFactory<Dialect>>,
    ];
    return {
      provide: SEQUELIZE_MODULE_OPTIONS,
      useFactory: async (optionsFactory: SequelizeOptionsFactory<Dialect>) =>
        await optionsFactory.createSequelizeOptions(options.name),
      inject,
    };
  }

  private static async createConnectionFactory<Dialect extends AbstractDialect>(
    options: SequelizeModuleOptions<Dialect>,
  ): Promise<Sequelize> {
    return lastValueFrom(
      defer(async () => {
        const keys = ['name', 'retryDelay','retryAttempts', 'autoLoadModels', 'synchronize'];
        const configure = Object.assign({}, options);
        keys.forEach(key => delete (configure as any)[key]);
        const sequelize = new Sequelize(configure as Options<Dialect>);
        
        if (!options.autoLoadModels) {
          return sequelize;
        }

        const connectionToken = options.name || DEFAULT_CONNECTION_NAME;
        const models =
          EntitiesMetadataStorage.getEntitiesByConnection(connectionToken);
        sequelize.addModels(models as any);

        await sequelize.authenticate();

        if (typeof options.synchronize === 'undefined' || options.synchronize) {
          await sequelize.sync(options.sync);
        }
        return sequelize;
      }).pipe(handleRetry(options.retryAttempts, options.retryDelay)),
    );
  }
}
