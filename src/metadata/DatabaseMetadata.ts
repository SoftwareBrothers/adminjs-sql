import { ResourceMetadata } from './ResourceMetadata';

export class DatabaseMetadata {
  public readonly database: string;

  protected resourceMap: Map<string, ResourceMetadata>;

  constructor(
    database: string,
    resourceMap: Map<string, ResourceMetadata>,
  ) {
    this.database = database;
    this.resourceMap = resourceMap;
  }

  public tables(): ResourceMetadata[] {
    return Array.from(this.resourceMap.values());
  }

  public table(tableName: string): ResourceMetadata {
    const resource = this.resourceMap.get(tableName);

    if (!resource) {
      throw new Error(`Table does not exist: "${this.database}.${tableName}"`);
    }

    return resource;
  }
}
