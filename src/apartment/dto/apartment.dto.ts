// 조회
export interface ApartmentIdDto {
  id: number;
}

export interface GetApartmentDto {
  page: number;
  limit: number;
  searchKeyword: string;
}
// 생성
export interface CreateApartmentDto {
  name: string;
  address: string;
  description: string;
  officeNumber: string;
  buildingNumberFrom: number;
  buildingNumberTo: number;
  floorCountPerBuilding: number;
  unitCountPerFloor: number;
  adminOfId: number;
}
