interface GalleryNode {
  tag: string;
  text?: string;
  className?: string;
  children?: GalleryNode[];
  meta?: {
    originalSrc?: string;
    thumbnail?: string;
  };
  [key: string]: unknown;
}

interface PostData {
  dataUrl?: string;
  dataPermalink?: string;
  title?: string;
  dataSubredditPrefixed?: string;
  dataAuthor?: string;
  dataTimestamp?: string;
  dataDomain?: string;
  thumbnail?: string;
  class?: string;
  promoted?: string;
  dataType?: string;
  [key: string]: unknown;
}

const _ = undefined;
const linkDict: Record<string, boolean> = {};
const unsupported: Record<string, number> = {};
const seenImgData: string[] = [];
let addToGallery: (element: Element) => void = () => {};
let cardIndex = 0;

function isRecognizedUrl(url: string) {
  const recognizedUrls = [
    'https://i.redd.it/',
    'https://v.redd.it/',
    'https://i.imgur.com/',
  ];
  return recognizedUrls.some((recognizedUrl) => url.includes(recognizedUrl));
}

async function createGalleryItems(postData: PostData | null, displayGalleryItem: (element: Element) => void) {
  addToGallery = displayGalleryItem;
  if (!postData) return;

  const { dataUrl, title } = postData;
  if (typeof dataUrl === 'string' && dataUrl.includes('reddit.com/gallery/')) {
    const links = await getRedditGalleryIDs(dataUrl);
    links?.forEach((link: string, counter: number) => createGalleryItem({
      ...postData,
      title: `${title} (${counter + 1}/${links.length})`,
      dataUrl: link,
    }));
    return;
  }

  createGalleryItem(postData);
}

function createGalleryItem(postData: PostData) {
  try {
    const {
      title,
      dataUrl,
      dataPermalink,
      dataSubredditPrefixed: subredditPrefixed,
      dataAuthor: author,
      dataTimestamp: timestamp,
      dataDomain,
      thumbnail,
    } = postData;

    if (!thumbnail) return; // skip text posts

    const subredditUrl = `https://old.reddit.com/${subredditPrefixed}`;
    const postAuthorUrl = `https://old.reddit.com/user/${author}`;
    const postAuthorWwwUrl = `https://www.reddit.com/user/${author}`;
    const commentUrl = `https://www.reddit.com${dataPermalink}`;

    /**
     * Quash dupes
     */
    if (typeof dataUrl === 'string' && linkDict[dataUrl]) return;

    if (typeof dataUrl === 'string') {
      linkDict[dataUrl] = true;
    }

    const childElementData: GalleryNode[] = [];

    /**
     * Here's where we handle different media sources
     */

    let modifiedDataUrl = typeof dataUrl === 'string' ? dataUrl : undefined;

    if (modifiedDataUrl?.includes("imgur.com") && modifiedDataUrl?.includes(".gifv")) {
      modifiedDataUrl = modifiedDataUrl.replace(".gifv", ".mp4");
    }

    if (modifiedDataUrl?.includes("v3.redgifs.com")) {
      modifiedDataUrl = modifiedDataUrl.replace("v3.redgifs.com", "www.redgifs.com");
    }

    //
    // Set the thumbnail and the link, which imagus will use for mouseover previews
    //

    if (modifiedDataUrl?.includes(".mp4")) {
      const videoSource = {
        tag: 'source',
        src: modifiedDataUrl.replace(".gifv", ".webm"), // why? not sure.
        type: 'video/webm',
      };
      const videoTag = {
        tag: 'video',
        preload: 'metadata',
        muted: true,
        loop: true,
        children: [ videoSource ]
      };
      const mp4Div = {
        tag: 'div',
        className: 'gallery-item-video',
        children: [
          anchor(modifiedDataUrl, _, _, [videoTag])
        ]
      };
      childElementData.push(mp4Div);

    } else if (
      modifiedDataUrl?.includes(".jpg") ||
      modifiedDataUrl?.includes(".jpeg") ||
      modifiedDataUrl?.includes(".png") ||
      modifiedDataUrl?.includes(".gif")
    ) {
      if (modifiedDataUrl?.includes("i.redgifs.com/i/") && modifiedDataUrl?.includes(".jpg")) {
        modifiedDataUrl = modifiedDataUrl.replace("i.redgifs.com/i/", "www.redgifs.com/watch/");
        modifiedDataUrl = modifiedDataUrl.replace(".jpg", "");
      }

      childElementData.push({
        tag: 'div',
        className: 'gallery-item-image',
        children: [
          {
            tag: 'a',
            href: modifiedDataUrl,
            target: '_blank',
            children: [
              {
                tag: 'img',
                src: modifiedDataUrl,
                loading: 'lazy',
                meta: {
                  originalSrc: dataUrl,
                  thumbnail
                }
              }
            ]
          }
        ]
      });
    } else {
      if (typeof dataDomain === 'string') {
        unsupported[dataDomain] = 1 + (unsupported[dataDomain] || 0);
      }

      childElementData.push({
        tag: 'div',
        className: 'gallery-item-thumb',
        children: [
          {
            tag: 'a',
            href: modifiedDataUrl || dataPermalink,
            target: '_blank',
            children: [
              {
                tag: 'img',
                src: thumbnail || browser.runtime.getURL("default.png"),
                loading: 'lazy'
              }
            ]
          }
        ]
      });
    }

    //
    // Add the post details
    //

    childElementData.push({
      tag: 'div',
      className: 'gallery-item-details',
      children: [
        {
          tag: 'p',
          className: 'gallery-item-title',
          children: [
            anchor(dataUrl, title)
          ]
        },
        {
          tag: 'p',
          className: 'gallery-item-author',
          children: [
            anchor(`${postAuthorUrl}/submitted`, author || 'unknown author'),
            anchor(postAuthorWwwUrl, ' 🚫', 'gallery-item-author-block'),
          ]
        },
        {
          tag: 'p',
          className: 'gallery-item-subreddit',
          children: [
            anchor(subredditUrl, `on ${subredditPrefixed || 'unknown'}`),
          ]
        },
        {
          tag: 'p',
          className: 'gallery-item-comments',
          children: [
            anchor(commentUrl, `at ${(new Date(parseInt(timestamp))).toLocaleString()}`),
          ]
        },

        // DEBUG LINES
        // {
        //   tag: 'p',
        //   className: 'gallery-item-comments',
        //   children: [{tag: 'text', text: `url: ${postData.dataUrl}`}]
        // },
        // {
        //   tag: 'p',
        //   className: 'gallery-item-comments',
        //   children: [{tag: 'text', text: `permalink: ${postData.dataPermalink}`}]
        // },
        // {
        //   tag: 'p',
        //   className: 'gallery-item-comments',
        //   children: [{tag: 'text', text: `domain: ${postData.dataDomain}`}]
        // },
        // {
        //   tag: 'p',
        //   className: 'gallery-item-comments',
        //   children: [{tag: 'text', text: `thumbnail: ${postData.thumbnail}`}]
        // },
      ]
    });

    /**
     * Turn the gallery item data into elements
     */

    const galleryItemData: GalleryNode[] = [
      {
        tag: 'div',
        className: 'gallery-item-container',
        children: [
          {
            tag: 'div',
            className: 'gallery-item',
            children: childElementData
          }
        ]
      }
    ];

    const galleryItem = createElements(galleryItemData);
    const galleryItemContainer = galleryItem[0] as HTMLElement;
    if (galleryItemContainer) {
      galleryItemContainer.classList.add('visible');
      galleryItemContainer.classList.add('gallery-item-card');
      if (cardIndex % 2 === 0) {
        galleryItemContainer.style.backgroundColor = '#373737';
      } else {
        galleryItemContainer.style.backgroundColor = 'black';
      }
      cardIndex += 1;
      addToGallery(galleryItemContainer);
    }
  } catch (error) {
    console.debug('[Reddit-Gallery] Error in createGalleryItem', error);
  }
}

