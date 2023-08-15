import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {NewUser, NewUserRelations} from '../models';

export class NewUserRepository extends DefaultCrudRepository<
  NewUser,
  typeof NewUser.prototype.id,
  NewUserRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(NewUser, dataSource);
  }
}
