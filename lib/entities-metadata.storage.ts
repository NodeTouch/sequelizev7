import { AbstractDialect } from '@sequelize/core';
import { SequelizeModuleOptions } from './interfaces';

type ConnectionToken<Dialect extends AbstractDialect> = SequelizeModuleOptions<Dialect> | string;

export class EntitiesMetadataStorage {
  private static readonly storage = new Map<string, Function[]>();

  static addEntitiesByConnection<Dialect extends AbstractDialect>(
    connection: ConnectionToken<Dialect>,
    entities: Function[],
  ) {
    const connectionToken =
      typeof connection === 'string' ? connection : connection.name;
    if (!connectionToken) {
      return;
    }

    let collection = this.storage.get(connectionToken);
    if (!collection) {
      collection = [];
      this.storage.set(connectionToken, collection);
    }
    entities.forEach((entity) => {
      if (collection.includes(entity)) {
        return;
      }
      collection.push(entity);
    });
  }

  static getEntitiesByConnection<Dialect extends AbstractDialect>(connection: ConnectionToken<Dialect>): Function[] {
    const connectionToken =
      typeof connection === 'string' ? connection : connection.name;

    if (!connectionToken) {
      return [];
    }
    return this.storage.get(connectionToken) || [];
  }
}
