const API_URL = 'https://dropsiders.fr/api/extension/latest';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('news-container');
  const loading = document.getElementById('loading');

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Network error');
    
    const data = await response.json();
    loading.style.display = 'none';

    if (data.latestNews) {
      const item = data.latestNews;
      const card = document.createElement('div');
      card.className = 'news-card';
      card.innerHTML = `
        <img src="${item.image || 'icon.png'}" alt="">
        <h2>${item.title}</h2>
        <div class="date">${item.date || ''}</div>
      `;
      card.onclick = () => {
        window.open(`https://dropsiders.fr/news/${item.id}`, '_blank');
      };
      container.appendChild(card);
    } else {
      container.innerHTML = '<div style="text-align:center;color:#666;font-size:11px;">Aucune actualité trouvée.</div>';
    }

    if (data.manualPush) {
        // Optionnel: afficher l'alerte manuelle en haut
    }

  } catch (error) {
    loading.innerText = 'Erreur de connexion';
    console.error(error);
  }
});
