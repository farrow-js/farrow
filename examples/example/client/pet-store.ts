export type JsonType =
  | number
  | string
  | boolean
  | null
  | undefined
  | JsonType[]
  | {
      toJSON(): string
    }
  | {
      [key: string]: JsonType
    }

/**
 * {@label AddPetInput}
 */
export type AddPetInput = {
  /**
   * @remarks Pet object that needs to be added to the store
   */
  body: Pet
}

/**
 * {@label Pet}
 */
export type Pet = {
  id: number
  category: Category
  name: string
  photoUrls: string[]
  tags: Tag[]
  /**
   * @remarks pet status in the store
   */
  status: 'available' | 'pending' | 'Sold'
}

/**
 * {@label Category}
 */
export type Category = {
  id: number
  name: string
}

/**
 * {@label Tag}
 */
export type Tag = {
  id: number
  name: string
}

/**
 * {@label InvalidInput}
 */
export type InvalidInput = {
  type: 'InvalidInput'
}

/**
 * {@label AddPetOutput}
 */
export type AddPetOutput = {
  type: 'AddPetOutput'
  pet: Pet
}

/**
 * {@label UpdatePetInput}
 */
export type UpdatePetInput = {
  /**
   * @remarks Pet object that needs to be added to the store
   */
  body: Pet
}

/**
 * {@label InvalidIDSupplied}
 */
export type InvalidIDSupplied = {
  type: 'InvalidIDSupplied'
}

/**
 * {@label PetNotFound}
 */
export type PetNotFound = {
  type: 'PetNotFound'
}

/**
 * {@label ValidationException}
 */
export type ValidationException = {
  type: 'ValidationException'
}

/**
 * {@label UpdatePetOutput}
 */
export type UpdatePetOutput = {
  type: 'UpdatePetOutput'
  pet: Pet
}

/**
 * {@label DeletePetInput}
 */
export type DeletePetInput = {
  /**
   * @remarks ID of pet to delete
   */
  petId: number
}

/**
 * {@label DeletePetOutput}
 */
export type DeletePetOutput = {
  /**
   * @remarks ID of pet which was deleted
   */
  petId: number
}

/**
 * {@label FindPetByStatusInput}
 */
export type FindPetByStatusInput = {
  /**
   * @remarks Status values that need to be considered for filter
   */
  status: ('available' | 'pending' | 'Sold')[]
}

/**
 * {@label InvalidPetStatus}
 */
export type InvalidPetStatus = {
  type: 'InvalidPetStatus'
}

/**
 * {@label FindPetByStatusOutput}
 */
export type FindPetByStatusOutput = {
  type: 'FindPetByStatusOutput'
  pets: Pet[]
}

/**
 * {@label InvalidPetTagValue}
 */
export type InvalidPetTagValue = {
  type: 'InvalidPetTagValue'
}

/**
 * {@label GetPetByIdInput}
 */
export type GetPetByIdInput = {
  /**
   * @remarks ID of pet to return
   */
  petId: number
}

/**
 * {@label GetPetByIdOutput}
 */
export type GetPetByIdOutput = {
  pet: Pet
}

/**
 * {@label PlaceOrderInput}
 */
export type PlaceOrderInput = {
  /**
   * @remarks order placed for purchasing the pet
   */
  body: Order
}

/**
 * {@label Order}
 */
export type Order = {
  id: number
  petId: number
  quantity: number
  shipDate: number
  /**
   * @remarks Order Status
   */
  status: 'placed' | 'approved' | 'delivered'
  complete: boolean
}

/**
 * {@label InvalidOrder}
 */
export type InvalidOrder = {
  type: 'InvalidOrder'
}

/**
 * {@label PlaceOrderOutput}
 */
export type PlaceOrderOutput = {
  order: Order
}

/**
 * {@label GetOrderByIdInput}
 */
export type GetOrderByIdInput = {
  /**
   * @remarks ID of pet that needs to be fetched
   */
  orderId: number
}

/**
 * {@label OrderNotFound}
 */
export type OrderNotFound = {
  type: 'OrderNotFound'
}

/**
 * {@label GetOrderByIdOutput}
 */
export type GetOrderByIdOutput = {
  type: 'GetOrderByIdOutput'
  order: Order
}

