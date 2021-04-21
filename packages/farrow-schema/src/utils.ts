export const isNumberConstructor = (input: any): input is NumberConstructor => {
  return input === Number
}

export const isStringConstructor = (input: any): input is StringConstructor => {
  return input === String
}

export const isBooleanConstructor = (input: any): input is BooleanConstructor => {
  return input === Boolean
}

export const isDateConstructor = (input: any): input is DateConstructor => {
  return input === Date
}
