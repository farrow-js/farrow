import { api as PetStore, Pet } from './pet-store'

const test = async () => {
  let result = await PetStore.pet.updatePet({
    body: (1 as unknown) as Pet,
  })

  if (result.type === 'InvalidIDSupplied') {
    // handle invalid id supplied
    return
  }

  if (result.type === 'PetNotFound') {
    // handle pet not found
    return
  }

  if (result.type === 'ValidationException') {
    // handle vlidation exception
    return
  }

  if (result.type === 'UpdatePetOutput') {
    // handle update pet successfully
  }
}
