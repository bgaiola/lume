import { Injectable, type PipeTransform } from '@nestjs/common';
import { ZodError, type ZodSchema } from 'zod';

/**
 * NestJS pipe that validates a payload against a {@link ZodSchema}.
 *
 * Usage:
 * ```ts
 * @Body(new ZodValidationPipe(createSessionRequestSchema))
 * body: CreateSessionRequest
 * ```
 *
 * Errors propagate as {@link ZodError} so {@link AllExceptionsFilter} can
 * format them as the canonical 400 response.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw result.error as ZodError;
    }
    return result.data;
  }
}
