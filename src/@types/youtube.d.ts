export interface YoutubeAPIResult<T> {
  kind: string
  etag: string
  prevPageToken?: string
  nextPageToken?: string
  regionCode: string
  pageInfo: PageInfo
  items: T[]
}

export interface YoutubePlaylist {
  kind: YoutubePlaylist
  etag: string
  id: string
  snippet: Snippet
}

export interface YoutubePlaylistItem {
  kind: YoutubeVideo
  etag: string
  id: string
  snippet: Snippet,
}

export interface ID {
  kind: Kind
  videoId?: string
  playlistId?: string
  channelId?: string
}

export enum Kind {
  YoutubeChannel = "youtube#channel",
  YoutubePlaylist = "youtube#playlist",
  YoutubeVideo = "youtube#video",
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
  publishTime?: Date
  localized?: Localized
  playlistId?: string
  resourceId?: ID
  position?: number
  videoOwnerChannelTitle?: string
  videoOwnerChannelId?: string
}

export interface Thumbnails {
  default: Thumbnail
  medium: Thumbnail
  high: Thumbnail
  standard?: Default
  maxres?: Default
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
