const linkDict = {};
const unsupported = {};

function recognizedUrl(url) {
  const recognizedUrls = [
    'https://i.redd.it/',
    'https://v.redd.it/',
    'https://i.imgur.com/',
  ];
  return recognizedUrls.some(recognizedUrl => url.includes(recognizedUrl));
}

async function createGalleryItems(postData) {
  const { dataUrl, title } = postData;
  if (dataUrl?.includes('reddit.com/gallery/')) {
    const links = await getRedditGalleryIDs(dataUrl);
    return links?.map((link, counter) => createGalleryItem({
      ...postData,
      title: `${title} (${counter + 1}/${links.length})`,
      dataUrl: link,
    }));
  }

  const singleItem = createGalleryItem(postData);
  return [singleItem];
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
  
    const subredditUrl = `https://old.reddit.com/${subredditPrefixed}`;
    const postAuthorUrl = `https://old.reddit.com/user/${author}`;
    const commentUrl = `https://www.reddit.com${dataPermalink}`;


    /**
     * Quash dupes
     */
    if (dataUrl && linkDict[dataUrl]) {
      console.debug('dupe mediaUrl:', dataUrl);
      return [null];
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
  
    if (modifiedDataUrl?.includes(".mp4")) {
      childElementData.push({
        tag: 'p',
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
      childElementData.push({
        tag: 'p',
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
        tag: 'p',
        className: 'gallery-item-thumb',
        children: [
          {
            tag: 'a',
            href: dataUrl || dataPermalink,
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
      },
      // {
      //   tag: 'p',
      //   className: 'gallery-item-domain',
      //   children: [
      //     {
      //       tag: 'a',
      //       href: dataUrl || dataPermalink,
      //       target: '_blank',
      //       text: dataDomain,
      //     }
      //   ]
      // }
      );
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
            className: 'gallery-item-title',
            children: [
              {
                tag: 'a',
                href: dataUrl,
                target: '_blank',
                text: title,
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
            className: 'gallery-item-author',
            children: [
              {
                tag: 'text',
                text: 'by ',
              },
              {
                tag: 'b',
              },
              {
                tag: 'a',
                href: postAuthorUrl + '/submitted',
                target: '_blank',
                text: author,
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
          }
        ]
      }
    );

    
    /**
     * Turn the gallery item data into elements
     */
  
    const galleryItemData = [
      {
        tag: 'div',
        className: 'gallery-item',
        children: childElementData
      }
    ];

    const galleryItem = createElements(galleryItemData);
         
    return galleryItem[0];
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

    return element;
  })
}