import { it, afterEach } from 'vitest';
import { EmployeeRepository } from 'src/modules/employees/domain/repositories/employee.repository';
import { Employee } from 'src/modules/employees/domain/employee';

export abstract class EmployeeRepositoryContractTest {
    protected repository!: EmployeeRepository;

    protected abstract createRepository(): EmployeeRepository;

    protected async customArrange(employee: Employee): Promise<void> { }

    protected async customAssert(expectedEmployee: Employee): Promise<void> { }

    protected abstract cleanUp(): Promise<void>;

    public runContractTest() {

        beforeAll(async () => {
            this.repository = this.createRepository();
        });

        afterEach(async () => {
            await this.cleanUp();
        });

        it('should create an employee', async () => {
            const expectedEmployee = Employee.reconstitute("60503836-989C-48D0-AC81-D1CC61C221A4", "Juan", "Lopez", "42332233X", "1985-03-15T00:00:00Z")

            await this.repository.create(expectedEmployee);

            await this.customAssert(expectedEmployee);
        });

        it('should get an employee', async () => {
            const anExistingEmployee = Employee.reconstitute("60503836-989C-48D0-AC81-D1CC61C221A4", "Juan", "Lopez", "42332233X", "1985-03-15T00:00:00Z")
            await this.customArrange(anExistingEmployee);

            const employee = await this.repository.getBy(anExistingEmployee.id.value);

            expect(employee).toEqual(anExistingEmployee);
        })
    }
}