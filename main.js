try {
  console.debug(`---------------------------------`);
  console.debug("Running Reddit Gallery Extension!");
  console.debug(`---------------------------------`);

  /**
   * Set up gallery grid
   */
  
  const topSiteTable = document.getElementById("siteTable")
  const gridContainer = document.createElement("div");
  gridContainer.className = "grid-container";
  topSiteTable.insertBefore(gridContainer, topSiteTable.firstChild)
  

  /**
   * Process posts found on page load
   */
  
  collectAndDisplaySiteTableData(topSiteTable);


  /**
   * Watch for new posts
   */

  onNewPosts(topSiteTable, collectAndDisplaySiteTableData)


  /** 
   * Scrape Posts and display Gallery Items
  */

  async function collectAndDisplaySiteTableData(element) {
    if(element?.className?.includes("sitetable")){
      for (const child of element.children) {
        const data = await scrapePostData(child);
        if (data) {
          const galleryItems = await createGalleryItems(data);
          galleryItems?.forEach(galleryItem => {
            try {
              if (galleryItem?.outerHTML) {
                gridContainer.appendChild(galleryItem)
              };
            } catch (error) {
              console.debug("Error in collectAndDisplaySiteTableData", error);
              
            }
          });
        }
      }
      
      // `unsupported` is a global variable from createGalleryItem.js
      // console.debug('unsupported:', JSON.stringify(unsupported, null, 2));
    }
  }
} catch (err) {
  console.debug(`-- error in Reddit Gallery: main.js - ${err}`);
}
