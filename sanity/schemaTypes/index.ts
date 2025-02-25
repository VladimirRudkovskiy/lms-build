import { type SchemaTypeDefinition } from 'sanity'
import { studentType } from './studentType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [studentType],
}
