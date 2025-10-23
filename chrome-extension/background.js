// Background service worker for WebSurf AI

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('WebSurf AI extension installed');
});
