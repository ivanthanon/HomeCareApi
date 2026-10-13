import { ConfigService } from '@nestjs/config';
import { ForRetrievingMajorityAge } from 'src/modules/employees/application/ports/forRetrievingMajorityAge';

export class NestConfigurationProvider implements ForRetrievingMajorityAge {
  constructor(private readonly configService: ConfigService) {}

  getAgeOfMajority(): number | undefined {
    return this.configService.get<number>('app.ageOfMajority');
  }
}
