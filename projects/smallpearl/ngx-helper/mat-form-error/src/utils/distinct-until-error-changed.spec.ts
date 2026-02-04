import type { TemplateRef } from '@angular/core';
import type { ErrorTemplate, MaxError, MinError } from '../types';
import { distinctUntilErrorChanged } from './distinct-until-error-changed';

describe('distinctUntilErrorChanged', () => {
  const minError = {
    $implicit: 'min error',
    template: undefined,
  } as ErrorTemplate;
  const maxError = {
    $implicit: 'max error',
    template: undefined,
  } as ErrorTemplate;
  const minErrorTemplate = {
    $implicit: {
      actual: 2,
      min: 3,
    } satisfies MinError,
    template: {} as TemplateRef<any>,
  } as ErrorTemplate;
  const maxErrorTemplate = {
    $implicit: {
      actual: 3,
      max: 2,
    } satisfies MaxError,
    template: {} as TemplateRef<any>,
  } as ErrorTemplate;

  it('should return true if the value is the same', () => {
    expect(distinctUntilErrorChanged(undefined, undefined)).toBeTruthy();
    expect(distinctUntilErrorChanged(minError, minError)).toBeTruthy();
    expect(
      distinctUntilErrorChanged(minErrorTemplate, minErrorTemplate),
    ).toBeTruthy();
  });

  it('should return false if undefined follows other values', () => {
    expect(distinctUntilErrorChanged(minError, undefined)).toBeFalsy();
    expect(distinctUntilErrorChanged(minErrorTemplate, undefined)).toBeFalsy();
  });

  it('should return false if other values follow undefined', () => {
    expect(distinctUntilErrorChanged(undefined, minError)).toBeFalsy();
    expect(distinctUntilErrorChanged(undefined, minErrorTemplate)).toBeFalsy();
  });

  it('should return false if different values follow each other', () => {
    expect(distinctUntilErrorChanged(minError, maxError)).toBeFalsy();
    expect(distinctUntilErrorChanged(maxError, maxErrorTemplate)).toBeFalsy();
    expect(
      distinctUntilErrorChanged(maxErrorTemplate, minErrorTemplate),
    ).toBeFalsy();
    expect(distinctUntilErrorChanged(minErrorTemplate, minError)).toBeFalsy();
  });
});
