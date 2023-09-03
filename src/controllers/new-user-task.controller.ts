import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  NewUser,
  Task,
} from '../models';
import {NewUserRepository} from '../repositories';

import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {User} from '@loopback/authentication-jwt';

@authenticate('jwt')
export class NewUserTaskController {
  constructor(
    @repository(NewUserRepository) protected newUserRepository: NewUserRepository,
  ) { }

  // @get('/new-users/{id}/tasks', {
  //   responses: {
  //     '200': {
  //       description: 'Array of NewUser has many Task',
  //       content: {
  //         'application/json': {
  //           schema: {type: 'array', items: getModelSchemaRef(Task)},
  //         },
  //       },
  //     },
  //   },
  // })
  // async find(
  //   @param.path.string('id') id: string,
  //   @param.query.object('filter') filter?: Filter<Task>,
  // ): Promise<Task[]> {
  //   return this.newUserRepository.tasks(id).find(filter);
  // }

  @post('/AdminOrSubAdmin/{id}/tasks', {
    responses: {
      '200': {
        description: 'NewUser model instance',
        content: {'application/json': {schema: getModelSchemaRef(Task)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof NewUser.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            title: 'NewTaskInNewUser',
            exclude: ['id', 'newUserId', 'isfinish'],
            // optional: ['newUserId']
          }),
        },
      },
    }) task: Omit<Task, 'id'>,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<any> {
    const currentId = currentUserProfile[securityId]
    const currentUser = await this.newUserRepository.findById(currentId)
    const already = await this.newUserRepository.tasks(id).find({where: {title: task.title}})
    if (currentUser.accessLevel == "Admin") {
      if (already.length == 0) {
        task.isfinish = false
        task.newUserId = id;
        return this.newUserRepository.tasks(id).create(task);
      } else {
        throw new HttpErrors.Conflict('this task already exists for this user')
      }

    } else if (currentUser.accessLevel == "SubAdmin") {
      if (already.length == 0) {
        const targetUser = await this.newUserRepository.findById(id)
        if (targetUser.accessLevel == "Admin" || targetUser.accessLevel == "SubAdmin") {
          throw new HttpErrors.Forbidden('SubAdmins can only  add task  for Users')
        } else {
          task.isfinish = false
          task.newUserId = id;
          return this.newUserRepository.tasks(id).create(task);
        }
      } else {
        throw new HttpErrors.Conflict('this task already exits for this user')
      }
    } else {
      throw new HttpErrors.Forbidden('Users can not add task')
    }

    // return currentUserProfile[securityId]
  }

