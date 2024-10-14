import { SPMatEntityListConfig } from "./mat-entity-list-types";

export class DefaultSPMatEntityListConfig implements SPMatEntityListConfig {
  urlResolver = (endpoint: string) => endpoint;
  paginator = undefined;
}
