export type CustomerProfileField = 'name' | 'phone' | 'ci';

export interface CustomerProfileCompletionSnapshot {
    editableFields: CustomerProfileField[];
    fieldsNeedingReview: CustomerProfileField[];
}

export function isCustomerProfileFieldEditable(editableFields: CustomerProfileField[], field: CustomerProfileField): boolean {
    return editableFields.includes(field);
}

/**
 * Capture only truly empty fields as fillable. Non-empty stored values are
 * never offered for editing by profile completion; invalid legacy values need
 * an authorized review path instead of being overwritten by this flow.
 */
export function getCustomerProfileCompletionSnapshot(customer: { name: string; phone: string; ci: string }): CustomerProfileCompletionSnapshot {
    const values: Record<CustomerProfileField, string> = {
        name: customer.name,
        phone: customer.phone,
        ci: customer.ci,
    };
    const editableFields = (Object.keys(values) as CustomerProfileField[])
        .filter(field => values[field].trim().length === 0);
    const invalidExisting: Record<CustomerProfileField, boolean> = {
        name: customer.name.trim().length > 0 && customer.name.trim().length < 2,
        phone: customer.phone.trim().length > 0 && customer.phone.replace(/\D/g, '').length < 7,
        ci: customer.ci.trim().length > 0 && customer.ci.trim().length < 3,
    };

    return {
        editableFields,
        fieldsNeedingReview: (Object.keys(invalidExisting) as CustomerProfileField[])
            .filter(field => invalidExisting[field]),
    };
}

export function validateCustomerProfileField(field: CustomerProfileField, value: string): string | null {
    if (field === 'name' && value.trim().length < 2) return 'name';
    if (field === 'phone' && value.replace(/\D/g, '').length < 7) return 'phone';
    if (field === 'ci' && value.trim().length < 3) return 'ci';
    return null;
}
