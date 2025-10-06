export interface UploadedImage {
  id: number;
  key: string;
  name: string;
  pathname: string;
  originName: string;
  size: number;
  width?: number;
  height?: number;
  mimetype: string;
  extension: string;
  md5: string;
  sha1: string;
  links: {
    url: string;
    html: string;
    bbcode: string;
    markdown: string;
    markdown_with_link: string;
    thumbnail_url: string;
    delete_url: string;
  };
  albumId?: number;
  permission?: number;
  createdAt?: string;
  updatedAt?: string;
}
