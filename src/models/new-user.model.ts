import {Entity, model, property} from '@loopback/repository';
import { User } from "@loopback/authentication-jwt";
@model()
export class NewUser extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  @property({
    type: 'string',
    required: true,
  })
  username: string;


  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @property({
    type: 'string',
    required: true,
  })
  accessLevel: string;


  constructor(data?: Partial<NewUser>) {
    super(data);
  }
}

export interface NewUserRelations {
  // describe navigational properties here
}

export type NewUserWithRelations = NewUser & NewUserRelations;
