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

export type CreateApiClientOptions = {
  /**
   * a fetcher for api-client
   */
  fetcher: (input: { path: string[]; input: JsonType }) => Promise<JsonType>
}

export const createApiClient = (options: CreateApiClientOptions) => {
  return {
    /**
     * @remarks Add a new pet to the store
     * @param input - AddPetInput
     * @returns InvalidInput | AddPetOutput
     */
    addPet: (input: AddPetInput) =>
      options.fetcher({ path: ['addPet'], input }) as Promise<InvalidInput | AddPetOutput>,
    /**
     * @remarks Update an existing pet
     * @param input - UpdatePetInput
     * @returns InvalidIDSupplied | PetNotFound | ValidationException | UpdatePetOutput
     */
    updatePet: (input: UpdatePetInput) =>
      options.fetcher({ path: ['updatePet'], input }) as Promise<
        InvalidIDSupplied | PetNotFound | ValidationException | UpdatePetOutput
      >,
    /**
     * @remarks Finds Pets by status
     *
     *Multiple status values can be provided with comma separated strings
     * @param input - FindPetByStatusInput
     * @returns InvalidPetStatus | FindPetByStatusOutput
     */
    findPetByStatus: (input: FindPetByStatusInput) =>
      options.fetcher({ path: ['findPetByStatus'], input }) as Promise<InvalidPetStatus | FindPetByStatusOutput>,
    /**
     * @remarks Finds Pets by tags
     *
     *Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
     * @param input - FindPetByStatusInput
     * @returns InvalidPetTagValue | FindPetByStatusOutput
     */
    findPetsByTags: (input: FindPetByStatusInput) =>
      options.fetcher({ path: ['findPetsByTags'], input }) as Promise<InvalidPetTagValue | FindPetByStatusOutput>,
    /**
     * @remarks Find pet by ID
     *
     *Returns a single pet
     * @param input - GetPetByIdInput
     * @returns InvalidIDSupplied | PetNotFound | GetPetByIdOutput
     */
    getPetById: (input: GetPetByIdInput) =>
      options.fetcher({ path: ['getPetById'], input }) as Promise<InvalidIDSupplied | PetNotFound | GetPetByIdOutput>,
  }
}
