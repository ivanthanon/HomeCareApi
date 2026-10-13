import { ConfigService } from '@nestjs/config';
import { ConfigurationProvider } from 'src/modules/employees/application/ports/configurationProvider';

export class NestConfigurationProvider implements ConfigurationProvider {
  constructor(private readonly configService: ConfigService) {}

  getAgeOfMajority(): number | undefined {
    return this.configService.get<number>('app.ageOfMajority');
  }
}
