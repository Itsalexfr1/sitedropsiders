import { Presence, PresenceData } from 'premid';

const presence = new Presence({
  clientId: '1157640523048566794', // ID de l'application Discord Dropsiders
});

const browsingTimestamp = Math.floor(Date.now() / 1000);

enum ActivityAssets {
  Logo = 'https://dropsiders.fr/logo_black.png',
  Radio = 'https://dropsiders.fr/logo_black.png',
  Play = 'https://dropsiders.fr/logo_black.png',
}

presence.on('UpdateData', async () => {
  const { pathname, href } = document.location;

  const showRadio = presence.getSetting<boolean>('showRadio') ?? true;
  const showArticle = presence.getSetting<boolean>('showArticle') ?? true;
  const showButtons = presence.getSetting<boolean>('showButtons') ?? true;

  const presenceData: PresenceData = {
    largeImageKey: ActivityAssets.Logo,
    largeImageText: 'Dropsiders - Musique Électronique & Festivals',
    startTimestamp: browsingTimestamp,
  };

  // 1. ─── DÉTECTION RADIO EN COURS D'ÉCOUTE ──────────────────────────────────────
  if (showRadio) {
    // Vérifier si un son est en cours de lecture dans le lecteur Dropsiders
    const isPlaying = 
      document.querySelector('audio:not([paused])') !== null ||
      document.querySelector('[data-radio-playing="true"]') !== null ||
      document.querySelector('.animate-ping') !== null;

    // Récupérer le titre du morceau et l'artiste dans la barre radio
    const trackElem = document.querySelector('h4.font-display');
    const artistElem = trackElem?.nextElementSibling;
    const trackTitle = trackElem?.textContent?.trim();
    const artistName = artistElem?.textContent?.trim();

    if (isPlaying && trackTitle && trackTitle.length > 0) {
      presenceData.details = `🎵 ${trackTitle}`;
      presenceData.state = artistName ? `par ${artistName}` : 'Dropsiders Radio Live 24/7';
      presenceData.smallImageKey = ActivityAssets.Play;
      presenceData.smallImageText = 'En direct sur Dropsiders Radio';

      if (showButtons) {
        presenceData.buttons = [
          {
            label: 'Écouter la Radio',
            url: 'https://dropsiders.fr/radio',
          },
          {
            label: 'Visiter Dropsiders',
            url: 'https://dropsiders.fr',
          },
        ];
      }

      presence.setActivity(presenceData);
      return;
    }
  }

  // 2. ─── DÉTECTION PAGES DU SITE ──────────────────────────────────────────────
  if (pathname.startsWith('/news/') && showArticle) {
    const articleTitle = document.querySelector('h1')?.textContent?.trim() || 'Article Actualité';
    presenceData.details = articleTitle.slice(0, 120);
    presenceData.state = 'Lecture d\'une actualité';
    if (showButtons) {
      presenceData.buttons = [
        { label: 'Lire l\'article', url: href },
        { label: 'Découvrir Dropsiders', url: 'https://dropsiders.fr' },
      ];
    }
  } else if (pathname.startsWith('/recaps/') && showArticle) {
    const recapTitle = document.querySelector('h1')?.textContent?.trim() || 'Récapitulatif Festival';
    presenceData.details = recapTitle.slice(0, 120);
    presenceData.state = 'Découvre un récap de festival';
    if (showButtons) {
      presenceData.buttons = [
        { label: 'Voir le récap', url: href },
        { label: 'Dropsiders.fr', url: 'https://dropsiders.fr' },
      ];
    }
  } else if (pathname.includes('/agenda')) {
    presenceData.details = 'Consulte l\'Agenda des Festivals';
    presenceData.state = 'À la recherche des prochains events';
    if (showButtons) {
      presenceData.buttons = [
        { label: 'Voir l\'Agenda', url: 'https://dropsiders.fr/agenda' },
      ];
    }
  } else if (pathname.includes('/live') || pathname.includes('/tv')) {
    presenceData.details = 'Regarde Dropsiders TV';
    presenceData.state = 'Livesets & Clips en continu';
    if (showButtons) {
      presenceData.buttons = [
        { label: 'Regarder le Live', url: 'https://dropsiders.fr/tv' },
      ];
    }
  } else if (pathname.includes('/blind-test') || pathname.includes('/blindtest')) {
    presenceData.details = 'Joue au Blind Test Electro';
    presenceData.state = 'En pleine session quiz musical';
  } else if (pathname.includes('/social-studio')) {
    presenceData.details = 'Social Studio Dropsiders';
    presenceData.state = 'Création de visuels & vidéos';
  } else if (pathname.includes('/shop')) {
    presenceData.details = 'Visite la boutique Dropsiders';
    presenceData.state = 'Merch & Goodies';
  } else {
    presenceData.details = 'Explore Dropsiders';
    presenceData.state = 'Portail N°1 Festivals & Musique Electro';
    if (showButtons) {
      presenceData.buttons = [
        { label: 'Rejoindre Dropsiders', url: 'https://dropsiders.fr' },
      ];
    }
  }

  presence.setActivity(presenceData);
});