/**
 * {@label DeleteOrderInput}
 */
export type DeleteOrderInput = {
  /**
   * @remarks ID of the order that needs to be deleted
   */
  orderId: number
}

/**
 * {@label DeleteOrderOutput}
 */
export type DeleteOrderOutput = {
  type: 'DeleteOrderOutput'
  /**
   * @remarks ID of the order that was deleted
   */
  orderId: number
}

/**
 * {@label GetInventoryOutput}
 */
export type GetInventoryOutput = {
  inventory: Record<string, number>
}

/**
 * {@label CreateUsersWithArrayInput}
 */
export type CreateUsersWithArrayInput = {
  /**
   * @remarks List of user object
   */
  body: User[]
}

/**
 * {@label User}
 */
export type User = {
  id: number
  userName: string
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  /**
   * @remarks User Status
   */
  userStatus: number
}

/**
 * {@label CreateUsersWithArrayOutput}
 */
export type CreateUsersWithArrayOutput = {
  users: User[]
}

/**
 * {@label GetUserByNameInput}
 */
export type GetUserByNameInput = {
  /**
   * @remarks The name that needs to be fetched. Use user1 for testing.
   */
  username: string
}

/**
 * {@label InvalidUserSupplied}
 */
export type InvalidUserSupplied = {
  type: 'InvalidUserSupplied'
}

/**
 * {@label UserNotFound}
 */
export type UserNotFound = {
  type: 'UserNotFound'
}

/**
 * {@label GetUserByNameOutput}
 */
export type GetUserByNameOutput = {
  type: 'GetUserByNameOutput'
  user: User
}

/**
 * {@label UpdateUserInput}
 */
export type UpdateUserInput = {
  /**
   * @remarks name that need to be updated
   */
  username: string
  /**
   * @remarks Updated user object
   */
  body: User
}

/**
 * {@label UpdateUserOutput}
 */
export type UpdateUserOutput = {
  type: 'UpdateUserOutput'
  user: User
}

/**
 * {@label DeleteUserInput}
 */
export type DeleteUserInput = {
  /**
   * @remarks The name that needs to be deleted
   */
  username: string
}

/**
 * {@label DeleteUserOutput}
 */
export type DeleteUserOutput = {
  type: 'DeleteUserOutput'
  /**
   * @remarks The name that needs to be deleted
   */
  username: string
}

/**
 * {@label LoginUserInput}
 */
export type LoginUserInput = {
  /**
   * @remarks The user name for login
   */
  username: string
  /**
   * @remarks The password for login in clear text
   */
  password: string
}

/**
 * {@label InvalidUsernameSupplied}
 */
export type InvalidUsernameSupplied = {
  type: 'InvalidUsernameSupplied'
}

/**
 * {@label InvalidPasswordSupplied}
 */
export type InvalidPasswordSupplied = {
  type: 'InvalidPasswordSupplied'
}

/**
 * {@label LoginUserOutput}
 */
export type LoginUserOutput = {
  /**
   * @remarks login user
   */
  user: User
}

/**
 * {@label CreateUserInput}
 */
export type CreateUserInput = {
  /**
   * @remarks Created user object
   */
  body: User
}

/**
 * {@label CreateUserOutput}
 */
export type CreateUserOutput = {
  type: 'CreateUserOutput'
  user: User
}

export type CreateApiClientOptions = {
  /**
   * a fetcher for api-client
   */
  fetcher: (input: { path: string[]; input: JsonType }) => Promise<JsonType>
}

