const linkDict = {};
const unsupported = {};
let addToGallery = () => {};

function recognizedUrl(url) {
  const recognizedUrls = [
    'https://i.redd.it/',
    'https://v.redd.it/',
    'https://i.imgur.com/',
  ];
  return recognizedUrls.some(recognizedUrl => url.includes(recognizedUrl));
}

async function createGalleryItems(postData, displayGalleryItem) {
  addToGallery = displayGalleryItem;
  if (!postData) return;

  const { dataUrl, title } = postData;
  if (dataUrl?.includes('reddit.com/gallery/')) {
    const links = await getRedditGalleryIDs(dataUrl);
    links?.forEach((link, counter) => createGalleryItem({
      ...postData,
      title: `${title} (${counter + 1}/${links.length})`,
      dataUrl: link,
    }));
    return;
  }

  createGalleryItem(postData);
}

function createGalleryItem(postData) {
  try {
    const {
      dataUrl,
      dataPermalink,
      title,
      dataSubredditPrefixed: subredditPrefixed,
      dataAuthor: author,
      dataTimestamp: timestamp,
      dataDomain,
      thumbnail
    } = postData;

    if (!thumbnail) return;

    const subredditUrl = `https://old.reddit.com/${subredditPrefixed}`;
    const postAuthorUrl = `https://old.reddit.com/user/${author}`;
    const postAuthorWwwUrl = `https://www.reddit.com/user/${author}`;
    const commentUrl = `https://www.reddit.com${dataPermalink}`;


    /**
     * Quash dupes
     */
    if (dataUrl && linkDict[dataUrl]) {
      return;
    }

    linkDict[dataUrl] = true;

    const childElementData = []


    /**
     * Here's where we handle different media sources
     */

    let modifiedDataUrl = dataUrl;

    if (dataUrl?.includes("imgur.com") && dataUrl?.includes(".gifv")) {
      modifiedDataUrl = dataUrl.replace(".gifv", ".mp4");
    }

    if (dataUrl?.includes("v3.redgifs.com")) {
      modifiedDataUrl = dataUrl.replace("v3.redgifs.com", "www.redgifs.com");
    }

    if (modifiedDataUrl?.includes(".mp4")) {
      childElementData.push({
        tag: 'div',
        className: 'gallery-item-video',
        children: [
          {
            tag: 'a',
            href: modifiedDataUrl,
            target: '_blank',
            children: [
              {
                tag: 'video',
                preload: 'metadata',
                muted: true,
                loop: true,
                children: [
                  {
                    tag: 'source',
                    src: modifiedDataUrl.replace(".gifv", ".webm"),
                    type: 'video/webm',
                  }
                ]
              }
            ]
          }
        ]
      });
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
              }
            ]
          }
        ]
      });
    } else {
      unsupported[dataDomain] = 1 + (unsupported[dataDomain] || 0);

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

    /**
     * Add the title and details
     */

    childElementData.push(
      {
        tag: 'div',
        className: 'gallery-item-details',
        children: [
          {
            tag: 'p',
            className: 'gallery-item-author',
            children: [
              // {
              //   tag: 'text',
              //   text: 'by ',
              // },
              {
                tag: 'b',
              },
              {
                tag: 'a',
                href: postAuthorUrl + '/submitted',
                target: '_blank',
                text: author,
              },
              {
                tag: 'a',
                className: 'gallery-item-author-block',
                href: postAuthorWwwUrl,
                target: '_blank',
                text: ' 🚫',
              }
            ]
          },
          {
            tag: 'p',
            className: 'gallery-item-subreddit',
            children: [
              {
                tag: 'text',
                text: 'on ',
              },
              {
                tag: 'a',
                href: subredditUrl,
                target: '_blank',
                text: subredditPrefixed,
              }
            ]
          },
          {
            tag: 'p',
            className: 'gallery-item-comments',
            children: [
              {
                tag: 'a',
                href: commentUrl,
                target: '_blank',
                text: `at ${(new Date(parseInt(timestamp))).toLocaleString()}`,
              }
            ]
          },
          // {
          //   tag: 'p',
          //   className: 'gallery-item-title',
          //   children: [
          //     {
          //       tag: 'a',
          //       href: dataUrl,
          //       target: '_blank',
          //       text: title,
          //     }
          //   ]
          // },
        ]
      }
    );


    /**
     * Turn the gallery item data into elements
     */

    const galleryItemData = [
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

    // addToGallery(galleryItem[0]);
  } catch (error) {
    console.debug('Error in createGalleryItem', error);
  }
}

