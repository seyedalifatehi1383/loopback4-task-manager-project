import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {NewUser, NewUserRelations, Task} from '../models';
import { User } from "@loopback/authentication-jwt";
import {TaskRepository} from './task.repository';

export class NewUserRepository extends DefaultCrudRepository<
  NewUser,
  typeof NewUser.prototype.id,
  NewUserRelations
> {

  public readonly tasks: HasManyRepositoryFactory<Task, typeof NewUser.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('TaskRepository') protected taskRepositoryGetter: Getter<TaskRepository>,
  ) {
    super(NewUser, dataSource);
    this.tasks = this.createHasManyRepositoryFactoryFor('tasks', taskRepositoryGetter,);
    this.registerInclusionResolver('tasks', this.tasks.inclusionResolver);
  }
}
