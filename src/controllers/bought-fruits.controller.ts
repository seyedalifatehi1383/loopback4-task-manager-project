import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {BoughtFruits} from '../models';
import {BoughtFruitsRepository} from '../repositories';

export class BoughtFruitsController {
  constructor(
    @repository(BoughtFruitsRepository)
    public boughtFruitsRepository : BoughtFruitsRepository,
  ) {}

  @post('/bought-fruits')
  @response(200, {
    description: 'BoughtFruits model instance',
    content: {'application/json': {schema: getModelSchemaRef(BoughtFruits)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(BoughtFruits, {
            title: 'NewBoughtFruits',
            exclude: ['id'],
          }),
        },
      },
    })
    boughtFruits: Omit<BoughtFruits, 'id'>,
  ): Promise<BoughtFruits> {
    return this.boughtFruitsRepository.create(boughtFruits);
  }

  @get('/bought-fruits/count')
  @response(200, {
    description: 'BoughtFruits model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(BoughtFruits) where?: Where<BoughtFruits>,
  ): Promise<Count> {
    return this.boughtFruitsRepository.count(where);
  }

  @get('/bought-fruits')
  @response(200, {
    description: 'Array of BoughtFruits model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(BoughtFruits, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(BoughtFruits) filter?: Filter<BoughtFruits>,
  ): Promise<BoughtFruits[]> {
    return this.boughtFruitsRepository.find(filter);
  }

  @patch('/bought-fruits')
  @response(200, {
    description: 'BoughtFruits PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(BoughtFruits, {partial: true}),
        },
      },
    })
    boughtFruits: BoughtFruits,
    @param.where(BoughtFruits) where?: Where<BoughtFruits>,
  ): Promise<Count> {
    return this.boughtFruitsRepository.updateAll(boughtFruits, where);
  }

  @get('/bought-fruits/{id}')
  @response(200, {
    description: 'BoughtFruits model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(BoughtFruits, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(BoughtFruits, {exclude: 'where'}) filter?: FilterExcludingWhere<BoughtFruits>
  ): Promise<BoughtFruits> {
    return this.boughtFruitsRepository.findById(id, filter);
  }

  @patch('/bought-fruits/{id}')
  @response(204, {
    description: 'BoughtFruits PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(BoughtFruits, {partial: true}),
        },
      },
    })
    boughtFruits: BoughtFruits,
  ): Promise<void> {
    await this.boughtFruitsRepository.updateById(id, boughtFruits);
  }

  @put('/bought-fruits/{id}')
  @response(204, {
    description: 'BoughtFruits PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() boughtFruits: BoughtFruits,
  ): Promise<void> {
    await this.boughtFruitsRepository.replaceById(id, boughtFruits);
  }

  @del('/bought-fruits/{id}')
  @response(204, {
    description: 'BoughtFruits DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.boughtFruitsRepository.deleteById(id);
  }
}
