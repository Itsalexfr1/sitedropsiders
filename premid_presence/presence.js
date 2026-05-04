const presence = new Presence({
    clientId: "1481163258080788602"
});

presence.on("Update", () => {
    const data = {
        details: "Sur le site",
        state: "Dropsiders.fr",
        largeImageKey: "logo_presentation", // Utilisation de la clé d'asset si possible, sinon URL complète
        largeImageText: "Dropsiders",
        startTimestamp: Math.floor(Date.now() / 1000)
    };

    // On force l'image par défaut si l'URL ne marche pas
    const defaultImage = "https://dropsiders.fr/logo_presentation.png";
    data.largeImageKey = defaultImage;

    const url = window.location.href;
    const path = window.location.pathname;

    if (path.includes("/news/")) {
        data.details = "Lit une News";
        data.state = document.title.split('|')[0].trim();
    } 
    else if (path.includes("/agenda")) {
        data.details = "Consulte l'Agenda";
        data.state = "Cherche un festival";
    }
    else if (path.includes("/recaps/")) {
        data.details = "Regarde un Récap";
        data.state = document.title.split('|')[0].trim();
    }
    else if (path.includes("/live")) {
        data.details = "Regarde Dropsiders TV";
        data.state = "En direct";
    }
    else {
        data.details = "Exploration";
        data.state = "Page d'accueil";
    }

    presence.setActivity(data);
});
