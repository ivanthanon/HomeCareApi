import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { NestConfigurationProvider } from 'src/modules/employees/infrastructure/adapters/nestConfigurationProvider';

describe('NestConfigurationProvider', () => {
  it('should retrieve the configured age of majority', () => {
    const provider = new NestConfigurationProvider(
      new ConfigService({ app: { ageOfMajority: 18 } }),
    );

    expect(provider.getAgeOfMajority()).toBe(18);
  });

  it('should return undefined when the age of majority is not configured', () => {
    const provider = new NestConfigurationProvider(new ConfigService());

    expect(provider.getAgeOfMajority()).toBeUndefined();
  });
});
