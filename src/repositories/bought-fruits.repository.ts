import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {BoughtFruits, BoughtFruitsRelations} from '../models';

export class BoughtFruitsRepository extends DefaultCrudRepository<
  BoughtFruits,
  typeof BoughtFruits.prototype.id,
  BoughtFruitsRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(BoughtFruits, dataSource);
  }
}
