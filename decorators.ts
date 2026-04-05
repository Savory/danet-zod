import type { z } from "zod";
import { MetadataHelper } from '@danet/core/metadata';
import { NotValidBodyException, createParamDecorator, type OptionsResolver, type ExecutionContext, type DecoratorFunction } from './deps.ts';

/**
 *  Constant to access body zod schema for metadata
 */
export const zodBodySchemaKey = 'zodBodySchema'

/**
 *  Constant to access query zod schema for metadata
 */
export const zodQuerySchemaKey = 'zodQuerySchema'

/**
 *  Get the request body or a given property and validate it with the provided Zod Schema. Throws NotValidBodyException
 */
export function Body<T extends z.ZodRawShape>(zodSchema: z.ZodObject<T>, prop?: string): DecoratorFunction {
  return createParamDecorator(async (context: ExecutionContext, opts?: OptionsResolver) => {
    if (!opts) {
      throw {
        status: 500,
        message: 'Options of Body not taken by Body decorator function',
      };
    }

    let body;
    try {
      body = await context.req.json();
    } catch (e) {
      throw e;
    }

    if (!body) {
      return null;
    }
    const param = prop ? body[prop] : body;
    const operation = zodSchema.safeParse(param);

    if (!operation.success) {
      throw new NotValidBodyException(operation.error);
    }

    return operation.data;
  }, (target, propertyKey) => {
    MetadataHelper.setMetadata(
      zodBodySchemaKey,
      zodSchema,
      target.constructor,
      propertyKey,
    );
  })();
}


/**
 *  Get the request query or a given property and validate it with the provided Zod Schema. Throws NotValidBodyException
 */
export function Query<T extends z.ZodRawShape>(zodSchema: z.ZodObject<T>): DecoratorFunction {
  return createParamDecorator(async (context: ExecutionContext, opts?: OptionsResolver) => {
    const param = context.req.query()
    const operation = zodSchema.safeParse(param);

    if (!operation.success) {
      throw new NotValidBodyException(operation.error, "Query bad formatted");
    }

    return operation.data;
  }, (target, propertyKey) => {
    MetadataHelper.setMetadata(
      zodQuerySchemaKey,
      zodSchema,
      target.constructor,
      propertyKey,
    );
  })();
}


/**
 * Metadata key to store the returned zod schema of a method
 */
export const RETURNED_SCHEMA_KEY = 'returnschema';

type MethodDecoratorFunction = (
  // deno-lint-ignore ban-types
  target: Object,
  propertyKey?: string | symbol,
  descriptor?: PropertyDescriptor,
) => void;

/**
 * Decorator to set metadata for the returned zod schema of a method.
 *
 * @param returnedSchema - The type of the value that the method or property returns.
 * @param isArray
 */
export function ReturnedSchema(returnedSchema: any, isArray?: boolean): MethodDecoratorFunction {
  return (
    target: Object,
    propertyKey?: string | symbol,
    descriptor?: any,
  ) => {
    MetadataHelper.setMetadata(
      RETURNED_SCHEMA_KEY,
      {
        returnedSchema,
        isArray,
      },
      target,
      propertyKey,
    );
  };
}