async function getRedditGalleryIDs(url: string) {
  const modifiedUrl = url.replace('www', 'old').replace('gallery', 'comments').replace(/\/+$/, '');
  let response: Response;
  try {
    response = await fetch(modifiedUrl + '.json');
  } catch (error) {
    console.debug('[Reddit-Gallery] Fetch error in getRedditGalleryIDs', error);
    console.debug('[Reddit-Gallery] url:', url);
    console.debug('[Reddit-Gallery] modifiedUrl:', modifiedUrl);
    return [];
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.debug('[Reddit-Gallery] Error parsing JSON in getRedditGalleryIDs', error);
    return [];
  }

  try {
    const mediaData = data[0].data.children[0].data.media_metadata;
    const rawLinks = Object.values(mediaData)
      .map((mediaItem: Record<string, { u?: string; mp4?: string }>) => {
        const linkChoice = mediaItem.s?.u || mediaItem.s?.mp4;
        return linkChoice?.split('?')[0];
      })
      .filter((link): link is string => Boolean(link));
    return rawLinks.map((link: string) => link.replace('preview', 'i'));
  } catch (error) {
    console.debug('[Reddit-Gallery] Error extracting media links in getRedditGalleryIDs', error);
    return [];
  }
}

function createElements(data: GalleryNode[]) {
  return data.map((item) => {
    if (item.tag === 'text') {
      return document.createTextNode(String(item.text || ''));
    }

    const element = document.createElement(item.tag);

    for (const [key, value] of Object.entries(item)) {
      if (key === 'tag') {
        continue;
      }
      if (item.text) {
        element.append(document.createTextNode(String(item.text)));
        delete item.text;
      }
      if (key === 'children') {
        element.append(...createElements(value as GalleryNode[]));
        continue;
      }
      if (key === 'className') {
        element.classList.add(value as string);
        continue;
      }
      element.setAttribute(key, String(value));
    }

    if (item.tag === 'video') handleVideoLoading(element as HTMLVideoElement);
    if (item.tag === 'img') handleImageLoading(element as HTMLImageElement, item);

    return element;
  });
}

