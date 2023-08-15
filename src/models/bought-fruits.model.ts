import {Entity, model, property} from '@loopback/repository';

@model()
export class BoughtFruits extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  title: string;

  @property({
    type: 'number',
    required: true,
  })
  price: number;

  @property({
    type: 'string',
  })
  desc?: string;

  @property({
    type: 'number',
  })
  newUserId?: number;

  constructor(data?: Partial<BoughtFruits>) {
    super(data);
  }
}

export interface BoughtFruitsRelations {
  // describe navigational properties here
}

export type BoughtFruitsWithRelations = BoughtFruits & BoughtFruitsRelations;
