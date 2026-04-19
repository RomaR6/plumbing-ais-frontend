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