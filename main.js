try {
  console.debug(`---------------------------------`);
  console.debug("Running Reddit Gallery Extension!");
  console.debug(`---------------------------------`);

  /**
   * Set up gallery grid
   */
  
  const topSiteTable = document.getElementById("siteTable")
  const galleryContainer = document.createElement("div");
  galleryContainer.className = "grid-definitions";
  topSiteTable.insertBefore(galleryContainer, topSiteTable.firstChild)
  

  /**
   * Process posts found on page load
   */
  
  collectSiteTableData(topSiteTable);


  /**
   * Watch for new posts
   */

  onNewPosts(topSiteTable, collectSiteTableData)


  /** 
   * Scrape Posts and display Gallery Items
  */

  async function collectSiteTableData(element) {
    if(element?.className?.includes("sitetable")){
      element.children.forEach((childElement) => {
        scrapePostData(childElement, createGalleryItems, displayGalleryItem);
      });
    }
  }

  function displayGalleryItem(galleryItem) {
    try {
      if (galleryItem?.outerHTML) {
        galleryContainer.appendChild(galleryItem)
      };
    } catch (error) {
      console.debug("Error in displayGalleryItem", error);
    }
  }
} catch (err) {
  console.debug(`-- error in Reddit Gallery: main.js - ${err}`);
}
