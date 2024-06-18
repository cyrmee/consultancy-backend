import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Key used for metadata to define roles.
 * @constant {string}
 * @exports
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to set roles metadata on a route handler or controller.
 * @function
 * @exports
 * @param {...Role[]} roles - The roles to be assigned to the route or controller.
 * @returns {CustomDecorator<string[]>} A decorator function.
 */
export const Roles = (...roles: Role[]): CustomDecorator<string> =>
  SetMetadata(ROLES_KEY, roles);
