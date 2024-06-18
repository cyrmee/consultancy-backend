import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom parameter decorator for obtaining the user object from the HTTP request.
 * @function
 * @exports
 * @param {any | undefined} data - Optional data indicating specific user properties to retrieve.
 * @param {ExecutionContext} ctx - The execution context.
 * @returns {object | any} The user object or specific user properties.
 */
export const GetUser = createParamDecorator(
  (data: any | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);

/**
 * Custom parameter decorator for obtaining the employee ID from the HTTP request user object.
 * @function
 * @exports
 * @param {any | undefined} data - Optional data (not used in this decorator).
 * @param {ExecutionContext} ctx - The execution context.
 * @returns {string} The employee ID.
 */
export const GetEmployeeId = createParamDecorator(
  (data: any | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.employee.id;
  },
);
