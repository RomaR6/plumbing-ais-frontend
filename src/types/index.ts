interface BaseEntity {
    id: number;
    name: string;
}

export interface Category extends BaseEntity {}
export interface Brand extends BaseEntity {}
export interface Unit extends BaseEntity {}

export interface Product extends BaseEntity {
    sku: string;
    price: number;
    minThreshold: number;
    material?: string;
    diameter?: string;
    threadType?: string;
    categoryId: number;
    brandId: number;
    unitId: number;
    categoryName?: string;
    brandName?: string;
    unitName?: string;
}

export interface Warehouse {
    id: number;
    name: string;
    address?: string;
}

export interface Location {
    id: number;
    warehouseId: number;
    rowCode: string;
    rackCode: string;
    shelfCode: string;
    warehouse?: Warehouse;
}

export interface Stock {
    id: number;
    productId: number;
    locationId: number;
    quantity: number;
    product?: Product;
    location?: Location;
    productName?: string;
    locationName?: string;
}

export interface TransactionItem {
    id?: number;
    transactionId?: number;
    productId: number;
    locationId: number;
    quantity: number;
    price: number;
    product?: Product;
    location?: Location;
}

export interface Transaction {
    id: number;
    type: string;
    userId: number;
    contractorId?: number;
    date: string;
    documentNumber: string;
    description?: string;
    transactionItems?: TransactionItem[];
}

export interface TransactionGroupRequest {
    type: string;
    contractorId?: number | null;
    description?: string;
    items: {
        productId: number;
        locationId: number;
        quantity: number;
        price: number;
    }[];
}

export interface Contractor {
    id: number;
    name: string;
    type: string;
}