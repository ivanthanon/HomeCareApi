import { EmployeeRepository } from "src/modules/employees/domain/repositories/employee.repository";
import { EmployeeRepositoryContractTest } from "tests/modules/employees/infrastructure/contract/EmployeeRepositoryContractTest";
import { EmployeeInMemoryRepository } from "./EmployeeInMemoryRepository";
import { Employee } from "src/modules/employees/domain/employee";

class InMemoryUserRepositoryContract extends EmployeeRepositoryContractTest {

    public employeeInMemoryRepository!: EmployeeInMemoryRepository;

    protected createRepository(): EmployeeRepository {
        this.employeeInMemoryRepository = new EmployeeInMemoryRepository();
        return this.employeeInMemoryRepository;
    }

    protected async cleanUp(): Promise<void> { 
        this.employeeInMemoryRepository.employeeList = [];
     }

    protected async customAssert(expectedEmployee: Employee): Promise<void> {
        expect(this.employeeInMemoryRepository.employeeList).toHaveLength(1);
        expect(this.employeeInMemoryRepository.employeeList[0]).toMatchObject(expectedEmployee);
    }
}

new InMemoryUserRepositoryContract().runContractTest();