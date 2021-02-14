import { Int, List, Literal, ObjectType, Struct, Type, TypeOf, Union } from 'farrow-schema'
import { Api, ApiEntries } from 'farrow-api'
import { ApiService } from 'farrow-api-server'

/**
 * Error Types
 */
export class InvalidInput extends ObjectType {
  type = Literal('InvalidInput')
}
export class InvalidIDSupplied extends ObjectType {
  type = Literal('InvalidIDSupplied')
}

export class PetNotFound extends ObjectType {
  type = Literal('PetNotFound')
}

export class ValidationException extends ObjectType {
  type = Literal('ValidationException')
}

export class InvalidPetStatus extends ObjectType {
  type = Literal('InvalidPetStatus')
}

export class InvalidPetTagValue extends ObjectType {
  type = Literal('InvalidPetTagValue')
}

/**
 * Model Types
 */

export class Category extends ObjectType {
  id = Int
  name = String
}

export class Tag extends ObjectType {
  id = Int
  name = String
}

export const PetStatus = Union(Literal('available'), Literal('pending'), Literal('Sold'))

export class Pet extends ObjectType {
  id = Int
  category = Category
  name = String
  photoUrls = List(String)
  tags = List(Tag)
  status = {
    description: 'pet status in the store',
    [Type]: PetStatus,
  }
}

export const OrderStatus = Union(Literal('placed'), Literal('approved'), Literal('delivered'))

export class Order extends ObjectType {
  id = Int
  petId = Int
  quantity = Int
  shipDate = Int
  status = {
    description: 'Order Status',
    [Type]: OrderStatus,
  }
  complete = Boolean
}

export class User extends ObjectType {
  id = Int
  userName = String
  firstName = String
  lastName = String
  email = String
  password = String
  phone = String
  userStatus = {
    description: 'User Status',
    [Type]: Int,
  }
}

/**
 * Input/Output Types
 */

export class AddPetInput extends ObjectType {
  body = {
    description: 'Pet object that needs to be added to the store',
    [Type]: Pet,
  }
}

export class AddPetOutput extends ObjectType {
  type = Literal('AddPetOutput')
  pet = Pet
}

export const addPet = Api(
  {
    description: 'Add a new pet to the store',
    input: AddPetInput,
    output: Union(InvalidInput, AddPetOutput),
  },
  (input) => {
    throw new Error('No Implementation')
  },
)

export class UpdatePetInput extends ObjectType {
  body = {
    description: 'Pet object that needs to be added to the store',
    [Type]: Pet,
  }
}

export class UpdatePetOutput extends ObjectType {
  type = Literal('UpdatePetOutput')
  pet = Pet
}

export const updatePet = Api(
  {
    description: 'Update an existing pet',
    input: UpdatePetInput,
    output: Union(InvalidIDSupplied, PetNotFound, ValidationException, UpdatePetOutput),
  },
  (input) => {
    throw new Error('No Implementation')
  },
)

export class FindPetByStatusInput extends ObjectType {
  status = {
    description: 'Status values that need to be considered for filter',
    [Type]: List(PetStatus),
  }
}

export class FindPetByStatusOutput extends ObjectType {
  type = Literal('FindPetByStatusOutput')
  pets = List(Pet)
}

export const findPetByStatus = Api(
  {
    description: `
    Finds Pets by status
    Multiple status values can be provided with comma separated strings
    `,
    input: FindPetByStatusInput,
    output: Union(InvalidPetStatus, FindPetByStatusOutput),
  },
  (input) => {
    throw new Error('No Implementation')
  },
)

export class FindPetsByTagsInput extends ObjectType {
  tags = {
    description: 'Tags to filter by',
    [Type]: List({
      type: String,
    }),
  }
}

export class FindPetsByTagsOutput extends ObjectType {
  type = Literal('FindPetsByTagsOutput')
  pets = {
    description: 'successful operation',
    [Type]: List(Pet),
  }
}

export const findPetsByTags = Api(
  {
    description: `
    Finds Pets by tags
    Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
  `,
    input: FindPetByStatusInput,
    output: Union(InvalidPetTagValue, FindPetByStatusOutput),
  },
  (input) => {
    throw new Error('No Implementation')
  },
)

export class GetPetByIdInput extends ObjectType {
  petId = {
    description: `ID of pet to return`,
    [Type]: Int,
  }
}

export class GetPetByIdOutput extends ObjectType {
  pet = Pet
}

export const getPetById = Api(
  {
    description: `
  Find pet by ID
  Returns a single pet
  `,
    input: GetPetByIdInput,
    output: Union(InvalidIDSupplied, PetNotFound, GetPetByIdOutput),
  },
  (input) => {
    throw new Error('No Implementation')
  },
)

export const entries = {
  addPet,
  updatePet,
  findPetByStatus,
  findPetsByTags,
  getPetById,
}

export const service = ApiService({
  entries,
})
