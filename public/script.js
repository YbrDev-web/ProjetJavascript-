document.addEventListener("DOMContentLoaded", async () => {
  let livresApi = [];
  let livresLocaux = [];
  let livres = [];

  const createCard = (livre) => {
    const carte = document.createElement("div");
    carte.className = "book-card mb-2 p-2 border rounded bg-white";
    carte.textContent = livre.title;
    carte.setAttribute("draggable", "true");
    carte.dataset.isbn = livre.isbn;

    carte.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", livre.isbn);
    });

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

      document.getElementById(`form-note-${livre.isbn}`).addEventListener("submit", async (e) => {
        e.preventDefault();
        const nouvelleNote = parseInt(document.getElementById(`note-${livre.isbn}`).value);
        const nouveauCommentaire = document.getElementById(`commentaire-${livre.isbn}`).value;

        livresLocaux = livresLocaux.map((l) =>
          l.isbn === livre.isbn ? { ...l, note: nouvelleNote, commentaire: nouveauCommentaire } : l
        );

        await fetch("/api/livres", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(livresLocaux.find((l) => l.isbn === livre.isbn)),
        });

        updateAffichage();
        modal.hide();
      });
    });

    return carte;
  };

  const afficherLivres = (livres) => {
    document.querySelectorAll(".book-column").forEach((col) => (col.innerHTML = ""));
    livres.forEach((livre) => {
      const colonne = document.getElementById(livre.colonne || "a-lire");
      const carte = createCard(livre);
      colonne?.appendChild(carte);
    });
  };

  const updateAffichage = () => {
    const isbnLocaux = new Set(livresLocaux.map((l) => l.isbn));
    livres = [
      ...livresLocaux,
      ...livresApi.filter((l) => !isbnLocaux.has(l.isbn))
    ];
    afficherLivres(livres);
  };

  try {
    const resApi = await fetch("https://keligmartin.github.io/api/books.json");
    const dataApi = await resApi.json();
    livresApi = dataApi.map((livre) => ({
      ...livre,
      colonne: livre.colonne || "a-lire",
      note: livre.note ?? null,
      commentaire: livre.commentaire ?? "",
    }));
  } catch (err) {
    console.error("Erreur API distante :", err);
  }

  try {
    const resLocal = await fetch("/api/livres");
    livresLocaux = await resLocal.json();
  } catch (err) {
    console.error("Erreur API locale :", err);
    livresLocaux = [];
  }

  updateAffichage();

  document.getElementById("form-ajout-livre").addEventListener("submit", async (e) => {
    e.preventDefault();
    const titre = document.getElementById("titre").value.trim();
    const auteur = document.getElementById("auteur").value.trim();
    if (!titre || !auteur) return;

    const nouveauLivre = {
      isbn: "manuel-" + Date.now(),
      title: document.getElementById("titre").value.trim(),
      author: document.getElementById("auteur").value.trim(),
      subtitle: document.getElementById("sousTitre").value.trim() || null,
      pages: parseInt(document.getElementById("pages").value) || null,
      published: document.getElementById("published").value || null,
      publisher: document.getElementById("editeur").value.trim() || null,
      description: document.getElementById("description").value.trim() || "",
      website: document.getElementById("lien").value.trim() || null,
      colonne: "a-lire",
      note: null,
      commentaire: "",
    };
    

    const res = await fetch("/api/livres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nouveauLivre),
    });

    if (res.ok) {
      const livreAjoute = await res.json();
      livresLocaux.push(livreAjoute);
      updateAffichage();
      e.target.reset();
    } else {
      alert("Erreur lors de l’ajout du livre.");
    }
  });

  document.querySelectorAll(".book-column").forEach((col) => {
    col.addEventListener("dragover", (e) => e.preventDefault());

    col.addEventListener("drop", async (e) => {
      e.preventDefault();
      const isbn = e.dataTransfer.getData("text/plain");
      const carte = document.querySelector(`.book-card[data-isbn='${isbn}']`);
      col.appendChild(carte);
    
      let livre = livres.find((l) => l.isbn === isbn);
      if (!livre) return;
    
      const existeDansLocaux = livresLocaux.some((l) => l.isbn === isbn);
    
      if (!existeDansLocaux) {
        livre = { ...livre, colonne: col.id };
        livresLocaux.push(livre);
      } else {
        livresLocaux = livresLocaux.map((l) =>
          l.isbn === isbn ? { ...l, colonne: col.id } : l
        );
        livre = livresLocaux.find((l) => l.isbn === isbn); // 🔁 reprendre la bonne version
      }
    
      // 🔄 Enregistrer dans le backend
      await fetch("/api/livres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(livre),
      });
    
      updateAffichage();
    });
    
  });

  const inputRecherche = document.getElementById("recherche");
  inputRecherche?.addEventListener("input", () => {
    const terme = inputRecherche.value.toLowerCase();
    document.querySelectorAll(".book-card").forEach((carte) => {
      const titre = carte.textContent.toLowerCase();
      const isbn = carte.dataset.isbn;
      const livre = livres.find((l) => l.isbn === isbn);
      const auteur = (livre?.author || "").toLowerCase();
      carte.style.display = titre.includes(terme) || auteur.includes(terme) ? "block" : "none";
    });
  });
});