async function getRedditGalleryIDs(url) {
  try {
    url = url.replace('www', 'old').replace('gallery', 'comments').replace(/\/+$/, '');
    const response = await fetch(url + '.json');
    const data = await response.json();
    const mediaData = data[0].data.children[0].data.media_metadata;
    const rawLinks = Object.values(mediaData).map(data => {
      const linkChoice = data.s.u || data.s.mp4;
      return linkChoice.split('?')[0];
    });
    return rawLinks.map(link => link.replace('preview', 'i'));
  } catch (error) {
    console.debug('Error in getMultipleImages', error);
    console.debug('url:', url);
  }
}

function createElements(data) {
  return data.map(item => {
    if (item.tag === 'text') {
      return document.createTextNode(item.text);
    }

    const element = document.createElement(item.tag);

    for (const [key, value] of Object.entries(item)) {
      if (key === 'tag') {
        continue;
      }
      if (item.text) {
        element.append(document.createTextNode(item.text));
        delete item.text;
      }
      if (key === 'children') {
        element.append(...createElements(value));
        continue;
      }
      element[key] = value;
    }

    if ( item.tag === 'video' ) handleVideoLoading(element);
    if ( item.tag === 'img' ) handleImageLoading(element);

    return element;
  })
}

function addSizeToLoadedElement(element, widthRatio, heightRatio) {
  element.style.gridRow = `span ${heightRatio + 2}`;
  if (widthRatio > 15) {
    element.style.gridColumn = `span 20`;
    element.style.gridRow = `span 13`;
  }

  addToGallery(element);
  setTimeout(() => {
    element?.classList.add('visible');
  }, 100);
}

function handleVideoLoading(element) {
  element.addEventListener('loadeddata', function({target}) {
    try {
      const widthRatio = Math.floor(target.videoWidth/target.videoHeight*10);
      const heightRatio = Math.floor(target.videoHeight/target.videoWidth*10);
      const galleryItemContainerElement = element.closest('.gallery-item-container');
      addSizeToLoadedElement(galleryItemContainerElement, widthRatio, heightRatio);
    } catch (err) {
      console.debug('video event listener error:', err);
    }
  }, false);
}

function handleImageLoading(element) {
  if (element.src.includes('redd.it')) {
    element.crossOrigin = "anonymous"; // needed for canvas manipulation
  }

  element.onload = function({target}) {
    if(target.src.includes('imgur.com') && target.height === 81 && target.width === 161) {
      // standard size for "removed" image
      return;
    }
    const galleryItemContainerElement = element.closest('.gallery-item-container');
    // if (element.src.includes('redd.it') && dupeImg(element)) {
    //   galleryItemContainerElement.parentNode.removeChild(galleryItemContainerElement);
    // }
    const widthRatio = Math.floor(target.naturalWidth/target.naturalHeight*10);
    const heightRatio = Math.floor(target.naturalHeight/target.naturalWidth*10);
    addSizeToLoadedElement(galleryItemContainerElement, widthRatio, heightRatio);
  }

  element.onerror = function(event) {
    console.debug(`load error: ${event}`, event);
    element.closest('.gallery-item-container').classList.add('visible');
  }
}

const seenImgData = [];

function dupeImg(img) {
  const ext = img.src.substring(img.src.lastIndexOf('.')+1, img.src.length);
  if (ext !== 'jpg' && ext !== 'png' && ext !== 'gif') return false;

  try {
    let canvas = document.createElement('canvas');
    canvas.height = img.height;
    canvas.width = img.width;

    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    let dataURL = canvas.toDataURL(`image/${ext}`);
    canvas = null;

    let sample = dataURL.substring(0,100);

    if (seenImgData.includes(sample)) {
      return true;
    }

    seenImgData.push(sample);
    return false;
  } catch(err) {
    console.debug('dupe detection error:', err);
  }
}
