function scrapePostData(element, createGalleryItems, displayGalleryItem) {
  try {
    if (element?.className == "clearleft" 
        || !element?.className.includes("thing")
        || element.className.includes("promoted")
    ) {
      return null;
    };
  
    const data = element.getAttributeNames().reduce((acc, name) => {
      return {...acc, [camelize(name)]: element.getAttribute(name)};
    }, {});

    if (data.dataType !== "link") console.debug('data.dataType:', data.dataType);
    if (data.promoted) console.debug('data.promoted:', data.promoted);

    if (data.promoted || data.dataType != "link") {
      return null;
    }
  
    const titleAnchor = element.querySelector("a.title");
    data.title = titleAnchor?.innerText;    
  
    const thumbnailElement = element.querySelector('a.thumbnail img');
    data.thumbnail = thumbnailElement?.src;
  
    if (!data.dataUrl) {
      if (data.class.includes('nav-buttons')) {
        // navButtons.push(element); 
        return null;
      }
      if (!data.dataPermalink) {
        console.debug(`--------------------------------`);
        console.debug('NO LINKS FOUND:', JSON.stringify(data));
        console.debug(`--------------------------------`);
        return null;
      }
      console.debug(`--------------------------------`);
      console.debug('dataLink without dataUrl:', JSON.stringify(data));
      console.debug(`--------------------------------`);
    };
  
    createGalleryItems(data, displayGalleryItem);
  } catch (error) {
    console.debug('Error in scrapePostData', error);
  }
}

function camelize(s) {
  return s.replace(/-./g, x=>x[1].toUpperCase());
}
