document.addEventListener("DOMContentLoaded", async () => {
  const STORAGE_KEY = "bibliotheque";

  // === 🔧 UTILS : Fonctions de LocalStorage ===

  // Récupère les livres depuis localStorage ou retourne un tableau vide
  const getLivres = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  // Sauvegarde les livres dans localStorage
  const saveLivres = (livres) => localStorage.setItem(STORAGE_KEY, JSON.stringify(livres));

  // Récupère l'état de visibilité des colonnes
  const getColonnesVisibles = () =>
    JSON.parse(localStorage.getItem("colonnesVisibles")) || {
      "a-lire": true,
      "en-cours": true,
      "lu": true,
    };

  // Sauvegarde l'état des colonnes
  const saveColonnesVisibles = (etat) =>
    localStorage.setItem("colonnesVisibles", JSON.stringify(etat));

  // === 📦 CHARGEMENT : Depuis API ou localStorage ===

  let livres = getLivres();

  if (livres.length === 0) {
    try {
      const res = await fetch("https://keligmartin.github.io/api/books.json");
      const data = await res.json();

      // Ajoute des propriétés manquantes à chaque livre
      livres = data.map((livre) => ({
        ...livre,
        colonne: "a-lire",
        note: null,
        commentaire: "",
      }));

      saveLivres(livres);
    } catch (err) {
      console.error("Erreur lors du chargement des livres :", err);
    }
  }

  // === 📘 UI : Création de carte pour chaque livre ===

  const createCard = (livre) => {
    const carte = document.createElement("div");
    carte.className = "book-card";
    carte.textContent = livre.title;
    carte.setAttribute("draggable", "true");
    carte.dataset.isbn = livre.isbn;

    // Début du drag
    carte.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", livre.isbn);
    });

    // Clic sur la carte → ouvrir modal avec détails et formulaire note/commentaire
    carte.addEventListener("click", () => {
      const noteOptions = [1, 2, 3, 4, 5]
        .map((n) => `<option value="${n}" ${livre.note == n ? "selected" : ""}>${n}</option>`)
        .join("");

      const contenu = `
        <p><strong>Titre :</strong> ${livre.title}</p>
        <p><strong>Auteur :</strong> ${livre.author || "Inconnu"}</p>
        ${livre.subtitle ? `<p><strong>Sous-titre :</strong> ${livre.subtitle}</p>` : ""}
        <p><strong>Pages :</strong> ${livre.pages || "?"}</p>
        <p><strong>Publié le :</strong> ${livre.published ? new Date(livre.published).toLocaleDateString() : "?"}</p>
        <p><strong>Éditeur :</strong> ${livre.publisher || "?"}</p>
        <p><strong>Description :</strong><br>${livre.description || "Aucune description."}</p>
        ${livre.website ? `<p><a href="${livre.website}" target="_blank">Voir le site officiel</a></p>` : ""}

        <hr>
        <form id="form-note-${livre.isbn}">
          <div class="mb-3">
            <label for="note-${livre.isbn}" class="form-label"><strong>Note (1 à 5)</strong></label>
            <select id="note-${livre.isbn}" class="form-select">${noteOptions}</select>
          </div>
          <div class="mb-3">
            <label for="commentaire-${livre.isbn}" class="form-label"><strong>Commentaire</strong></label>
            <textarea id="commentaire-${livre.isbn}" class="form-control" rows="3">${livre.commentaire || ""}</textarea>
          </div>
          <button type="submit" class="btn btn-success">Enregistrer</button>
        </form>
      `;

      document.getElementById("contenuModal").innerHTML = contenu;
      const modal = new bootstrap.Modal(document.getElementById("livreModal"));
      modal.show();

      // Sauvegarde de la note/commentaire
      document.getElementById(`form-note-${livre.isbn}`).addEventListener("submit", (e) => {
        e.preventDefault();
        const nouvelleNote = parseInt(document.getElementById(`note-${livre.isbn}`).value);
        const nouveauCommentaire = document.getElementById(`commentaire-${livre.isbn}`).value;

        livres = livres.map((l) =>
          l.isbn === livre.isbn ? { ...l, note: nouvelleNote, commentaire: nouveauCommentaire } : l
        );

        saveLivres(livres);
        modal.hide();
      });
    });

    return carte;
  };

  // === 🧱 UI : Afficher les cartes dans les bonnes colonnes ===

  const afficherLivres = (livres) => {
    document.querySelectorAll(".book-column").forEach((col) => (col.innerHTML = ""));
    livres.forEach((livre) => {
      const colonne = document.getElementById(livre.colonne || "a-lire");
      const carte = createCard(livre);
      colonne.appendChild(carte);
    });
  };

  afficherLivres(livres);

  // === 📂 COLONNES : Affichage dynamique ===

  const colonnesVisibles = getColonnesVisibles();

  Object.entries(colonnesVisibles).forEach(([id, visible]) => {
    const col = document.getElementById(id)?.parentElement;
    if (col) {
      col.style.display = visible ? "block" : "none";
      const checkbox = document.querySelector(`#toggle-${id}`);
      if (checkbox) checkbox.checked = visible;
    }
  });

  document.querySelectorAll(".colonne-toggle").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const id = checkbox.dataset.colonne;
      const visible = checkbox.checked;

      colonnesVisibles[id] = visible;
      const col = document.getElementById(id)?.parentElement;
      if (col) col.style.display = visible ? "block" : "none";
      saveColonnesVisibles(colonnesVisibles);
    });
  });

  // === 📤 DRAG & DROP des livres entre colonnes ===

  const colonnes = document.querySelectorAll(".book-column");

  colonnes.forEach((col) => {
    col.addEventListener("dragover", (e) => e.preventDefault());

    col.addEventListener("drop", (e) => {
      e.preventDefault();
      const isbn = e.dataTransfer.getData("text/plain");
      const carte = document.querySelector(`.book-card[data-isbn='${isbn}']`);
      col.appendChild(carte);

      livres = livres.map((livre) =>
        livre.isbn === isbn ? { ...livre, colonne: col.id } : livre
      );

      saveLivres(livres);
    });

    col.addEventListener("dragenter", () => col.classList.add("dragover"));
    col.addEventListener("dragleave", () => col.classList.remove("dragover"));
    col.addEventListener("drop", () => col.classList.remove("dragover"));
  });

  // === 🔍 RECHERCHE temps réel (titre ou auteur) ===

  const inputRecherche = document.getElementById("recherche");

  if (inputRecherche) {
    inputRecherche.addEventListener("input", () => {
      const terme = inputRecherche.value.toLowerCase();

      document.querySelectorAll(".book-card").forEach((carte) => {
        const titre = carte.textContent.toLowerCase();
        const isbn = carte.dataset.isbn;
        const livre = livres.find((l) => l.isbn === isbn);
        const auteur = (livre?.author || "").toLowerCase();

        const visible = titre.includes(terme) || auteur.includes(terme);
        carte.style.display = visible ? "block" : "none";
      });
    });
  }

  // === ➕ FORMULAIRE : Ajout d'un nouveau livre ===

  const formAjout = document.getElementById("form-ajout-livre");

  if (formAjout) {
    formAjout.addEventListener("submit", (e) => {
      e.preventDefault();

      const titre = document.getElementById("titre").value.trim();
      const auteur = document.getElementById("auteur").value.trim();
      const pages = parseInt(document.getElementById("pages")?.value) || null;
      const image = document.getElementById("image")?.value.trim();
      const description = document.getElementById("description")?.value.trim();

      if (!titre || !auteur) {
        alert("Veuillez remplir au minimum le titre et l’auteur !");
        return;
      }

      const nouveauLivre = {
        isbn: `user-${Date.now()}`,
        title: titre,
        author: auteur,
        pages: pages,
        description: description || "",
        website: image || "",
        colonne: "a-lire",
        note: null,
        commentaire: ""
      };

      livres.push(nouveauLivre);
      saveLivres(livres);
      afficherLivres(livres);
      formAjout.reset();
    });
  }
});
