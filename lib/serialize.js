import { ObjectId } from 'mongodb'

// Converts a Mongo document's _id (and any nested subtopics[]._id) into a
// plain string `id` field so the frontend never has to deal with ObjectId.
export function serializeSubject(doc) {
  if (!doc) return null
  const { _id, subtopics = [], ...rest } = doc
  return {
    id: _id.toString(),
    ...rest,
    subtopics: subtopics.map((t) => {
      const { _id: tid, ...trest } = t
      return { id: tid.toString(), subject_id: _id.toString(), ...trest }
    }),
  }
}

export function serializeDoc(doc) {
  if (!doc) return null
  const { _id, ...rest } = doc
  return { id: _id.toString(), ...rest }
}

export function toObjectId(id) {
  if (!ObjectId.isValid(id)) {
    const err = new Error(`Invalid id: ${id}`)
    err.status = 400
    throw err
  }
  return new ObjectId(id)
}
