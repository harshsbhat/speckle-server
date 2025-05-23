/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import Queue from '../helpers/queue.js'
import { CustomLogger, Fetcher, Item } from '../types/types.js'
import { Cache, Downloader } from './interfaces.js'

export interface ObjectLoader2Options {
  keyRange?: { bound: Function; lowerBound: Function; upperBound: Function }
  indexedDB?: IDBFactory
  serverUrl: string
  streamId: string
  objectId: string
  token?: string
  logger?: CustomLogger
  headers?: Headers
  cache?: Cache
  downloader?: Downloader
}
export interface BaseDatabaseOptions {
  logger?: CustomLogger
  indexedDB?: IDBFactory
  keyRange?: {
    bound: Function
    lowerBound: Function
    upperBound: Function
  }
  maxCacheReadSize?: number
  maxCacheWriteSize?: number
  maxCacheBatchWriteWait?: number
}

export interface BaseDownloadOptions {
  serverUrl: string
  streamId: string
  objectId: string
  token?: string
  headers?: Headers

  fetch?: Fetcher
  database: Cache
  results: Queue<Item>
}
