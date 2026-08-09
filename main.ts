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
    if (!topSiteTable) {
      return;
    }

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

    onNewPosts(topSiteTable, (element: Node) => collectSiteTableData(element, galleryContainer));
  } catch (err) {
    console.debug(`[Reddit-Gallery] error in Reddit Gallery: main.ts - ${err}`);
  }
}

async function collectSiteTableData(element: Element | Node, galleryContainer: HTMLElement) {
  if (element instanceof Element && element.className.includes("sitetable")) {
    for (const childElement of Array.from(element.children)) {
      scrapePostData(childElement as Element, createGalleryItems, (galleryItem: Element) => displayGalleryItem(galleryItem, galleryContainer));
    }
  }
}

function displayGalleryItem(galleryItem: Element, galleryContainer: HTMLElement) {
  try {
    if (galleryItem?.outerHTML) {
      galleryContainer.appendChild(galleryItem);
    }
  } catch (error) {
    console.debug("[Reddit-Gallery] Error in displayGalleryItem", error);
  }
}