  @patch('/AdminOrSubAdmin/{id}/tasks/{taskId}', {
    responses: {
      '200': {
        description: 'NewUser.Task PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @param.path.number('taskId') taskId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            partial: true,
            exclude: ['newUserId', 'id', 'isfinish']
          }),
        },
      },
    })
    task: Partial<Task>,
    // @param.query.object('where', getWhereSchemaFor(Task)) where?: Where<Task>,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<Count | undefined> {
    const currentId = currentUserProfile[securityId]
    const currentUser = await this.newUserRepository.findById(currentId)
    if (currentUser.accessLevel == "Admin") {
      return this.newUserRepository.tasks(id).patch(task, {id: taskId});
    } else if (currentUser.accessLevel == "SubAdmin") {
      const targetUser = await this.newUserRepository.findById(id)
      if (targetUser.accessLevel == "User") {
        return this.newUserRepository.tasks(id).patch(task, {id: taskId});
      } else {
        throw new HttpErrors.Forbidden('Sub admin can only edit user\'s tasks')
      }
    } else {
      throw new HttpErrors.Forbidden('User can not edit tasks')
    }

  }


  // this patch is for user that alarm other that his or her task
  @patch('/new-users/completeTask/{taskId}', {
    responses: {
      '200': {
        description: 'NewUser.Task PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async userAlarm(
    @param.path.number('taskId') taskId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            partial: true,
            exclude: ['desc', 'title', 'id', 'newUserId']

          }),
        },
      },
    })
    task: Partial<Task>,
    // @param.query.object('where', getWhereSchemaFor(Task)) where?: Where<Task>,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<any> {
    return await this.newUserRepository.tasks(currentUserProfile[securityId]).patch(task, {id: taskId})
  }
  // ------------------------------------------------------------

  @del('/Admin/{userId}/task/{taskId}', {
    responses: {
      '200': {
        description: 'NewUser.Task DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('userId') userId: string,
    @param.path.number('taskId') taskId: number,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<Count> {
    const currentUser = await this.newUserRepository.findById(currentUserProfile[securityId])
    if (currentUser.accessLevel == "Admin") {
      return this.newUserRepository.tasks(userId).delete({id: taskId})

    } else {
      if (currentUser.accessLevel == "SubAdmin") {
        const targetUser = await this.newUserRepository.findById(userId)

        if (targetUser.accessLevel == "User") {
          return this.newUserRepository.tasks(userId).delete({id: taskId})
        }

        else {
          throw new HttpErrors.Forbidden('You can only remove users tasks')
        }
      }

      else {
        throw new HttpErrors.Forbidden('Just Admin and sub admins have access to this route')
      }
    }
  }

  @get('/new-users/myTaskCount', {
    responses: {
      '200': {
        description: 'Array of NewUser has many Task',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Task)},
          },
        },
      },
    },
  })
  async findCount(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<Count> {
    const taskCount = (await this.newUserRepository.tasks(currentUserProfile[securityId]).find()).length
    return {count: taskCount};
  }


  @get('/new-users/myFinished', {
    responses: {
      '200': {
        description: 'Array of NewUser has many Task',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Task)},
          },
        },
      },
    },
  })
  async findFinish(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<Task[]> {
    return this.newUserRepository.tasks(currentUserProfile[securityId]).find({where: {isfinish: true}});
  }


  @get('/new-users/myNotFinished', {
    responses: {
      '200': {
        description: 'Array of NewUser has many Task',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Task)},
          },
        },
      },
    },
  })
  async findNotFinish(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<Task[]> {
    return this.newUserRepository.tasks(currentUserProfile[securityId]).find({where: {isfinish: false}});
  }

  // admin can see the tasks of all of the users and subAdmins
  // sub admin can see the tasks of all of the users
  @get('/AdminOrSubAdmin/{userId}/task', {
    responses: {
      '200': {
        description: 'Array of NewUser has many Task',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Task)},
          },
        },
      },
    },
  })
  async findAllUsersTasks(
    @param.path.string('userId') userId: string,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<any> {
    const currentUser = await this.newUserRepository.findById(currentUserProfile[securityId])
    const targetUser = await this.newUserRepository.findById(userId)

    if (currentUser.accessLevel == "User")
      throw new HttpErrors.Forbidden('you cannot access to this route')

    if (targetUser.accessLevel == "Admin")
      throw new HttpErrors.Forbidden('you cannot see your own tasks here, you can see them in \'myTasks\' route instead')

    if ((targetUser.accessLevel == "SubAdmin" || targetUser.accessLevel == "Admin") && currentUser.accessLevel == "SubAdmin")
      throw new HttpErrors.Forbidden('sub admins can only see users tasks')

    return this.newUserRepository.tasks(userId).find();
  }

  // subAdmins can see the task of the users
  @get('/subAdmin/{userId}/task', {
    responses: {
      '200': {
        description: 'Array of NewUser has many Task',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Task)},
          },
        },
      },
    },
  })
  async findUsersTasks(
    @param.path.string('userId') userId: string,
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<any> {
    const currentUser = await this.newUserRepository.findById(currentUserProfile[securityId])
    const targetUser = await this.newUserRepository.findById(userId)

    if (currentUser.accessLevel != "SubAdmin") throw new HttpErrors.Forbidden('you cannot access to this route')
    if (targetUser.accessLevel == "Admin") throw new HttpErrors.Forbidden('you haven\'t access to the admin\'s tasks')
    if (targetUser.accessLevel == "SubAdmin") throw new HttpErrors.Forbidden('you cannot see your own tasks here, you can see them in \'myTasks\' route instead')

    return this.newUserRepository.tasks(userId).find();
  }

  // all of the users and subAdmins and admin can see their own tasks
  @get('/myTasks', {
    responses: {
      '200': {
        description: 'Array of NewUser has many Task',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Task)},
          },
        },
      },
    },
  })
  async findMyTasks(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<any> {
    return this.newUserRepository.tasks(currentUserProfile[securityId]).find();
  }
}
