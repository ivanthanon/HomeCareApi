export class CreateWorkerCommand {
  constructor(
    readonly firstName: string,
    readonly lastName: string,
    readonly documentNumber: string,
    readonly dateOfBirth: string,
  ) {}
}
