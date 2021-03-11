import { page } from 'farrow-next'
import { Index, User } from './Controller'
import { View } from './View'
import '../../handleApi'

export default page({
  View,
  Controllers: {
    Index,
    User,
  },
})
