import { ExecutionContext, createParamDecorator } from '@nestjs/common';

/**
 * Custom parameter decorator for obtaining the generic HTTP request object.
 * @function
 * @exports
 * @param {unknown} data - Optional data passed to the decorator.
 * @param {ExecutionContext} ctx - The execution context.
 * @returns {object} The HTTP request object.
 */
export const GenericRequest = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request;
  },
);
