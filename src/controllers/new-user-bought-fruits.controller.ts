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
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  NewUser,
  BoughtFruits,
} from '../models';
import {NewUserRepository} from '../repositories';

export class NewUserBoughtFruitsController {
  constructor(
    @repository(NewUserRepository) protected newUserRepository: NewUserRepository,
  ) { }

  @get('/new-users/{id}/bought-fruits', {
    responses: {
      '200': {
        description: 'Array of NewUser has many BoughtFruits',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(BoughtFruits)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<BoughtFruits>,
  ): Promise<BoughtFruits[]> {
    return this.newUserRepository.boughtFruits(id).find(filter);
  }

  @post('/new-users/{id}/bought-fruits', {
    responses: {
      '200': {
        description: 'NewUser model instance',
        content: {'application/json': {schema: getModelSchemaRef(BoughtFruits)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof NewUser.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(BoughtFruits, {
            title: 'NewBoughtFruitsInNewUser',
            exclude: ['id'],
            optional: ['newUserId']
          }),
        },
      },
    }) boughtFruits: Omit<BoughtFruits, 'id'>,
  ): Promise<BoughtFruits> {
    return this.newUserRepository.boughtFruits(id).create(boughtFruits);
  }

  @patch('/new-users/{id}/bought-fruits', {
    responses: {
      '200': {
        description: 'NewUser.BoughtFruits PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(BoughtFruits, {partial: true}),
        },
      },
    })
    boughtFruits: Partial<BoughtFruits>,
    @param.query.object('where', getWhereSchemaFor(BoughtFruits)) where?: Where<BoughtFruits>,
  ): Promise<Count> {
    return this.newUserRepository.boughtFruits(id).patch(boughtFruits, where);
  }

  @del('/new-users/{id}/bought-fruits', {
    responses: {
      '200': {
        description: 'NewUser.BoughtFruits DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(BoughtFruits)) where?: Where<BoughtFruits>,
  ): Promise<Count> {
    return this.newUserRepository.boughtFruits(id).delete(where);
  }
}