function addSizeToLoadedElement(element: Element | null, widthRatio: number, heightRatio: number) {
  if (!element) {
    return;
  }

  (element as HTMLElement).style.gridRow = `span ${heightRatio + 2}`;
  if (widthRatio > 15) {
    (element as HTMLElement).style.gridColumn = `span 20`;
    (element as HTMLElement).style.gridRow = `span 13`;
  }

  addToGallery(element);
  setTimeout(() => {
    element?.classList.add('visible');
  }, 100);
}

function handleVideoLoading(element: HTMLVideoElement) {
  element.addEventListener('loadeddata', function({ target }) {
    try {
      const videoTarget = target as HTMLVideoElement;
      const widthRatio = Math.floor(videoTarget.videoWidth / videoTarget.videoHeight * 10);
      const heightRatio = Math.floor(videoTarget.videoHeight / videoTarget.videoWidth * 10);
      const galleryItemContainerElement = element.closest('.gallery-item-container');
      addSizeToLoadedElement(galleryItemContainerElement, widthRatio, heightRatio);
    } catch (err) {
      console.debug('[Reddit-Gallery] video event listener error:', err);
    }
  }, false);
}

async function fetchImageManually (element: HTMLImageElement, item: GalleryNode) {
  try {
    const src = element.getAttribute('src') || '';
    const response = await fetch(src, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`fetch failed with status ${response.status}`);
    }
    const blob = await response.blob();
    // handleImageLoading(element, item);
    element.src = URL.createObjectURL(blob);
  } catch (error) {
    console.debug('[Reddit-Gallery] fetch-based image load failed:', error);
    const fallbackSrc = item.meta?.thumbnail || browser.runtime.getURL('default.png');
    if (element.src !== fallbackSrc) {
      element.src = fallbackSrc;
    }
  }
};

function handleImageLoading(element: HTMLImageElement, item: GalleryNode) {
  element.onload = function({ target }) {
    const imageTarget = target as HTMLImageElement;
    if (imageTarget.src.includes('imgur.com') && imageTarget.height === 81 && imageTarget.width === 161) {
      return;
    }
    const galleryItemContainerElement = element.closest('.gallery-item-container');
    const widthRatio = Math.floor(imageTarget.naturalWidth / imageTarget.naturalHeight * 10);
    const heightRatio = Math.floor(imageTarget.naturalHeight / imageTarget.naturalWidth * 10);
    addSizeToLoadedElement(galleryItemContainerElement, widthRatio, heightRatio);
  };

  element.onerror = function(event) {
    // const galleryItemContainerElement = element.closest('div');
    // if (galleryItemContainerElement) {
    //   const failMessage = document.createElement('p');
    //   failMessage.classList.add('gallery-item-comments');
    //   const errorType = event && typeof event === 'object' && 'type' in event ? String(event.type) : 'unknown error';
    //   failMessage.textContent = `image load failed: ${errorType}`;
    //   galleryItemContainerElement.appendChild(failMessage);
    //   galleryItemContainerElement.classList.add('visible');
    // }
    console.debug(`[Reddit-Gallery] image load failed:`, item);
    // console.debug(`[Reddit-Gallery] error displayed: ${!!galleryItemContainerElement}`);
    console.debug(`[Reddit-Gallery] error event:`, event);

    fetchImageManually(element, item);
  };

  // if (element.src.includes('i.redd.it') || element.src.includes('i.imgur.com')) {
  //   fetchImage(element, item);
  // }
}

function dupeImg(img: HTMLImageElement) {
  const ext = img.src.substring(img.src.lastIndexOf('.') + 1, img.src.length);
  if (ext !== 'jpg' && ext !== 'png' && ext !== 'gif') return false;

  try {
    const canvas = document.createElement('canvas');
    canvas.height = img.height;
    canvas.width = img.width;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return false;
    }
    ctx.drawImage(img, 0, 0);

    const dataURL = canvas.toDataURL(`image/${ext}`);
    const sample = dataURL.substring(0, 100);

    if (seenImgData.includes(sample)) {
      return true;
    }

    seenImgData.push(sample);
    return false;
  } catch (err) {
    console.debug('[Reddit-Gallery] dupe detection error:', err);
  }
}

function anchor<T>(url: string, text?: string, className?: string, children?: T[]) {
  return {
    tag: 'a',
    target: '_blank',
    href: url,
    ...(text ? { text } : {}),
    ...(className ? { className } : {}),
    ...(children ? { children } : {}),
  }
}
