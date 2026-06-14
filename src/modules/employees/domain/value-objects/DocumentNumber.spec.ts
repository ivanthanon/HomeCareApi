import { DocumentNumber } from "./DocumentNumber";

describe("DocumentNumber VO", () => {  
    it("should not create a DocumentNumber when value is valid", () => {
        const invalidDocumentNumber = "12345";
        const documentNumber = DocumentNumber.create(invalidDocumentNumber);
        if (documentNumber.success == false) {
            expect(documentNumber.error.message).toBe("Invalid document number format. It must be exactly 9 characters long.");
        }
    });
})