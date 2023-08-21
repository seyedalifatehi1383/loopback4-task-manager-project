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

  @get('/new-users/{id}/tasks', {
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
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<Task>,
  ): Promise<Task[]> {
    return this.newUserRepository.tasks(id).find(filter);
  }

  @post('/new-users/{id}/tasks', {
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
            exclude: ['id' , 'newUserId'],
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
    if (currentUser.accessLevel == "Admin") {
      task.newUserId = id;
      return this.newUserRepository.tasks(id).create(task);

    }else if (currentUser.accessLevel == "SubAdmin") {
      const targetUser =await this.newUserRepository.findById(id)
      if (targetUser.accessLevel == "Admin" || targetUser.accessLevel == "SubAdmin") {
        throw new HttpErrors.Forbidden('SubAdmins can only  add task  for Users')
      } else {
        task.newUserId = id;
        return this.newUserRepository.tasks(id).create(task);
      }
    } else {
      throw new HttpErrors.Forbidden('Users can not add task')
    }

    // return currentUserProfile[securityId]
  }

  @patch('/new-users/{id}/tasks/{taskId}', {
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
            exclude : ['newUserId' , 'id']
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
      return this.newUserRepository.tasks(id).patch(task,{id : taskId});
    } else if(currentUser.accessLevel == "SubAdmin") {
      const targetUser = await this.newUserRepository.findById(id)
      if (targetUser.accessLevel == "User") {
        return this.newUserRepository.tasks(id).patch(task,{id : taskId});
      } else {
        throw new HttpErrors.Forbidden('Sub admin can only edit user\'s tasks')
      }
    }else{
      throw new HttpErrors.Forbidden('User can not edit tasks')
    }

  }

  @del('/new-users/{id}/tasks', {
    responses: {
      '200': {
        description: 'NewUser.Task DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Task)) where?: Where<Task>,
  ): Promise<Count> {
    return this.newUserRepository.tasks(id).delete(where);
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
    return {count : taskCount};
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
    return this.newUserRepository.tasks(currentUserProfile[securityId]).find({where : {isfinish : true}});
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
    return this.newUserRepository.tasks(currentUserProfile[securityId]).find({where : {isfinish : false}});
  }
}
