import { Int, List, Literal, ObjectType, Record, Struct, Type, TypeOf, Union } from 'farrow-schema'
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

export class InvalidOrder extends ObjectType {
  type = Literal('InvalidOrder')
}

export class OrderNotFound extends ObjectType {
  type = Literal('OrderNotFound')
}

export class InvalidUserSupplied extends ObjectType {
  type = Literal('InvalidUserSupplied')
}

export class UserNotFound extends ObjectType {
  type = Literal('UserNotFound')
}

export class InvalidUsernameSupplied extends ObjectType {
  type = Literal('InvalidUsernameSupplied')
}

export class InvalidPasswordSupplied extends ObjectType {
  type = Literal('InvalidPasswordSupplied')
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
  (_input) => {
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
  (_input) => {
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
  (_input) => {
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
  (_input) => {
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
  (_input) => {
    throw new Error('No Implementation')
  },
)

export class DeletePetInput extends ObjectType {
  petId = {
    description: `ID of pet to delete`,
    [Type]: Int,
  }
}

export class DeletePetOutput extends ObjectType {
  petId = {
    description: `ID of pet which was deleted`,
    [Type]: Int,
  }
}

export const deletePet = Api(
  {
    description: 'Deletes a pet',
    input: DeletePetInput,
    output: Union(InvalidIDSupplied, PetNotFound, DeletePetOutput),
  },
  (_input) => {
    throw new Error('No Implementation')
  },
)

export class PlaceOrderInput extends ObjectType {
  body = {
    description: 'order placed for purchasing the pet',
    [Type]: Order,
  }
}

export class PlaceOrderOutput extends ObjectType {
  order = {
    [Type]: Order,
  }
}

export const placeOrder = Api(
  {
    description: 'Place an order for a pet',
    input: PlaceOrderInput,
    output: Union(InvalidOrder, PlaceOrderOutput),
  },
  (_input) => {
    throw new Error('No Implementation')
  },
)

export class GetOrderByIdInput extends ObjectType {
  orderId = {
    description: 'ID of pet that needs to be fetched',
    [Type]: Int,
  }
}

export class GetOrderByIdOutput extends ObjectType {
  type = Literal('GetOrderByIdOutput')
  order = {
    [Type]: Order,
  }
}

export const getOrderById = Api(
  {
    description: `
  Find purchase order by ID
  For valid response try integer IDs with value >= 1 and <= 10. Other values will generated exceptions
  `,
    input: GetOrderByIdInput,
    output: Union(InvalidIDSupplied, OrderNotFound, GetOrderByIdOutput),
  },
  (_input) => {
    throw new Error('No Implementation')
  },
)

export class DeleteOrderInput extends ObjectType {
  orderId = {
    description: 'ID of the order that needs to be deleted',
    [Type]: Int,
  }
}

export class DeleteOrderOutput extends ObjectType {
  type = Literal('DeleteOrderOutput')
  orderId = {
    description: 'ID of the order that was deleted',
    [Type]: Int,
  }
}

export const deleteOrder = Api(
  {
    description: `
  Delete purchase order by ID
  For valid response try integer IDs with positive integer value. Negative or non-integer values will generate API errors
  `,
    input: DeleteOrderInput,
    output: Union(InvalidIDSupplied, OrderNotFound, DeleteOrderOutput),
  },
  (_input) => {
    throw new Error('No Implementation')
  },
)

export class GetInventoryOutput extends ObjectType {
  inventory = {
    description: '',
    [Type]: Record(Int),
  }
}

export const getInventory = Api(
  {
    description: `
  Returns pet inventories by status
  Returns a map of status codes to quantities
  `,
    input: {},
    output: GetInventoryOutput,
  },
  (_input) => {
    throw new Error('No Implementation')
  },
)

export class CreateUsersWithArrayInput extends ObjectType {
  body = {
    description: 'List of user object',
    [Type]: List(User),
  }
}

export class CreateUsersWithArrayOutput extends ObjectType {
  users = {
    [Type]: List(User),
  }
}

export const createUsersWithArray = Api(
  {
    description: `Creates list of users with given input array`,
    input: CreateUsersWithArrayInput,
    output: CreateUsersWithArrayOutput,
  },
  (_input) => {
    throw new Error('No Implementation')
  },
)

export class GetUserByNameInput extends ObjectType {
  username = {
    description: 'The name that needs to be fetched. Use user1 for testing.',
    [Type]: String,
  }
}

export class GetUserByNameOutput extends ObjectType {
  type = Literal('GetUserByNameOutput')
  user = User
}

export const getUserByName = Api(
  {
    description: 'Get user by user name',
    input: GetUserByNameInput,
    output: Union(InvalidUserSupplied, UserNotFound, GetUserByNameOutput),
  },
  (_input) => {
    throw new Error('No Implementation')
  },
)

export class UpdateUserInput extends ObjectType {
  username = {
    description: 'name that need to be updated',
    [Type]: String,
  }
  body = {
    description: 'Updated user object',
    [Type]: User,
  }
}

export class UpdateUserOutput extends ObjectType {
  type = Literal('UpdateUserOutput')
  user = User
}

export const updateUser = Api(
  {
    description: `
    Updated user
    This can only be done by the logged in user.
  `,
    input: UpdateUserInput,
    output: Union(InvalidUserSupplied, UserNotFound, UpdateUserOutput),
  },
  (_input) => {
    throw new Error('No Implementation')
  },
)

export class DeleteUserInput extends ObjectType {
  username = {
    description: 'The name that needs to be deleted',
    [Type]: String,
  }
}

export class DeleteUserOutput extends ObjectType {
  type = Literal('DeleteUserOutput')
  username = {
    description: 'The name that needs to be deleted',
    [Type]: String,
  }
}

export const deleteUser = Api(
  {
    description: `
    Delete user
    This can only be done by the logged in user.
  `,
    input: DeleteUserInput,
    output: DeleteUserOutput,
  },
  (_input) => {
    throw new Error('No Implementation')
  },
)

export class LoginUserInput extends ObjectType {
  username = {
    description: 'The user name for login',
    [Type]: String,
  }
  password = {
    description: 'The password for login in clear text',
    [Type]: String,
  }
}

export class LoginUserOutput extends ObjectType {
  user = {
    description: 'login user',
    [Type]: User,
  }
}

export const loginUser = Api(
  {
    description: `
    Logs user into the system
  `,
    input: LoginUserInput,
    output: Union(InvalidUsernameSupplied, InvalidPasswordSupplied, LoginUserOutput),
  },
  (_input) => {
    throw new Error('No Implementation')
  },
)

export const logoutUser = Api(
  {
    description: 'Logs out current logged in user session',
    input: {},
    output: {
      username: String,
    },
  },
  (_input) => {
    throw new Error('No Implementation')
  },
)

export class CreateUserInput extends ObjectType {
  body = {
    description: 'Created user object',
    [Type]: User,
  }
}

export class CreateUserOutput extends ObjectType {
  type = Literal('CreateUserOutput')

  user = User
}

export const createUser = Api(
  {
    description: `
    Create user
    This can only be done by the logged in user.
  `,
    input: {
      description: 'user input',
      [Type]: CreateUserInput,
    },
    output: {
      description: 'user output',
      [Type]: CreateUserOutput,
    },
  },
  (_input) => {
    throw new Error('No Implementation')
  },
)

export const entries = {
  pet: {
    addPet,
    updatePet,
    deletePet,
    findPetByStatus,
    findPetsByTags,
    getPetById,
  },
  store: {
    placeOrder,
    getOrderById,
    deleteOrder,
    getInventory,
  },
  user: {
    createUsersWithArray,
    getUserByName,
    updateUser,
    deleteUser,
    loginUser,
    logoutUser,
    createUser,
  },
}

export const service = ApiService({
  entries,
})
