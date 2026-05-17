/* global onNewPosts, scrapePostData, createGalleryItems */

main();

function main() {
  try {
    console.debug(`---------------------------------`);
    console.debug("Running Reddit Gallery Extension!");
    console.debug(`---------------------------------`);

    /**
     * Set up gallery grid
     */
    
    const topSiteTable = document.getElementById("siteTable");
    const galleryContainer = document.createElement("div");
    galleryContainer.className = "grid-definitions";
    topSiteTable.insertBefore(galleryContainer, topSiteTable.firstChild);
    

    /**
     * Process posts found on page load
     */
    
    collectSiteTableData(topSiteTable, galleryContainer);


    /**
     * Watch for new posts
     */

    onNewPosts(topSiteTable, (element) => collectSiteTableData(element, galleryContainer));
  } catch (err) {
    console.debug(`-- error in Reddit Gallery: main.js - ${err}`);
  }
}


async function collectSiteTableData(element, galleryContainer) {
  if (element?.className?.includes("sitetable")) {
    for (const childElement of element.children) {
      scrapePostData(childElement, createGalleryItems, (galleryItem) => displayGalleryItem(galleryItem, galleryContainer));
    }
  }
}

function displayGalleryItem(galleryItem, galleryContainer) {
  try {
    if (galleryItem?.outerHTML) {
      galleryContainer.appendChild(galleryItem);
    }
  } catch (error) {
    console.debug("Error in displayGalleryItem", error);
  }
}