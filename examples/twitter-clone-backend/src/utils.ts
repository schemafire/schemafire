/**
 * Create a relationship ID from the actor and recipient
 */
export const relationshipId = (
  actor: FirebaseFirestore.DocumentReference,
  recipient: FirebaseFirestore.DocumentReference,
) => `${actor.id}_${recipient.id}`;
