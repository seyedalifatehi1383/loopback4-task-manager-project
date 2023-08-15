import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {NewUser, NewUserRelations, BoughtFruits} from '../models';
import {BoughtFruitsRepository} from './bought-fruits.repository';

export class NewUserRepository extends DefaultCrudRepository<
  NewUser,
  typeof NewUser.prototype.id,
  NewUserRelations
> {

  public readonly boughtFruits: HasManyRepositoryFactory<BoughtFruits, typeof NewUser.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('BoughtFruitsRepository') protected boughtFruitsRepositoryGetter: Getter<BoughtFruitsRepository>,
  ) {
    super(NewUser, dataSource);
    this.boughtFruits = this.createHasManyRepositoryFactoryFor('boughtFruits', boughtFruitsRepositoryGetter,);
    this.registerInclusionResolver('boughtFruits', this.boughtFruits.inclusionResolver);
  }
}
