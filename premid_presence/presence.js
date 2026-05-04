const presence = new Presence({
	clientId: "1481163258080788602"
});

presence.on("Update", () => {
	const data = {
		details: "Explorant l'univers Hardstyle",
		state: "Sur Dropsiders.fr",
		largeImageKey: "https://dropsiders.fr/logo_presentation.png",
		largeImageText: "Dropsiders - Media Hardstyle",
		smallImageKey: "https://dropsiders.fr/icon.png",
		smallImageText: "Dropsiders",
		startTimestamp: Date.now()
	};

	const url = window.location.pathname;
	console.log("[Dropsiders PreMiD] Path detected:", url);

	if (url.includes("/news/")) {
		const title = document.querySelector("h1")?.innerText || "une news";
		data.details = "Lit une News";
		data.state = title;
	} else if (url.includes("/agenda")) {
		data.details = "Consulte l'Agenda";
		data.state = "Découvre les prochains événements";
	} else if (url.includes("/recaps")) {
		data.details = "Regarde un Récap";
		data.state = "Revivre les meilleurs moments";
	} else if (url.includes("/live")) {
		data.details = "Regarde le Live 🔴";
		data.state = "En plein set Hardstyle";
	} else if (url === "/") {
		data.details = "Page d'Accueil";
		data.state = "Dernières sorties Hardstyle";
	}

	presence.setActivity(data);
});
