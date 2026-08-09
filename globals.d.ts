interface BrowserRuntime {
  getURL: (path: string) => string;
}

declare global {
  const browser: {
    runtime: BrowserRuntime;
  };
}

export {};

declare function onNewPosts(element: Element, callback: (element: Node) => void): MutationObserver | undefined;
declare function scrapePostData(
  element: Element,
  createGalleryItems: (data: Record<string, unknown>, displayGalleryItem: (galleryItem: Element) => void) => void,
  displayGalleryItem: (galleryItem: Element) => void,
): void | null;
declare function createGalleryItems(
  postData: Record<string, unknown> | null,
  displayGalleryItem: (galleryItem: Element) => void,
): Promise<void>;

