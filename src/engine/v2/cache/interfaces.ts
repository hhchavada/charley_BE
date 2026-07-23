import { ConfigurationBundle } from '../../config/interfaces';

export interface CacheMetadata {
  versionId: string;
  loadedAt: Date;
  buildTimeMs: number;
  grantCount: number;
  ruleCount: number;
  questionCount: number;
}

export interface CacheBundle {
  metadata: CacheMetadata;
  configuration: ConfigurationBundle;
}

export interface ICacheProvider {
  /**
   * Retrieves a bundle by version ID.
   */
  get(versionId: string): Promise<CacheBundle | null>;

  /**
   * Saves a bundle to the cache.
   */
  set(versionId: string, bundle: CacheBundle): Promise<void>;

  /**
   * Deletes a specific version from the cache.
   */
  delete(versionId: string): Promise<void>;

  /**
   * Clears the entire cache.
   */
  clear(): Promise<void>;

  /**
   * Gets memory/storage usage diagnostics.
   */
  getDiagnostics(): Promise<any>;
}
