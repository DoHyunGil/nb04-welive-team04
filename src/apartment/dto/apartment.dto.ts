export interface ApartmentIdDto {
  id: number;
}

export interface GetApartmentDto {
  page: number;
  limit: number;
  searchKeyword: string;
}
