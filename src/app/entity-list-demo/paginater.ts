import { SPMatEntityListPaginator } from '@smallpearl/ngx-helper/mat-entity-list';

export class MyPaginator implements SPMatEntityListPaginator {
  getRequestPageParams(endpoint: string, pageIndex: number, pageSize: number) {
    return {
      page: pageIndex + 1, // account for 0-based index
      results: pageSize,
    };
  }
  parseRequestResponse(
    entityName: string,
    entityNamePlural: string,
    endpoint: string,
    params: any,
    resp: any) {
    // console.log(`parseRequestResponse - params: ${JSON.stringify(params)}`);
    return {
      total: 110,
      entities: resp['results'],
    };
  }
}
