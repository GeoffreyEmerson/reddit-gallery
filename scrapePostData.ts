function scrapePostData(
  element: Element,
  createGalleryItems: (data: Record<string, unknown>, displayGalleryItem: (galleryItem: Element) => void) => void,
  displayGalleryItem: (galleryItem: Element) => void,
) {
  try {
    if (
      element?.className === 'clearleft' ||
      !element?.className.includes('thing') ||
      element.className.includes('promoted')
    ) {
      return null;
    }

    const data = element.getAttributeNames().reduce<Record<string, string | null>>((acc, name) => {
      return { ...acc, [camelize(name)]: element.getAttribute(name) };
    }, {});

    if (data.dataType !== 'link') console.debug('[Reddit-Gallery] data.dataType:', data.dataType);
    if (data.promoted) console.debug('[Reddit-Gallery] data.promoted:', data.promoted);

    if (data.promoted || data.dataType !== 'link') {
      return null;
    }

    const titleAnchor = element.querySelector('a.title') as HTMLAnchorElement | null;
    data.title = titleAnchor?.textContent ?? null;

    const thumbnailElement = element.querySelector('a.thumbnail img');
    data.thumbnail = thumbnailElement?.getAttribute('src') ?? null;

    if (!data.dataUrl) {
      if (data.class?.includes('nav-buttons')) return null;

      if (!data.dataPermalink) {
        console.debug(`[Reddit-Gallery] --------------------------------`);
        console.debug('[Reddit-Gallery] NO LINKS FOUND:', JSON.stringify(data));
        console.debug(`[Reddit-Gallery] --------------------------------`);
        return null;
      }
      console.debug(`[Reddit-Gallery] --------------------------------`);
      console.debug('[Reddit-Gallery] dataLink without dataUrl:', JSON.stringify(data));
      console.debug(`[Reddit-Gallery] --------------------------------`);
    }

    // console.debug('[Reddit-Gallery] scrapePostData data:', data);

    createGalleryItems(data, displayGalleryItem);
  } catch (error) {
    console.debug('[Reddit-Gallery] Error in scrapePostData', error);
  }
}

function camelize(s: string) {
  return s.replace(/-./g, (x) => x[1].toUpperCase());
}
