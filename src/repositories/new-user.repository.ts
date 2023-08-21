import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {NewUser, NewUserRelations, Task, Chat} from '../models';
import { User } from "@loopback/authentication-jwt";
import {TaskRepository} from './task.repository';
import {ChatRepository} from './chat.repository';

export class NewUserRepository extends DefaultCrudRepository<
  NewUser,
  typeof NewUser.prototype.id,
  NewUserRelations
> {

  public readonly tasks: HasManyRepositoryFactory<Task, typeof NewUser.prototype.id>;

  public readonly chats: HasManyRepositoryFactory<Chat, typeof NewUser.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('TaskRepository') protected taskRepositoryGetter: Getter<TaskRepository>, @repository.getter('ChatRepository') protected chatRepositoryGetter: Getter<ChatRepository>,
  ) {
    super(NewUser, dataSource);
    this.chats = this.createHasManyRepositoryFactoryFor('chats', chatRepositoryGetter,);
    this.registerInclusionResolver('chats', this.chats.inclusionResolver);
    this.tasks = this.createHasManyRepositoryFactoryFor('tasks', taskRepositoryGetter,);
    this.registerInclusionResolver('tasks', this.tasks.inclusionResolver);
  }
}
