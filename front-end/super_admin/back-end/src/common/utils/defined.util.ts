/**
 * Drop keys whose value is undefined. The validation pipe's `transform` leaves
 * unsent optional DTO fields as undefined, and spreading them into a stored
 * record would erase existing values — always pass update DTOs through this.
 */
export function definedOnly<T extends object>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}
