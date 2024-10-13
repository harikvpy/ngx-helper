import { SPMatEntityListConfig } from "./providers";

export class DefaultSPMatEntityListConfig implements SPMatEntityListConfig {
  urlResolver = (endpoint: string) => endpoint;
  paginator = undefined;
}
