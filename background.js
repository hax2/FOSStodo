function createPopup() {
    chrome.windows.create({
      url: chrome.runtime.getURL("popup.html"),
      type: "popup",
      left: 0,
      top: 0,
      width: 400,
      height: 500 // Set a static height
    });
  }
  
  chrome.commands.onCommand.addListener((command) => {
    if (command === "open_todo_list") {
      createPopup();
    }
  });
  