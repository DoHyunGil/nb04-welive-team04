import type { ParsedQs } from 'qs';

export class GetResidentsDto {
  page: number;
  limit: number;
  searchKeyword?: string;
  joinStatus?: string;
  building?: number;
  unit?: number;
  isHouseholder?: boolean;
  isRegistered?: boolean;

  constructor(query: ParsedQs) {
    this.page = query.page ? Number(query.page) : 1;
    this.limit = query.limit ? Number(query.limit) : 10;
    this.searchKeyword =
      typeof query.searchKeyword === 'string' ? query.searchKeyword : undefined;
    this.joinStatus =
      typeof query.joinStatus === 'string' ? query.joinStatus : undefined;
    this.building =
      typeof query.building === 'string' ? Number(query.building) : undefined;
    this.unit = typeof query.unit === 'string' ? Number(query.unit) : undefined;
    this.isHouseholder =
      query.isHouseholder === 'true'
        ? true
        : query.isHouseholder === 'false'
          ? false
          : undefined;
    this.isRegistered =
      query.isRegistered === 'true'
        ? true
        : query.isRegistered === 'false'
          ? false
          : undefined;
  }
}
