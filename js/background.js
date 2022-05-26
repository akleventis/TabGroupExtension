// make chormestorage get a promise instead of callback avoid callback hell muahhahahah
function chromeStorageGet(result) {
  return new Promise((resolve, reject) => {
    if (resolve) {
      resolve(result);
    } else {
      reject();
    }
  });
}

let isSearchTermInUrl =  (url, searchTerms) => {
  if(searchTerms) {
    for(let i = 0; i < searchTerms.length; i++) {
      if(url.includes(searchTerms[i])) {
        return true;
      }
    }
    return false;
  }
}

//function looks through a current browswerTabGroupObject and a the a chromeStorageTabGroup Object and if the name of one of the tab group objects
// in the the browser matches the name from chrome storage object it puts in that tab group and returns true, otherwise returns false
function groupTabIfTabGroupExistsInBrowser(browserTabGroupObject, chromeStorageTabGroupObject, tabId) {
  let matchingTabGroupInBrowser = false;
  console.log("chrome storage object is " + chromeStorageTabGroupObject);
  for (let i = 0; i < browserTabGroupObject.length; i++) {
    if (
      chromeStorageTabGroupObject &&
      browserTabGroupObject[i].title === chromeStorageTabGroupObject.NAME
    ) {
      matchingTabGroupInBrowser = true;
      chrome.tabs.group({
        tabIds: tabId,
        groupId: browserTabGroupObject[i].id,
      });
    }
  }
  return matchingTabGroupInBrowser;
}
// listener that can tell if a tab changes or a  new html page loads or if a new tab is opened
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // only exectue if tabs are fully loaded
  if (changeInfo.status === 'complete' && tab.status === 'complete' && tab.url !== undefined ) {
    //this gets a list of all tab groups in broswer and returns an object of them
    chrome.tabGroups.query({}).then((tabGroupObj) => {
      // this is promise chain of chrome.storage.get instead of callback
      chromeStorageGet(chrome.storage.sync.get(['TABGROUPS'])).then(
        (result) => {
          //gets the url of the updated tab
          const { url } = tab;
          if (Object.keys(result).length !== 0) {
            let ungroup = true;
            let matchingTabGroupInBrowser = false;
            for (let i = 0; i < result.TABGROUPS.length; i += 1) {
              const group = `GROUP${String(i + 1)}`;
              if ( Object.prototype.hasOwnProperty.call(result.TABGROUPS[i], group) ) {
                const searchTerms = result.TABGROUPS[i][group].URL;
                if (isSearchTermInUrl(url, searchTerms)) {
                  ungroup = false;
                  matchingTabGroupInBrowser = groupTabIfTabGroupExistsInBrowser(tabGroupObj, result.TABGROUPS[i][group], tabId);
                  if (!matchingTabGroupInBrowser) {
                    // if tab doesn't have a group id already and no other tabs following that same
                    // group rule, make a new tab group and update localvariable groupIDArray with a
                    // property TABGROUP that holds that id
                    chrome.tabs.group({ tabIds: tabId }).then((id) => {
                      chrome.tabGroups.update(id, {
                        title: result.TABGROUPS[i][group].NAME,
                        color: result.TABGROUPS[i][group].COLOR,
                      });
                    });
                  }
                  //if it loops through all tab groups in window and no matches found create a new tab group
              }
            }
          //if this code exectutes no matches where found on this tab id so ungroup this tab id from tabgroups if it is in one.
          if (ungroup) {chrome.tabs.ungroup(tabId)}
          }
        }
      }
      );
    });
  }
});