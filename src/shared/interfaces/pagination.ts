export interface PaginationQuery {
  page?: number;
  limit?: number;
  searchText?: string;
  column?: string;
  order?: 'ASC' | 'DESC';
}
