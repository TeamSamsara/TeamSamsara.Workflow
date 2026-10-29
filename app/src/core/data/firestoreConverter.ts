// File : /TeamSamsara.Workflow/app/src/core/data/firestoreConverter.ts
// Version : 1.0.0
// Latest commit: core/data
// Author : Gerrah
// Purpose : Builds a typed Firestore converter from two plain functions: one that
// reads a document into a record (with the field readers), and one that turns a
// record back into what is stored. Every model uses it, so reads are always typed.

import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";

export interface ModelCodec<TModel> {
  /** Reads a stored document. The id is the document's own id. */
  parse: (id: string, data: DocumentData) => TModel;
  /** What gets stored for a record. The id is never stored inside the document. */
  serialize: (model: TModel) => DocumentData;
}

export function createConverter<TModel>(
  codec: ModelCodec<TModel>,
): FirestoreDataConverter<TModel, DocumentData> {
  return {
    toFirestore: (model) => codec.serialize(model as TModel),
    fromFirestore: (
      snapshot: QueryDocumentSnapshot<DocumentData>,
      options?: SnapshotOptions,
    ) => codec.parse(snapshot.id, snapshot.data(options)),
  };
}