export const createApiClient = (options: CreateApiClientOptions) => {
  return {
    pet: {
      /**
       * @remarks Add a new pet to the store
       */
      addPet: (input: AddPetInput) =>
        options.fetcher({ path: ['pet', 'addPet'], input }) as Promise<InvalidInput | AddPetOutput>,
      /**
       * @remarks Update an existing pet
       */
      updatePet: (input: UpdatePetInput) =>
        options.fetcher({ path: ['pet', 'updatePet'], input }) as Promise<
          InvalidIDSupplied | PetNotFound | ValidationException | UpdatePetOutput
        >,
      /**
       * @remarks Deletes a pet
       */
      deletePet: (input: DeletePetInput) =>
        options.fetcher({ path: ['pet', 'deletePet'], input }) as Promise<
          InvalidIDSupplied | PetNotFound | DeletePetOutput
        >,
      /**
       * @remarks Finds Pets by status
       *
       * Multiple status values can be provided with comma separated strings
       */
      findPetByStatus: (input: FindPetByStatusInput) =>
        options.fetcher({ path: ['pet', 'findPetByStatus'], input }) as Promise<
          InvalidPetStatus | FindPetByStatusOutput
        >,
      /**
       * @remarks Finds Pets by tags
       *
       * Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
       */
      findPetsByTags: (input: FindPetByStatusInput) =>
        options.fetcher({ path: ['pet', 'findPetsByTags'], input }) as Promise<
          InvalidPetTagValue | FindPetByStatusOutput
        >,
      /**
       * @remarks Find pet by ID
       *
       * Returns a single pet
       */
      getPetById: (input: GetPetByIdInput) =>
        options.fetcher({ path: ['pet', 'getPetById'], input }) as Promise<
          InvalidIDSupplied | PetNotFound | GetPetByIdOutput
        >,
    },
    store: {
      /**
       * @remarks Place an order for a pet
       */
      placeOrder: (input: PlaceOrderInput) =>
        options.fetcher({ path: ['store', 'placeOrder'], input }) as Promise<InvalidOrder | PlaceOrderOutput>,
      /**
       * @remarks Find purchase order by ID
       *
       * For valid response try integer IDs with value >= 1 and <= 10. Other values will generated exceptions
       */
      getOrderById: (input: GetOrderByIdInput) =>
        options.fetcher({ path: ['store', 'getOrderById'], input }) as Promise<
          InvalidIDSupplied | OrderNotFound | GetOrderByIdOutput
        >,
      /**
       * @remarks Delete purchase order by ID
       *
       * For valid response try integer IDs with positive integer value. Negative or non-integer values will generate API errors
       */
      deleteOrder: (input: DeleteOrderInput) =>
        options.fetcher({ path: ['store', 'deleteOrder'], input }) as Promise<
          InvalidIDSupplied | OrderNotFound | DeleteOrderOutput
        >,
      /**
       * @remarks Returns pet inventories by status
       *
       * Returns a map of status codes to quantities
       */
      getInventory: (input: {}) =>
        options.fetcher({ path: ['store', 'getInventory'], input }) as Promise<GetInventoryOutput>,
    },
    user: {
      /**
       * @remarks Creates list of users with given input array
       */
      createUsersWithArray: (input: CreateUsersWithArrayInput) =>
        options.fetcher({ path: ['user', 'createUsersWithArray'], input }) as Promise<CreateUsersWithArrayOutput>,
      /**
       * @remarks Get user by user name
       */
      getUserByName: (input: GetUserByNameInput) =>
        options.fetcher({ path: ['user', 'getUserByName'], input }) as Promise<
          InvalidUserSupplied | UserNotFound | GetUserByNameOutput
        >,
      /**
       * @remarks Updated user
       *
       * This can only be done by the logged in user.
       */
      updateUser: (input: UpdateUserInput) =>
        options.fetcher({ path: ['user', 'updateUser'], input }) as Promise<
          InvalidUserSupplied | UserNotFound | UpdateUserOutput
        >,
      /**
       * @remarks Delete user
       *
       * This can only be done by the logged in user.
       */
      deleteUser: (input: DeleteUserInput) =>
        options.fetcher({ path: ['user', 'deleteUser'], input }) as Promise<DeleteUserOutput>,
      /**
       * @remarks Logs user into the system
       */
      loginUser: (input: LoginUserInput) =>
        options.fetcher({ path: ['user', 'loginUser'], input }) as Promise<
          InvalidUsernameSupplied | InvalidPasswordSupplied | LoginUserOutput
        >,
      /**
       * @remarks Logs out current logged in user session
       */
      logoutUser: (input: {}) =>
        options.fetcher({ path: ['user', 'logoutUser'], input }) as Promise<{
          username: string
        }>,
      /**
       * @remarks Create user
       *
       * This can only be done by the logged in user.
       * @param input - user input
       * @returns user output
       */
      createUser: (input: CreateUserInput) =>
        options.fetcher({ path: ['user', 'createUser'], input }) as Promise<CreateUserOutput>,
    },
  }
}
