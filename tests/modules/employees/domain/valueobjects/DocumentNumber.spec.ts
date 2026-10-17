import { DocumentNumber } from 'src/modules/employees/domain/value-objects/DocumentNumber';

describe('DocumentNumber VO', () => {
  it('should not create a DocumentNumber when value has an invalid length', () => {
    const invalidDocumentNumber = '12345';
    const documentNumber = DocumentNumber.create(invalidDocumentNumber);
    expect(documentNumber.success).toBe(false);
    expect(documentNumber).toHaveProperty(
      'error.message',
      'Invalid document number format. It must be exactly 9 characters long.',
    );
  });

  it.each(['12345678a', '123456789'])(
    'should not create a DocumentNumber when last character is not a capital letter',
    (invalidDocumentNumber) => {
      const documentNumber = DocumentNumber.create(invalidDocumentNumber);
      expect(documentNumber.success).toBe(false);
      expect(documentNumber).toHaveProperty(
        'error.message',
        'Invalid document number format. The last character must be a capital letter.',
      );
    },
  );

  it('should create a DocumentNumber when value is valid', () => {
    const validDocumentNumber = '12345678A';
    const documentNumber = DocumentNumber.create(validDocumentNumber);
    expect(documentNumber.success).toBe(true);
    expect(documentNumber).toHaveProperty('value.value', validDocumentNumber);
  });
});
