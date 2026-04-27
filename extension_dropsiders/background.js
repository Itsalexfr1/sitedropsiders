const API_URL = 'https://dropsiders.fr/api/extension/latest';

// Create alarm on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Dropsiders Extension Installed');
  chrome.alarms.create('checkUpdates', { periodInMinutes: 5 });
  checkUpdates(); // Check immediately
});

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkUpdates') {
    checkUpdates();
  }
});

async function checkUpdates() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) return;
    
    const data = await response.json();
    const { latestNews, manualPush } = data;

    // 1. Check for manual push
    if (manualPush) {
      const lastManualId = await getStorage('lastManualId');
      if (manualPush.id !== lastManualId) {
        showNotification(
          'manual_' + manualPush.id,
          manualPush.title || 'Dropsiders Alert',
          manualPush.message || 'Nouvelle annonce disponible !',
          manualPush.url || 'https://dropsiders.fr'
        );
        await setStorage('lastManualId', manualPush.id);
      }
    }

    // 2. Check for latest news
    if (latestNews) {
      const lastNewsId = await getStorage('lastNewsId');
      if (latestNews.id !== lastNewsId) {
        showNotification(
          'news_' + latestNews.id,
          'Nouveau sur Dropsiders !',
          latestNews.title,
          `https://dropsiders.fr/news/${latestNews.id}`
        );
        await setStorage('lastNewsId', latestNews.id);
      }
    }

  } catch (error) {
    console.error('Error checking updates:', error);
  }
}

function showNotification(id, title, message, url) {
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: 'icon.png',
    title: title,
    message: message,
    priority: 2
  });
  // Store the URL for this specific notification
  chrome.storage.local.set({ [`url_${id}`]: url });
}

// Handle notification click
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.storage.local.get([`url_${notificationId}`], (result) => {
    const url = result[`url_${notificationId}`] || 'https://dropsiders.fr';
    chrome.tabs.create({ url: url });
    // Cleanup
    chrome.storage.local.remove([`url_${notificationId}`]);
  });
});

// Helper functions for storage
function getStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key]);
    });
  });
}

function setStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
}
