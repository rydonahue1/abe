export interface YoutubeResults {
  kind: string
  etag: string
  prevPageToken?: string
  nextPageToken?: string
  regionCode: string
  pageInfo: PageInfo
  items: ResultItems[]
}

export interface ResultItems {
  kind: ItemKind
  etag: string
  id: ID
  snippet: Snippet
}

export interface ID {
  kind: IDKind
  videoId?: string
  playlistId?: string
  channelId?: string
}

export enum IDKind {
  YoutubeChannel = "youtube#channel",
  YoutubePlaylist = "youtube#playlist",
  YoutubeVideo = "youtube#video",
}

export enum ItemKind {
  YoutubeSearchResult = "youtube#searchResult",
}

export interface Snippet {
  publishedAt: Date
  channelId: string
  title: string
  description: string
  thumbnails: Thumbnails
  channelTitle: string
  liveBroadcastContent: string
  publishTime: Date
}


export interface Thumbnails {
  default: Thumbnail
  medium: Thumbnail
  high: Thumbnail
}

export interface Thumbnail {
  url: string
  width?: number
  height?: number
}

export interface PageInfo {
  totalResults: number
  resultsPerPage: number
}
